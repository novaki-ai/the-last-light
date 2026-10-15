/**
 * Accelerated balance probes against the real browser engine.
 *
 * Start `npm run dev -- --port 4173`, then:
 *   node tests/simulation.mjs
 *   node tests/simulation.mjs --seeds=17,42 --invincible --max-seconds=1800
 *   node tests/simulation.mjs --url=http://localhost:5173 --out=artifacts/balance.json
 *
 * Each sample gets a fresh browser context and no purchased meta upgrades.
 * Only input, level-up choices, stage continuation, and muted audio are automated.
 * No XP, damage, spawns, health, timers, or combat rules are altered.
 * Invincibility is an explicitly labelled optional progression diagnostic.
 * The deterministic pilot is deliberately simple; wins demonstrate feasibility,
 * while losses are evidence about this pilot, not a human difficulty estimate.
 */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, '').split('=');
    return [key, value.length ? value.join('=') : true];
  }),
);
const baseURL = String(args.url || 'http://localhost:4173').replace(/\/$/, '');
const seeds = String(args.seeds || '17,42,109,777,2026')
  .split(',')
  .map(Number);
const invincible = args.invincible === true;
const maxSeconds = Number(args['max-seconds'] || 1800);
const output = String(args.out || `artifacts/simulation${invincible ? '-invincible' : ''}.json`);
const engineHash = createHash('sha256')
  .update(await readFile(new URL('../src/game.ts', import.meta.url)))
  .digest('hex');
