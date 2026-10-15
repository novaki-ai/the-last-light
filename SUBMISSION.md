# Novaki: The Last Light

A burnt match. A stolen sun. There is still a little fire in you.

A complete single-player, top-down browser action roguelite with hand-painted storybook art, automatic weapons, a directional invulnerable dash, and three worlds to rekindle.

## Build and run

```sh
npm install
npm run build
```

The build produces `dist/`. Serve that directory with any static web server. Asset URLs are relative, so it can be hosted below a sub-path. The game has no backend, accounts, remote fonts, analytics, or external runtime requests.

For development:

```sh
npm run dev -- --port 4173
```

For the production build:

```sh
npm run preview -- --port 4173
```

## Play

- Move with **WASD** or the **arrow keys**. Weapons aim and fire automatically.
- **Space** or **Shift** dashes in your movement direction. Dash briefly prevents damage.
- **Escape** or **P** pauses. Level-up choices also accept **1**, **2**, and **3**.
- Standard gamepads: left stick or D-pad moves; **A / RB** dashes; **Start** pauses. D-pad navigates menus, A confirms, B goes back.
- Phones: use the on-screen left joystick and right dash button. Menus support touch and scrolling; both orientations work.
- Collect green experience sparks, heal with red pickups, and gather ember currency. Stay beside a dormant lantern for five seconds to rekindle it and receive healing, experience, and embers.
- Survive five minutes in each world, then defeat its guardian. Defeating the third guardian wins the run.
- Carry up to six weapons. A rank V weapon and its paired rank II keepsake evolve automatically. The Field Notes explain all nine combinations. Three rerolls per run help you find a coherent build.
- Spend banked embers at **The Hearth** between runs. Permanent upgrades, unlocked starting weapons, settings, and lifetime statistics are saved in this browser's local storage.

## What is included

- **Three distinct stages:** Cinderwild, The Drowned Archive, and The Hollow Sun, with different floor art, scenery, enemies, musical scores, and atmosphere.
- **Twelve enemy types** with chase, ranged fire, zigzag movement, splitting, swarm movement, aimed volleys, telegraphed charges, orbiting fire, burst movement, frontal shields, explosive charges, and summoning behavior.
- **Three bosses**, each with four repeating attack patterns and a more aggressive second phase. Patterns include projectile rings, root fields, minion summons, targeted blasts, tide fields, sweeping volleys, and sun strikes.
- **Nine weapons, fifteen passives, and nine evolutions.** Three starting weapons become available through progression.
- **Six permanent upgrades**, guardian rewards, elite caches, optional lantern objectives, and run statistics.
- Main menu, narrated prologue, how-to-play, pause, settings, progression shop, evolution guide, bestiary, stage transitions, defeat screen, and narrated victory ending.
- Music, SFX, and voice volume controls; screen-shake and extra-particle toggles. Music crossfades between scenes and loops, and ducks beneath dialogue.
- Original generated art, eight musical tracks, twelve voice clips, and synthesized combat sounds.

All shipped raster images, voice performances, and music were created with the supplied **`varlik`** command. Transparent image edge cleanup and MP3 compatibility transcoding preserve those generated assets. Shapes, UI, particles, and sound effects are drawn or synthesized in code. Provenance and asset details are in `assets-art-notes.md`, `assets-audio-notes.md`, and `public/assets/audio/manifest.json`.

## QA interface

`window.NOVAKI_QA` exposes the required real-game methods:

```js
NOVAKI_QA.state()
NOVAKI_QA.start({ seed: 42 })
NOVAKI_QA.setInvincible(true)
NOVAKI_QA.addXp(100)
NOVAKI_QA.chooseUpgrade(0)
NOVAKI_QA.skipTo(2, 'boss') // stages 1–3; 'start' or 'boss'
NOVAKI_QA.killBoss()
NOVAKI_QA.spawnEnemies(400)
```

Boss defeat uses the normal reward, dialogue, and transition path. Allow the death sequence to finish, then select the next chapter. Large experience grants may open several consecutive level-up choices. QA invincibility is opt-in and does not affect normal play.

## Verification

- Strict TypeScript compilation and production build.
- Chromium desktop, portrait touch, and landscape browser checks, with screenshots and console-error monitoring.
- Actual keyboard movement and dash; controller API input; touch joystick movement and dash; pause/resume; upgrade choices; settings persistence; permanent purchases; all three boss transitions; defeat and victory.
- `npm test` runs the browser QA suite against `http://localhost:4173/` (start the dev or preview server first). Set `TEST_URL` to test another server or deployment path.
- `node tests/simulation.mjs` runs five accelerated, fixed-step, seeded playthroughs through the real game engine using an automated pilot. It does not grant experience, adjust damage, skip stages, or grant invincibility. `--invincible` explicitly enables a separate progression diagnostic.
- After balance tuning, two of five fresh, zero-meta automated attempts won, in **17:14** and **18:33** of active gameplay. Successful bosses lasted approximately **29–97 seconds**. The other three attempts died late in the first world. Five invincible progression diagnostics finished in **17:13–20:23**. These are automated-pilot results, not a claim about human difficulty.
- Repeated seed 42 produced identical gameplay outcomes, upgrade choices, and hit events.

## Limitations and future improvements

- Art uses animated transforms of painted sprites rather than bespoke frame-by-frame character animation. More animation frames would be the biggest visual improvement.
- The arenas are open, bounded spaces; decorative scenery does not block movement. More authored environmental encounters would add variety.
- The eight original music cues are roughly thirty seconds each and use short crossfades when repeating. Longer arrangements would give extended runs more musical variety.
- Saves are local to a browser and do not transfer between devices. There is no mid-run save/resume after closing the tab.
- Chromium was available for direct testing. Current Firefox and Safari-compatible APIs and MP3 audio are used, but those browsers were not directly tested here.
- No known progression-blocking bugs remained at submission. Balance testing uses an automated pilot and would benefit from a broader human playtest.
