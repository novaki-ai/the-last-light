/**
 * NOVAKI: THE LAST LIGHT
 * The complete, engine-independent run and progression catalog.
 * Values are base values: the game applies stage and elapsed-time scaling.
 */

export interface UpgradeDef {
  id: string;
  name: string;
  kind: 'weapon' | 'passive';
  maxLevel: number;
  icon: string;
  color: string;
  description: string;
  perLevel: string;
  flavor: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  stage: number;
  behavior:
    | 'chase'
    | 'shooter'
    | 'zigzag'
    | 'splitter'
    | 'swarm'
    | 'volley'
    | 'charger'
    | 'orbiter'
    | 'sprinter'
    | 'shield'
    | 'bomber'
    | 'summoner';
  hp: number;
  speed: number;
  radius: number;
  damage: number;
  xp: number;
  color: string;
  accent: string;
  description: string;
}

export interface StageDef {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  bossName: string;
  bossTitle: string;
  color: string;
  accent: string;
  floor: string;
  duration: number;
  enemyIds: string[];
  story: string;
}

export interface MetaUpgradeDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  stepCost: number;
  icon: string;
}

export interface EvolutionDef {
  id: string;
  name: string;
  weapon: string;
  passive: string;
  description: string;
  color: string;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'kindling', name: 'Kindling', kind: 'weapon', maxLevel: 5,
    icon: '✦', color: '#ffb45f',
    description: 'Fire an ember bolt at the nearest enemy.',
    perLevel: 'Stronger bolts. More fire, more often.',
    flavor: 'Even a spent match remembers the sun.',
  },
  {
    id: 'orbit', name: 'Borrowed Lanterns', kind: 'weapon', maxLevel: 5,
    icon: '◌', color: '#ffe18a',
    description: 'Lanterns circle you, burning enemies they touch.',
    perLevel: 'More lanterns and stronger contact damage.',
    flavor: 'For everyone who helped you find the way.',
  },
  {
    id: 'frost', name: 'Winterglass', kind: 'weapon', maxLevel: 5,
    icon: '❖', color: '#9feaff',
    description: 'Piercing ice shards slow enemies in their path.',
    perLevel: 'Stronger shards and deeper piercing.',
    flavor: 'The cold can keep a little warmth safe.',
  },
  {
    id: 'lightning', name: 'Storm Thread', kind: 'weapon', maxLevel: 5,
    icon: 'ϟ', color: '#c7a8ff',
    description: 'Lightning jumps between nearby enemies.',
    perLevel: 'More damage and more chained targets.',
    flavor: 'A loose thread from the sky.',
  },
  {
    id: 'pulse', name: 'Heartwood', kind: 'weapon', maxLevel: 5,
    icon: '◎', color: '#ff8d8b',
    description: 'Release a shockwave that pushes enemies away.',
    perLevel: 'Stronger, wider pulses.',
    flavor: 'Small body. Unreasonably large heart.',
  },
  {
    id: 'cinder', name: 'Cinder Bloom', kind: 'weapon', maxLevel: 5,
    icon: '✳', color: '#ff8569',
    description: 'Scatter a burst of hot cinders around you.',
    perLevel: 'More cinders with more damage.',
    flavor: 'Something beautiful grew from the ash.',
  },
  {
    id: 'scythe', name: 'Returning Moon', kind: 'weapon', maxLevel: 5,
    icon: '☽', color: '#d4d4ff',
    description: 'Throw a crescent blade that cuts out and back.',
    perLevel: 'Stronger blades with a wider sweep.',
    flavor: 'A promise to always come home.',
  },
  {
    id: 'mines', name: 'Fireseeds', kind: 'weapon', maxLevel: 5,
    icon: '◇', color: '#e5c77e',
    description: 'Plant seeds that bloom into delayed explosions.',
    perLevel: 'Larger, more powerful explosions.',
    flavor: 'Leave tomorrow a little brighter.',
  },
  {
    id: 'familiar', name: 'Little Company', kind: 'weapon', maxLevel: 5,
    icon: '∴', color: '#a5f1cc',
    description: 'Friendly wisps seek out enemies for you.',
    perLevel: 'More wisps and stronger strikes.',
    flavor: 'Nobody should cross the dark alone.',
  },
  {
    id: 'might', name: 'Old Flame', kind: 'passive', maxLevel: 3,
    icon: '▲', color: '#ff9b71',
    description: 'All weapons deal more damage.',
    perLevel: '+18% weapon damage per rank.',
    flavor: 'Not gone. Just waiting.',
  },
  {
    id: 'haste', name: 'Quickwick', kind: 'passive', maxLevel: 3,
    icon: '»', color: '#b9a7ff',
    description: 'All weapons attack more frequently.',
    perLevel: '+12% attack speed per rank.',
    flavor: 'A little less hesitation.',
  },
  {
    id: 'reach', name: 'Wide Embrace', kind: 'passive', maxLevel: 3,
    icon: '⊕', color: '#ffc690',
    description: 'Increase weapon area and reach.',
    perLevel: '+18% area per rank.',
    flavor: 'There is room for everyone in the light.',
  },
  {
    id: 'velocity', name: 'Tailwind', kind: 'passive', maxLevel: 3,
    icon: '↗', color: '#a4ddf7',
    description: 'Move faster and fire faster projectiles.',
    perLevel: '+8% movement and +18% projectile speed per rank.',
    flavor: 'The world gives you a gentle push.',
  },
  {
    id: 'magnet', name: 'Homeward Pull', kind: 'passive', maxLevel: 3,
    icon: '⊂', color: '#9fe3bf',
    description: 'Gather experience from farther away.',
    perLevel: '+55% pickup radius per rank.',
    flavor: 'Good things have a way of finding you.',
  },
  {
    id: 'vitality', name: 'Stout Heart', kind: 'passive', maxLevel: 3,
    icon: '♥', color: '#f59b9b',
    description: 'Increase maximum health and recover some health.',
    perLevel: '+25 maximum health and heal 25 per rank.',
    flavor: 'Made of wood. Built to last.',
  },
  {
    id: 'regen', name: 'Warm Sap', kind: 'passive', maxLevel: 3,
    icon: '+', color: '#b3e4a3',
    description: 'Slowly recover health throughout the run.',
    perLevel: 'Restore 0.6 health each second per rank.',
    flavor: 'Let the hurt become a growth ring.',
  },
  {
    id: 'armor', name: 'Bark Coat', kind: 'passive', maxLevel: 3,
    icon: '⬡', color: '#d8b88b',
    description: 'Reduce incoming damage.',
    perLevel: 'Block 12% more damage per rank.',
    flavor: 'Something soft needs something sturdy.',
  },
  {
    id: 'luck', name: 'Crooked Glasses', kind: 'passive', maxLevel: 3,
    icon: '∞', color: '#e9c0f6',
    description: 'Increase your chance to deal critical damage.',
    perLevel: '+10% critical-hit chance per rank.',
    flavor: 'A different way of seeing the odds.',
  },
  {
    id: 'multishot', name: 'Split Spark', kind: 'passive', maxLevel: 3,
    icon: '⋔', color: '#ffcc88',
    description: 'Weapons fire additional projectiles.',
    perLevel: '+1 projectile per rank.',
    flavor: 'One spark shared is two sparks kept.',
  },
  {
    id: 'duration', name: 'Long Goodbye', kind: 'passive', maxLevel: 3,
    icon: '◷', color: '#dec6a2',
    description: 'Weapons and their effects linger longer.',
    perLevel: '+25% effect duration per rank.',
    flavor: 'Some lights take their time to leave.',
  },
  {
    id: 'dash', name: 'Second Wind', kind: 'passive', maxLevel: 3,
    icon: '⇒', color: '#a9e7e0',
    description: 'Dash more often and move farther with each dash.',
    perLevel: 'Shorter dash cooldown and longer dash per rank.',
    flavor: 'A small escape can change everything.',
  },
  {
    id: 'thorns', name: 'Splinters', kind: 'passive', maxLevel: 3,
    icon: '✶', color: '#dfb18e',
    description: 'Enemies that hurt you take damage in return.',
    perLevel: '+18 retaliatory damage per rank.',
    flavor: 'Handle with care.',
  },
  {
    id: 'greed', name: 'Keepsake', kind: 'passive', maxLevel: 3,
    icon: '◈', color: '#ead185',
    description: 'Gain more experience and bank more embers.',
    perLevel: '+15% experience and ember earnings per rank.',
    flavor: 'Bring something back from the dark.',
  },
  {
    id: 'focus', name: 'Steady Hands', kind: 'passive', maxLevel: 3,
    icon: '⊙', color: '#d2e0f4',
    description: 'Deal extra damage to bosses and healthy enemies.',
    perLevel: '+20% damage to bosses and high-health foes per rank.',
    flavor: 'Breathe. The flame will follow.',
  },
];

