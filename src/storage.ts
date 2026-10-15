import type { AudioSettings } from './audio';
export interface Meta {
  currency: number;
  totalRuns: number;
  wins: number;
  bestTime: number;
  totalKills: number;
  upgrades: Record<string, number>;
  unlocks: string[];
  bestStage: number;
}
export interface Save {
  meta: Meta;
  settings: AudioSettings;
  seenIntro: boolean;
}
const KEY = 'novaki-last-light-v1';
const defaults = (): Save => ({
  meta: {
    currency: 0,
    totalRuns: 0,
    wins: 0,
    bestTime: 0,
    totalKills: 0,
    upgrades: {},
    unlocks: ['kindling'],
    bestStage: 1,
  },
  settings: { music: 0.55, sound: 0.65, voice: 0.8, shake: true, particles: true },
  seenIntro: false,
});
export function loadSave(): Save {
  const d = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object') {
      if (raw.meta) {
        for (const key of [
          'currency',
          'totalRuns',
          'wins',
          'bestTime',
          'totalKills',
          'bestStage',
        ] as const) {
          if (typeof raw.meta[key] === 'number' && Number.isFinite(raw.meta[key]))
            d.meta[key] = Math.max(0, raw.meta[key]);
        }
        if (raw.meta.upgrades && typeof raw.meta.upgrades === 'object')
          d.meta.upgrades = raw.meta.upgrades;
        if (Array.isArray(raw.meta.unlocks)) d.meta.unlocks = raw.meta.unlocks;
      }
      if (raw.settings) {
        for (const key of ['music', 'sound', 'voice'] as const)
          if (typeof raw.settings[key] === 'number')
            d.settings[key] = Math.min(1, Math.max(0, raw.settings[key]));
        for (const key of ['shake', 'particles'] as const)
          if (typeof raw.settings[key] === 'boolean') d.settings[key] = raw.settings[key];
      }
      d.seenIntro = !!raw.seenIntro;
    }
  } catch {}
  return d;
}
export function saveGame(save: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
