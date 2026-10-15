/** Focused regression tests against the real Game class in Chromium.
 * Run the Vite development server, then `node tests/mechanics.mjs`.
 * TEST_URL may override http://localhost:4173/.
 * These tests create controlled combat fixtures; production modules are untouched.
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = (process.env.TEST_URL || 'http://localhost:4173').replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.route('**/__mechanics', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><body><div id="ui"></div><div id="joystick"><div class="stick-knob"></div></div><button id="touch-dash">Dash</button></body></html>',
    }),
  );
  await page.goto(`${baseURL}/__mechanics`);
  const results = await page.evaluate(async () => {
    const { Game } = await import('/src/game.ts');
    const { UPGRADES, EVOLUTIONS, META_UPGRADES } = await import('/src/content.ts');
    const results = [];
    const dt = 1 / 60;
    const assert = (condition, message) => {
      if (!condition) throw new Error(message);
    };
    const equal = (actual, expected, message) =>
      assert(actual === expected, `${message}: expected ${expected}, received ${actual}`);
    const near = (actual, expected, message) =>
      assert(
        Math.abs(actual - expected) < 1e-7,
        `${message}: expected ${expected}, received ${actual}`,
      );
    const snapshot = (value) => JSON.stringify(value);
    function fresh(clearSave = true) {
      if (clearSave) localStorage.clear();
      const game = new Game();
      for (const method of ['unlock', 'playMusic', 'stopVoice', 'speak', 'sfx', 'suspend'])
        game.audio[method] = () => {};
      game.input.poll = () => {};
      return game;
    }
    function startFixture() {
      const game = fresh();
      game.start({ seed: 1234, intro: false });
      // Prevent incidental spawns and automatic weapons from obscuring the
      // mechanic under test. Combat resolution and all transitions stay real.
      game.spawnTimer = Infinity;
      game.eliteAt = Infinity;
      game.shrineAt = Infinity;
      game.enemies = [];
      game.projectiles = [];
      game.pickups = [];
      game.upgrades = {};
      game.recalculate();
      game.player.crit = 0;
      game.player.invuln = 0;
      return game;
    }
    function advance(game, seconds) {
      for (let frame = 0; frame < Math.ceil(seconds / dt); frame++) game.tick(dt);
    }
    function test(name, fn) {
      const details = fn();
      results.push({ name, ...details });
    }

    test('Thorns retaliate once per successful damage event', () => {
      const game = startFixture();
      game.upgrades.thorns = 1;
      const enemy = game.spawnEnemy('stump', false, game.player.x, game.player.y);
      enemy.speed = 0;
      const enemyHp = enemy.hp;
      const playerHp = game.player.hp;
      game.tick(dt);
      near(enemy.hp, enemyHp - 18, 'The first contact retaliates');
      near(game.player.hp, playerHp - enemy.damage, 'The first contact hurts the player');
      advance(game, 0.5);
      assert(game.player.invuln > 0, 'The player remains in the invulnerability window');
      near(enemy.hp, enemyHp - 18, 'Repeated overlap during invulnerability cannot retaliate');
      near(game.player.hp, playerHp - enemy.damage, 'Repeated overlap cannot hurt the player');
      game.invincible = true;
      game.player.invuln = 0;
      game.tick(dt);
      near(enemy.hp, enemyHp - 18, 'QA invincibility does not trigger retaliation');
      game.invincible = false;
      game.tick(dt);
      near(enemy.hp, enemyHp - 36, 'A later successful hit retaliates again');
      near(game.stats.damageTaken, enemy.damage * 2, 'Exactly two damage events were recorded');
      return { contactsBlocked: 31, retaliations: 2 };
    });

    test('Evolution requires weapon rank 5 and companion rank 2', () => {
      const game = startFixture();
      const evolution = EVOLUTIONS.find((item) => item.weapon === 'kindling');
      assert(evolution, 'Kindling has an evolution definition');
      game.upgrades = { [evolution.weapon]: 4, [evolution.passive]: 1 };
      game.recalculate();
      const take = (id) => {
        game.addXp(game.player.nextXp);
        equal(game.screen, 'levelup', 'Experience opens the real level-up screen');
        game.choices = [UPGRADES.find((item) => item.id === id)];
        game.chooseUpgrade(0);
      };
      take(evolution.weapon);
      equal(game.upgrades[evolution.weapon], 5, 'The weapon reaches rank 5');
      equal(game.evolved.size, 0, 'Rank 1 companion is insufficient');
      take(evolution.passive);
      equal(game.upgrades[evolution.passive], 2, 'The companion reaches rank 2');
      assert(game.evolved.has(evolution.id), 'The correct evolution is granted');
      assert(game.isEvolved(evolution.weapon), 'The actual combat evolution flag is active');
      assert(game.state().upgrades.includes(evolution.id), 'QA reports the earned evolution');
      equal(game.state().upgradeLevels[evolution.weapon], 5, 'QA reports real weapon rank');
      take('might');
      equal(game.evolved.size, 1, 'Further upgrades cannot duplicate the evolution');
      return { evolution: evolution.id, ranks: game.state().upgradeLevels };
    });

    test('Rerolls consume the three-use allowance without granting levels', () => {
      const game = fresh();
      game.start({ seed: 99 });
      equal(game.rerolls, 3, 'A run begins with three rerolls');
      game.reroll();
      equal(game.rerolls, 3, 'Reroll outside level-up is ignored');
      game.addXp(game.player.nextXp);
      const level = game.player.level;
      const xp = game.player.xp;
      const owned = snapshot(game.upgrades);
      game.reroll();
      equal(game.rerolls, 2, 'One reroll changes allowance from three to two');
      equal(game.state().rerolls, 2, 'QA reports the same remaining allowance');
      equal(game.screen, 'levelup', 'Reroll keeps the selection open');
      equal(game.player.level, level, 'Reroll does not grant a level');
      equal(game.player.xp, xp, 'Reroll does not grant or consume experience');
      equal(snapshot(game.upgrades), owned, 'Reroll does not grant upgrades');
      assert(
        game.choices.length > 0 && game.choices.length <= 3,
        'Reroll produces a valid choice set',
      );
      game.reroll();
      game.reroll();
      equal(game.rerolls, 0, 'Three rerolls exhaust the allowance');
      const exhaustedChoices = snapshot(game.choices);
      game.reroll();
      equal(game.rerolls, 0, 'The allowance cannot become negative');
      equal(snapshot(game.choices), exhaustedChoices, 'Exhausted reroll cannot change choices');
      game.start({ seed: 100 });
      equal(game.rerolls, 3, 'Starting another run restores the allowance');
      return { initial: 3, afterFirst: 2, exhausted: 0 };
    });

    test('Greed preserves fractions until a single integer payout', () => {
      const game = startFixture();
      game.upgrades.greed = 1;
      for (let pickup = 0; pickup < 10; pickup++) game.earn(1);
      near(game.stats.earned, 11.5, 'Ten small pickups retain the 15% bonus');
      equal(game.save.meta.currency, 0, 'Run earnings remain unbanked before the run ends');
      game.endRun(false);
      // Ten pickups plus the normal stage-one completion bonus: 20 * 1.15.
      equal(game.stats.earned, 23, 'The final payout includes accumulated fractions');
      equal(game.save.meta.currency, 23, 'The integer payout reaches persistent currency');
      assert(Number.isInteger(game.save.meta.currency), 'Persistent currency remains an integer');
      game.endRun(false);
      equal(game.save.meta.currency, 23, 'Repeated completion cannot pay twice');
      return { earnedBeforePayout: 11.5, banked: game.save.meta.currency };
    });

    test('Every boss uses phase-two attacks and the normal victory path', () => {
      const game = startFixture();
      game.invincible = true;
      const bosses = [];
      for (let stage = 1; stage <= 3; stage++) {
        equal(game.stage, stage, 'Stage progression follows nextStage');
        game.upgrades = {};
        game.player.crit = 0;
        // Chapter entrances may seed nearby foes. This fixture isolates boss
        // patterns from their entrance XP and the resulting level-up pause.
        game.enemies = [];
        game.pickups = [];
        game.spawnBoss();
        assert(game.boss, 'The real boss is spawned');
        const initialHp = game.boss.maxHp;
        game.damageBoss(initialHp * 0.55);
        game.tick(dt);
        equal(game.boss.phase, 2, 'Crossing half health enables phase two');
        equal(game.state().boss.phase, 2, 'QA reports phase two');
        let sawShots = false,
          sawHazards = false,
          sawSummons = false;
        for (let frame = 0; frame < 600; frame++) {
          game.tick(dt);
          sawShots ||= game.projectiles.some((shot) => shot.hostile);
          sawHazards ||= game.hazards.some((hazard) => hazard.kind !== 'mine');
          sawSummons ||= game.enemies.length > 0;
        }
        assert(sawShots, `Stage ${stage} phase two fires actual hostile projectiles`);
        assert(sawHazards, `Stage ${stage} phase two creates damaging hazards`);
        assert(sawSummons, `Stage ${stage} phase two summons real enemies`);
        assert(game.boss.pattern >= 4, `Stage ${stage} executes all four attack patterns`);
        game.player.hp = 40;
        const earnings = game.stats.earned;
        game.damageBoss(game.boss.hp + 1);
        equal(game.boss, null, 'Lethal combat damage removes the boss');
        equal(game.bossDefeated, true, 'The normal defeat flag is set');
        equal(game.stats.bosses, stage, 'The defeat is recorded in run statistics');
        near(game.stats.earned - earnings, 60 + stage * 30, 'The normal boss reward is granted');
        near(game.player.hp, 70, 'The boss defeat restores 30% maximum health');
        equal(game.enemies.length, 0, 'Defeat clears summoned enemies');
        equal(game.projectiles.length, 0, 'Defeat clears hostile projectiles');
        equal(game.hazards.length, 0, 'Defeat clears hazards');
        assert(game.subtitle.text.length > 0, 'The defeat story line is presented');
        assert(game.bossDeathTimer > 0, 'The defeat presentation runs before transitioning');
        for (let frame = 0; frame < 600 && game.screen === 'playing'; frame++) game.tick(dt);
        if (stage < 3) {
          equal(game.screen, 'transition', 'Earlier bosses open the chapter transition');
          game.nextStage();
          equal(game.screen, 'playing', 'The following chapter resumes play');
        } else {
          equal(game.screen, 'victory', 'The third defeated boss wins the run');
          equal(game.save.meta.wins, 1, 'Victory is persisted');
          assert(
            game.save.meta.unlocks.includes('orbit') && game.save.meta.unlocks.includes('frost'),
            'Boss milestones unlock their starting weapons',
          );
        }
        bosses.push({ stage, phase: 2, shots: sawShots, hazards: sawHazards, summons: sawSummons });
      }
      return { bosses, defeated: game.stats.bosses, finalScreen: game.screen };
    });

    test('Lethal damage stops postmortem pickup collection in every damage phase', () => {
      const phases = ['enemy', 'projectile', 'hazard', 'boss'];
      for (const phase of phases) {
        const game = startFixture();
        game.player.hp = 1;
        game.pickups = [
          { x: 0, y: 0, kind: 'heal', value: 50, age: 0, pull: false },
          { x: 0, y: 0, kind: 'xp', value: 50, age: 0, pull: false },
          { x: 0, y: 0, kind: 'ember', value: 50, age: 0, pull: false },
        ];
        if (phase === 'enemy') game.spawnEnemy('sootling', false, 0, 0);
        if (phase === 'projectile') game.enemyShot(0, 0, 0, 0, 10);
        if (phase === 'hazard')
          game.hazards.push({
            x: 0,
            y: 0,
            radius: 50,
            timer: 0,
            duration: 1,
            damage: 10,
            kind: 'blast',
            fired: false,
          });
        if (phase === 'boss') {
          game.spawnBoss();
          game.boss.x = game.player.x;
          game.boss.y = game.player.y;
          game.player.invuln = 0;
        }
        game.tick(dt);
        equal(game.screen, 'gameover', `${phase} damage ends the run`);
        equal(game.player.hp, 0, `${phase} death cannot heal from a nearby pickup`);
        equal(game.player.xp, 0, `${phase} death cannot collect experience`);
        equal(game.stats.healed, 0, `${phase} death cannot record postmortem healing`);
        equal(game.save.meta.currency, 10, `${phase} death banks only the legitimate run bonus`);
        assert(
          game.pickups.every((pickup) => pickup.value === 50),
          `${phase} death leaves pickups unconsumed`,
        );
      }
      return { phases };
    });

    test('Pause freezes run time and world simulation', () => {
      const game = fresh();
      game.start({ seed: 77 });
      advance(game, 1);
      game.pause();
      equal(game.screen, 'paused', 'Pause enters the paused screen');
      const before = snapshot({
        time: game.time,
        stageTime: game.stageTime,
        player: game.player,
        enemies: game.enemies,
        projectiles: game.projectiles,
      });
      game.input.x = 1;
      advance(game, 5);
      equal(
        snapshot({
          time: game.time,
          stageTime: game.stageTime,
          player: game.player,
          enemies: game.enemies,
          projectiles: game.projectiles,
        }),
        before,
        'Time, movement, combat, and cooldowns remain frozen',
      );
      const frozenTime = game.time;
      game.resume();
      game.input.x = 1;
      game.tick(dt);
      assert(game.time > frozenTime && game.player.x > 0, 'Resume restores time and movement');
      return { frozenSeconds: 5, resumed: true };
    });

    test('Persistent purchases survive a new game instance and affect the next run', () => {
      const game = startFixture();
      game.earn(500);
      game.endRun(false);
      const vigor = META_UPGRADES.find((item) => item.id === 'vigor');
      assert(vigor, 'The permanent health upgrade exists');
      const balance = game.save.meta.currency;
      equal(game.buyMeta('vigor'), true, 'A funded permanent upgrade can be purchased');
      equal(
        game.save.meta.currency,
        balance - vigor.baseCost,
        'The purchase deducts its real catalog price',
      );
      const expectedMeta = snapshot(game.save.meta);
      const reloaded = fresh(false);
      equal(
        snapshot(reloaded.save.meta),
        expectedMeta,
        'A newly constructed game loads the saved progression',
      );
      reloaded.start({ seed: 78 });
      equal(reloaded.player.maxHp, 110, 'The purchased rank changes the next run');
      equal(reloaded.player.hp, 110, 'The next run begins at its upgraded maximum health');
      equal(reloaded.save.meta.totalRuns, 1, 'Historical run statistics remain saved');
      return {
        vigor: reloaded.save.meta.upgrades.vigor,
        nextRunHp: reloaded.player.maxHp,
        currency: reloaded.save.meta.currency,
      };
    });
    return results;
  });
  assert.deepEqual(errors, [], 'The mechanics harness must not produce browser errors');
  for (const result of results) console.log(`PASS ${result.name}\n${JSON.stringify(result)}`);
  console.log(`All ${results.length} real-engine mechanics tests passed.`);
} finally {
  await browser.close();
}