/** Max the weapon and reach rank 2 in its companion passive to evolve it. */
export const EVOLUTIONS: EvolutionDef[] = [
  {
    id: 'wildfire', name: 'Wildfire Testament', weapon: 'kindling', passive: 'multishot',
    description: 'Ember bolts erupt on impact, carrying the fire through crowds.', color: '#ffc05b',
  },
  {
    id: 'sunwheel', name: 'Sunwheel', weapon: 'orbit', passive: 'duration',
    description: 'A blazing ring of lanterns circles you with devastating contact damage.', color: '#ffe393',
  },
  {
    id: 'absolutezero', name: 'The Quiet Winter', weapon: 'frost', passive: 'velocity',
    description: 'A storm of piercing frost leaves enemies almost frozen in place.', color: '#b9f2ff',
  },
  {
    id: 'tempest', name: 'Sky Unraveled', weapon: 'lightning', passive: 'haste',
    description: 'Relentless lightning leaps through entire packs of enemies.', color: '#cfb6ff',
  },
  {
    id: 'supernova', name: 'Brave Little Supernova', weapon: 'pulse', passive: 'reach',
    description: 'Enormous shockwaves clear a circle of safety around your heart.', color: '#ffa5a1',
  },
  {
    id: 'firestorm', name: 'A Thousand Tomorrows', weapon: 'cinder', passive: 'might',
    description: 'Dense bursts of blazing cinders tear through the surrounding darkness.', color: '#ff9c6f',
  },
  {
    id: 'eclipse', name: 'Eclipse Promise', weapon: 'scythe', passive: 'luck',
    description: 'Great crescent blades reap enemies on their journey out and home.', color: '#e0dcff',
  },
  {
    id: 'starfall', name: 'Stars Beneath Our Feet', weapon: 'mines', passive: 'focus',
    description: 'Fireseeds detonate like fallen stars, devastating anything nearby.', color: '#f8db8a',
  },
  {
    id: 'constellation', name: 'Never Alone', weapon: 'familiar', passive: 'magnet',
    description: 'A constellation of powerful seeking wisps fights beside you.', color: '#b7ffdb',
  },
];