if (
  !seeds.length ||
  seeds.some((seed) => !Number.isFinite(seed)) ||
  !Number.isFinite(maxSeconds) ||
  maxSeconds <= 0
) {
  throw new Error('Provide numeric seeds and a positive --max-seconds value.');
}

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const results = [];
try {
  for (const seed of seeds) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.text().startsWith('[simulation]')) console.log(message.text());
    });
    // Use the same origin and real Vite modules, without starting the renderer or
    // the actual menu's requestAnimationFrame loop beside the test instance.
    await page.route('**/__simulation', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html lang="en"><body><div id="ui"></div><div id="joystick"><div class="stick-knob"></div></div><button id="touch-dash">Dash</button></body></html>',
      }),
    );
    await page.goto(`${baseURL}/__simulation`);
    const result = await page.evaluate(
      async ({ seed, invincible, maxSeconds }) => {
        const { Game } = await import('/src/game.ts');
        const { UPGRADES, EVOLUTIONS } = await import('/src/content.ts');
        localStorage.clear();
        const game = new Game();
        for (const method of ['unlock', 'playMusic', 'stopVoice', 'speak', 'sfx', 'suspend'])
          game.audio[method] = () => {};
        game.input.poll = () => {};
        game.start({ seed, intro: false });
        game.invincible = invincible;
        const dt = 1 / 60;
        const builds = [
          ['kindling', 'familiar', 'lightning'],
          ['kindling', 'orbit', 'frost'],
          ['kindling', 'cinder', 'pulse'],
        ];
        const plan = builds[Math.abs(seed) % builds.length];
        const stageReports = [];
        const selections = [];
        const healthEvents = [];
        const snapshots = [];
        let nextSnapshot = 60;
        let currentStage = 1;
        let stageStartTime = 0;
        let stageStartKills = 0;
        let stageStartDamage = 0;
        let stageMinHp = game.player.hp;
        let maximumEnemies = 0;
        let maximumProjectiles = 0;
        let bossStart = null;
        let bossHp = 0;
        let bossEnd = null;
        let bossDamageTaken = 0;
        let lastHealth = game.player.hp;
        let lastDamageTaken = 0;
        let steering = { x: 1, y: 0, dash: false };
        let frame = 0;
        const began = performance.now();
        const rounded = (number) => Math.round(number * 100) / 100;
        const loadout = () => Object.fromEntries(Object.entries(game.upgrades));
        const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

        function reportStage(completed) {
          stageReports.push({
            stage: currentStage,
            completed,
            time: rounded(game.time - stageStartTime),
            kills: game.stats.kills - stageStartKills,
            damageTaken: rounded(game.stats.damageTaken - stageStartDamage),
            minimumHp: rounded(stageMinHp),
            finalHp: rounded(game.player.hp),
            finalLevel: game.player.level,
            bossSeconds: bossStart === null ? null : rounded((bossEnd ?? game.time) - bossStart),
            bossDefeated: bossEnd !== null,
            bossDamageTaken:
              bossStart === null ? 0 : rounded(game.stats.damageTaken - bossDamageTaken),
            bossDps:
              bossStart === null
                ? null
                : rounded(
                    (bossHp - (game.boss?.hp || 0)) /
                      Math.max(dt, (bossEnd ?? game.time) - bossStart),
                  ),
            loadout: loadout(),
            evolutions: [...game.evolved],
          });
        }

        function chooseUpgrade() {
          const p = game.player,
            owned = game.upgrades;
          const weaponCount = Object.keys(owned).filter(
            (id) => UPGRADES.find((item) => item.id === id)?.kind === 'weapon',
          ).length;
          const priorities = {
            might: 42,
            haste: 40,
            multishot: 58,
            magnet: 29,
            regen: 27,
            armor: 24,
            vitality: 19,
            velocity: 22,
            reach: 19,
            luck: 15,
            duration: 12,
            dash: 15,
            thorns: 3,
            greed: 2,
            focus: 20,
          };
          const scored = game.choices
            .map((choice, index) => {
              let score = priorities[choice.id] ?? 0;
              const level = owned[choice.id] || 0;
              if (choice.kind === 'weapon') {
                score = plan.includes(choice.id) ? 47 + level * 7 : -60;
                if (plan.includes(choice.id) && level === 0 && weaponCount < 2) score += 30;
                if (plan.includes(choice.id) && level === 0 && weaponCount >= 3) score -= 35;
                if (level > 0) score += 10;
                if (choice.id === 'kindling') score += 8;
              }
              for (const evolution of EVOLUTIONS) {
                if (evolution.passive !== choice.id || !owned[evolution.weapon]) continue;
                if (level < 2) score += owned[evolution.weapon] >= 4 ? 45 : 14;
              }
              if (choice.id === 'regen' && level === 0) score += 20;
              if (choice.id === 'magnet' && level === 0) score += 20;
              if (choice.id === 'vitality' && p.hp < p.maxHp * 0.55) score += 58;
              if (choice.id === 'regen' && p.hp < p.maxHp * 0.55) score += 25;
              if (choice.id === 'armor' && game.stage > 1) score += 10;
              if (choice.id === 'focus' && game.time > 650) score -= 15;
              return { index, score };
            })
            .sort((a, b) => b.score - a.score || a.index - b.index);
          const index = scored[0]?.index ?? 0;
          const choice = game.choices[index];
          selections.push({
            time: rounded(game.time),
            level: p.level,
            id: choice.id,
            options: game.choices.map((item) => item.id),
          });
          game.chooseUpgrade(index);
        }

        function pilot() {
          const p = game.player;
          let goal;
          let charging = false;
          if (game.boss) {
            const boss = game.boss;
            const dist = Math.max(1, distance(p, boss));
            const rx = (p.x - boss.x) / dist,
              ry = (p.y - boss.y) / dist;
            const desired = game.upgrades.orbit ? 190 : 245;
            goal = {
              x: p.x - ry * 160 + rx * (desired - dist) * 1.3,
              y: p.y + rx * 160 + ry * (desired - dist) * 1.3,
            };
          } else {
            let bestPickup = null,
              bestScore = Infinity;
            for (const pickup of game.pickups) {
              if (pickup.pull) continue;
              const dist = distance(p, pickup);
              const healing = pickup.kind === 'heal' && p.hp < p.maxHp * 0.8;
              const score =
                dist /
                (healing ? 5 : pickup.kind === 'magnet' ? 4 : Math.min(3, Math.sqrt(pickup.value)));
              if (score < bestScore) {
                bestScore = score;
                bestPickup = pickup;
              }
            }
            const shrine = game.shrines
              .filter((item) => !item.done)
              .sort((a, b) => distance(p, a) - distance(p, b))[0];
            if (shrine && (distance(p, shrine) < 470 || bestScore > 250)) {
              goal = shrine;
              charging = distance(p, shrine) < 50;
            } else if (bestPickup && bestScore < 650) goal = bestPickup;
            else {
              // Sweep a moderate ellipse; this finds early kills without fleeing
              // so far that all experience is abandoned behind the player.
              const angle = game.time * 0.18 + seed * 0.7;
              goal = { x: Math.cos(angle) * 330, y: Math.sin(angle) * 260 };
            }
          }

          const enemies = game.enemies.filter((enemy) => !enemy.dead && distance(p, enemy) < 270);
          const shots = game.projectiles.filter((shot) => shot.hostile && distance(p, shot) < 300);
          const hazards = game.hazards.filter(
            (hazard) =>
              hazard.kind !== 'mine' &&
              !hazard.fired &&
              hazard.timer < 1.3 &&
              distance(p, hazard) < hazard.radius + 300,
          );
          const goalDistance = distance(p, goal);
          let best = { score: -Infinity, x: 0, y: 0, risk: 0 };
          for (let i = -1; i < 20; i++) {
            const x = i < 0 ? 0 : Math.cos((i * Math.PI) / 10);
            const y = i < 0 ? 0 : Math.sin((i * Math.PI) / 10);
            const future = { x: p.x + x * p.speed * 0.32, y: p.y + y * p.speed * 0.32 };
            let score = (goalDistance - distance(future, goal)) * 0.08;
            score += (x * steering.x + y * steering.y) * 0.28;
            if (charging && i === -1) score += 3;
            let risk = 0;
            if (Math.abs(future.x) > 1370 || Math.abs(future.y) > 970) risk += 35;
            for (const enemy of enemies) {
              const nowDist = Math.max(1, distance(p, enemy));
              const chasing = !['shooter', 'volley', 'summoner'].includes(enemy.type.behavior);
              const anticipated = chasing
                ? {
                    x: enemy.x + ((p.x - enemy.x) / nowDist) * enemy.speed * 0.22,
                    y: enemy.y + ((p.y - enemy.y) / nowDist) * enemy.speed * 0.22,
                  }
                : enemy;
              const safe = enemy.radius + p.radius + 38;
              const separation = distance(future, anticipated);
              if (separation < safe) risk += 38 * (1 - separation / safe) ** 2;
              if (nowDist < enemy.radius + p.radius + 8 && i === -1) risk += 15;
              if (enemy.mode === 1 || enemy.mode === 2) {
                const ex = enemy.x + Math.cos(enemy.angle) * 120;
                const ey = enemy.y + Math.sin(enemy.angle) * 120;
                const delta = Math.hypot(future.x - ex, future.y - ey);
                if (delta < safe) risk += 20 * (1 - delta / safe);
              }
            }
            for (const shot of shots) {
              for (const ahead of [0.12, 0.32]) {
                const sx = shot.x + shot.vx * ahead,
                  sy = shot.y + shot.vy * ahead;
                const px = p.x + x * p.speed * ahead,
                  py = p.y + y * p.speed * ahead;
                const safe = p.radius + shot.radius + 13;
                const separation = Math.hypot(px - sx, py - sy);
                if (separation < safe) risk += 48 * (1 - separation / safe) ** 2;
              }
            }
            for (const hazard of hazards) {
              const ahead = Math.min(0.5, Math.max(0.1, hazard.timer));
              const separation = Math.hypot(
                p.x + x * p.speed * ahead - hazard.x,
                p.y + y * p.speed * ahead - hazard.y,
              );
              const safe = hazard.radius + p.radius + 18;
              if (separation < safe)
                risk += (45 * (1 - separation / safe) ** 2) / Math.max(0.3, hazard.timer);
            }
            if (game.boss) {
              const safe = game.boss.radius + p.radius + 35;
              const separation = distance(future, game.boss);
              if (separation < safe) risk += 60 * (1 - separation / safe);
            }
            score -= risk;
            if (score > best.score) best = { score, x, y, risk };
          }
          const immediateThreat =
            enemies.some((enemy) => distance(p, enemy) < enemy.radius + p.radius + 22) ||
            shots.some((shot) => distance(p, shot) < shot.radius + p.radius + 22) ||
            hazards.some(
              (hazard) => hazard.timer < 0.3 && distance(p, hazard) < hazard.radius + p.radius,
            );
          return {
            x: best.x,
            y: best.y,
            dash: p.dashCd <= 0 && immediateThreat && (best.x !== 0 || best.y !== 0),
          };
        }

        while (game.time < maxSeconds && frame < maxSeconds * 60 + 1000) {
          if (game.screen === 'levelup') {
            chooseUpgrade();
            continue;
          }
          if (game.screen === 'transition') {
            reportStage(true);
            console.log(
              `[simulation] seed=${seed} stage=${game.stage} cleared at ${rounded(game.time)}s, level=${game.player.level}`,
            );
            game.nextStage();
            currentStage = game.stage;
            stageStartTime = game.time;
            stageStartKills = game.stats.kills;
            stageStartDamage = game.stats.damageTaken;
            stageMinHp = game.player.hp;
            bossStart = bossEnd = null;
            bossHp = 0;
            bossDamageTaken = game.stats.damageTaken;
            continue;
          }
          if (game.screen === 'gameover' || game.screen === 'victory') break;
          if (game.screen === 'paused') game.resume();
          if (frame % 6 === 0 || steering.dash) steering = pilot();
          game.input.x = steering.x;
          game.input.y = steering.y;
          game.input.dash = steering.dash;
          steering.dash = false;
          game.tick(dt);
          frame++;
          maximumEnemies = Math.max(maximumEnemies, game.enemies.length);
          maximumProjectiles = Math.max(maximumProjectiles, game.projectiles.length);
          stageMinHp = Math.min(stageMinHp, game.player.hp);
          if (game.boss && bossStart === null) {
            bossStart = game.time;
            bossHp = game.boss.maxHp;
            bossDamageTaken = game.stats.damageTaken;
          }
          if (bossStart !== null && bossEnd === null && game.bossDefeated) bossEnd = game.time;
          if (game.stats.damageTaken > lastDamageTaken) {
            healthEvents.push({
              time: rounded(game.time),
              stage: game.stage,
              hpBefore: rounded(lastHealth),
              hp: rounded(game.player.hp),
              damage: rounded(game.stats.damageTaken - lastDamageTaken),
              boss: !!game.boss,
              enemies: game.enemies.length,
            });
          }
          lastHealth = game.player.hp;
          lastDamageTaken = game.stats.damageTaken;
          if (game.time >= nextSnapshot) {
            snapshots.push({
              time: rounded(game.time),
              stage: game.stage,
              level: game.player.level,
              hp: rounded(game.player.hp),
              maxHp: game.player.maxHp,
              kills: game.stats.kills,
              enemies: game.enemies.length,
              xp: rounded(game.player.xp),
              bossHp: game.boss ? rounded(game.boss.hp) : null,
            });
            nextSnapshot += 60;
          }
          // Yield periodically so Playwright can service protocol messages.
          if (frame % 3600 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
        }
        reportStage(game.screen === 'victory');
        return {
          seed,
          invincible,
          plan,
          screen: game.screen,
          stage: game.stage,
          simulatedSeconds: rounded(game.time),
          wallSeconds: rounded((performance.now() - began) / 1000),
          level: game.player.level,
          hp: rounded(game.player.hp),
          maxHp: game.player.maxHp,
          stats: game.stats,
          loadout: loadout(),
          evolutions: [...game.evolved],
          maximumEnemies,
          maximumProjectiles,
          stages: stageReports,
          snapshots,
          selections,
          healthEvents,
        };
      },
      { seed, invincible, maxSeconds },
    );
    result.errors = errors;
    results.push(result);
    console.log(
      JSON.stringify({
        seed,
        invincible,
        result: result.screen,
        stage: result.stage,
        seconds: result.simulatedSeconds,
        level: result.level,
        hp: result.hp,
        kills: result.stats.kills,
        damageTaken: result.stats.damageTaken,
        bosses: result.stages.map((stage) => ({
          stage: stage.stage,
          seconds: stage.bossSeconds,
          dps: stage.bossDps,
          won: stage.bossDefeated,
        })),
        loadout: result.loadout,
        evolutions: result.evolutions,
        wallSeconds: result.wallSeconds,
      }),
    );
    await context.close();
    await mkdir(dirname(output), { recursive: true });
    await writeFile(
      output,
      JSON.stringify({ baseURL, invincible, maxSeconds, engineHash, results }, null, 2),
    );
  }
} finally {
  await browser.close();
}
console.log(`Wrote ${results.length} sample(s) to ${output}.`);