export const ENEMIES: EnemyDef[] = [
  {
    id: 'sootling', name: 'Sootling', stage: 1, behavior: 'chase',
    hp: 26, speed: 72, radius: 15, damage: 10, xp: 2,
    color: '#45434f', accent: '#ffbd7a',
    description: 'Drifts toward your warmth. Harmless-looking, rarely alone.',
  },
  {
    id: 'thornling', name: 'Thornling', stage: 1, behavior: 'shooter',
    hp: 42, speed: 46, radius: 18, damage: 12, xp: 4,
    color: '#67534b', accent: '#efa586',
    description: 'Keeps its distance and spits thorns toward your last position.',
  },
  {
    id: 'embermoth', name: 'Embermoth', stage: 1, behavior: 'zigzag',
    hp: 20, speed: 133, radius: 12, damage: 8, xp: 3,
    color: '#a16b64', accent: '#ffce91',
    description: 'Darts from side to side, slipping through straight lines of fire.',
  },
  {
    id: 'stump', name: 'Grief Stump', stage: 1, behavior: 'splitter',
    hp: 115, speed: 38, radius: 27, damage: 18, xp: 9,
    color: '#665449', accent: '#dca76c',
    description: 'A slow brute. Break its shell and smaller creatures spill out.',
  },
  {
    id: 'drownling', name: 'Drownling', stage: 2, behavior: 'swarm',
    hp: 31, speed: 99, radius: 13, damage: 10, xp: 3,
    color: '#396a75', accent: '#a2e2dd',
    description: 'Arrives in tightly packed schools to overwhelm a narrow escape.',
  },
  {
    id: 'scribe', name: 'Ink Scribe', stage: 2, behavior: 'volley',
    hp: 68, speed: 51, radius: 18, damage: 13, xp: 6,
    color: '#5c5d82', accent: '#d1baf6',
    description: 'Writes sweeping volleys of ink across your path.',
  },
  {
    id: 'bell', name: 'Bell Diver', stage: 2, behavior: 'charger',
    hp: 86, speed: 67, radius: 20, damage: 20, xp: 7,
    color: '#7b8172', accent: '#f2d79d',
    description: 'Rings a warning, aims, then lunges down the marked line.',
  },
  {
    id: 'jelly', name: 'Lumen Jelly', stage: 2, behavior: 'orbiter',
    hp: 61, speed: 42, radius: 20, damage: 12, xp: 6,
    color: '#518d94', accent: '#a5fff1',
    description: 'Drifts around you while sending glowing projectiles outward.',
  },
  {
    id: 'spark', name: 'Runaway Spark', stage: 3, behavior: 'sprinter',
    hp: 40, speed: 155, radius: 12, damage: 12, xp: 4,
    color: '#bf7062', accent: '#ffe0a2',
    description: 'Races toward you in sudden bursts of speed.',
  },
  {
    id: 'sentinel', name: 'Kiln Sentinel', stage: 3, behavior: 'shield',
    hp: 150, speed: 53, radius: 25, damage: 20, xp: 10,
    color: '#777087', accent: '#f5ca8e',
    description: 'Its forward shield absorbs blows. Strike from the sides or behind.',
  },
  {
    id: 'comet', name: 'Fallen Comet', stage: 3, behavior: 'bomber',
    hp: 58, speed: 84, radius: 18, damage: 24, xp: 6,
    color: '#a67076', accent: '#ffd2a3',
    description: 'Marks its charge, dives in, and explodes. Keep clear of the warning.',
  },
  {
    id: 'priest', name: 'Ash Cantor', stage: 3, behavior: 'summoner',
    hp: 108, speed: 37, radius: 22, damage: 15, xp: 10,
    color: '#72628a', accent: '#e8bdff',
    description: 'Sings new sparks into being while firing from a safe distance.',
  },
];

export const STAGES: StageDef[] = [
  {
    id: 1,
    name: 'Cinderwild',
    subtitle: 'Where the first fires slept',
    description: 'Follow the embers through a forest that forgot the dawn.',
    bossName: 'The Briar Warden',
    bossTitle: 'Keeper of the Last Root',
    color: '#171e1c',
    accent: '#e3ad72',
    floor: '#1a2321',
    duration: 300,
    enemyIds: ['sootling', 'thornling', 'embermoth', 'stump'],
    story: 'The world has gone cold. In Cinderwild, one spent match still carries a little warmth. Novaki follows the last root toward a dawn nobody remembers.',
  },
  {
    id: 2,
    name: 'The Drowned Archive',
    subtitle: 'Where every flame had a name',
    description: 'Cross the flooded halls. Find the memory of the sun.',
    bossName: 'Mother of Tides',
    bossTitle: 'Keeper of Drowned Memories',
    color: '#142329',
    accent: '#8acccc',
    floor: '#162b32',
    duration: 300,
    enemyIds: ['drownling', 'scribe', 'bell', 'jelly'],
    story: 'Beyond the roots lies an ocean of unwritten endings. The drowned books remember a sun imprisoned above. Mother of Tides keeps every memory beneath the water, safe from the pain of another dawn.',
  },
  {
    id: 3,
    name: 'The Hollow Sun',
    subtitle: 'Where tomorrow waits',
    description: 'Climb into the furnace and return the stolen dawn.',
    bossName: 'The Hollow Sun',
    bossTitle: 'A Dawn That Never Came',
    color: '#271d30',
    accent: '#ddb0e9',
    floor: '#2a2033',
    duration: 300,
    enemyIds: ['spark', 'sentinel', 'comet', 'priest'],
    story: 'At the heart of the kiln, the Hollow Sun hoards the last of the light. Novaki straightens his crooked glasses. You do not need to burn forever to help someone see.',
  },
];

export const META_UPGRADES: MetaUpgradeDef[] = [
  {
    id: 'vigor', name: 'Heart Rings', icon: '♥',
    description: 'Begin each run with 10 more maximum health per rank.',
    maxLevel: 5, baseCost: 30, stepCost: 30,
  },
  {
    id: 'power', name: 'Remembered Fire', icon: '✦',
    description: 'All weapons deal 5% more damage per rank.',
    maxLevel: 5, baseCost: 40, stepCost: 35,
  },
  {
    id: 'wisdom', name: 'A Little Wiser', icon: '∞',
    description: 'Gain 5% more experience per rank.',
    maxLevel: 5, baseCost: 30, stepCost: 25,
  },
  {
    id: 'harvest', name: 'Ember Pockets', icon: '◈',
    description: 'Bring home 10% more embers per rank.',
    maxLevel: 5, baseCost: 35, stepCost: 30,
  },
  {
    id: 'warmth', name: 'Quiet Warmth', icon: '+',
    description: 'Recover 0.15 health each second per rank.',
    maxLevel: 5, baseCost: 50, stepCost: 40,
  },
  {
    id: 'reserve', name: 'One More Match', icon: '↻',
    description: 'Once per run, rise again with half your health.',
    maxLevel: 1, baseCost: 350, stepCost: 0,
  },
];
