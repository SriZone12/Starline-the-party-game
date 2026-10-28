import { DareItem } from '../types/game';

export const DEFAULT_DARES: DareItem[] = [
  // Party Fun
  { id: 'p1', category: 'party', text: 'Talk like a robot or alien for the next 2 rounds of turns.' },
  { id: 'p2', category: 'party', text: 'Sing the chorus of your favorite pop song in an opera voice.' },
  { id: 'p3', category: 'party', text: 'Do your best dramatic movie villain evil laugh right now.' },
  { id: 'p4', category: 'party', text: 'Speak in a pirate accent until the constellation is 50% finished.' },
  { id: 'p5', category: 'party', text: 'Show everyone your best signature 10-second victory dance.' },
  { id: 'p6', category: 'party', text: 'Pretend you are a sports commentator narrating the next player’s turn.' },
  { id: 'p7', category: 'party', text: 'Imitate a cat trying to catch a fly for 15 seconds.' },
  { id: 'p8', category: 'party', text: 'Make up a 4-line rhyming poem about lines and numbers right now.' },
  { id: 'p9', category: 'party', text: 'Whisper everything you say until your next turn arrives.' },
  { id: 'p10', category: 'party', text: 'Do an impression of another player in the room until someone guesses who.' },
  { id: 'p11', category: 'party', text: 'Freeze like a museum statue for 20 seconds while others try to make you laugh.' },
  { id: 'p12', category: 'party', text: 'Pretend the floor is hot lava and lift your feet for 10 seconds.' },

  // Physical Mini-Challenges
  { id: 'ph1', category: 'physical', text: 'Do 5 jumping jacks or 5 squats while reciting the alphabet backwards from Z to U.' },
  { id: 'ph2', category: 'physical', text: 'Balance on one leg like a flamingo for 15 seconds.' },
  { id: 'ph3', category: 'physical', text: 'Give high-fives or knuckles to every single player in the room.' },
  { id: 'ph4', category: 'physical', text: 'Hold an imaginary steering wheel and make race car sounds for 10 seconds.' },
  { id: 'ph5', category: 'physical', text: 'Pat your head and rub your stomach at the same time for 15 seconds.' },
  { id: 'ph6', category: 'physical', text: 'Do 10 rapid arm circles forward and 10 backward.' },
  { id: 'ph7', category: 'physical', text: 'Do your smoothest slow-motion replay walk across the room.' },
  { id: 'ph8', category: 'physical', text: 'Spin around gently 3 times, then give a thumbs up to the ceiling.' },
  { id: 'ph9', category: 'physical', text: 'Do the chicken dance arm flap for 10 seconds.' },
  { id: 'ph10', category: 'physical', text: 'Air guitar an epic solo for 15 seconds with passionate facial expressions.' },

  // Social & Laughs
  { id: 's1', category: 'social', text: 'Give a genuine, creative compliment to the player on your left.' },
  { id: 's2', category: 'social', text: 'Reveal the most embarrassing app currently installed on your phone.' },
  { id: 's3', category: 'social', text: 'Challenge the player to your right to an intense staring contest for 10 seconds.' },
  { id: 's4', category: 'social', text: 'Confess a weird food combination that you secretly love eating.' },
  { id: 's5', category: 'social', text: 'Invent a secret high-five handshake with the player opposite you.' },
  { id: 's6', category: 'social', text: 'Share your most absurd childhood memory in under 30 seconds.' },
  { id: 's7', category: 'social', text: 'Let the person next to you choose a nickname you must answer to for the game.' },
  { id: 's8', category: 'social', text: 'Play one lightning round of Rock-Paper-Scissors with every player.' },
  { id: 's9', category: 'social', text: 'Tell the group your worst dad joke or pun. If nobody laughs, do 3 hops.' },
  { id: 's10', category: 'social', text: 'Say "I am the Master of Lines" with total Shakespearean conviction.' }
];

const CUSTOM_DARES_STORAGE_KEY = 'constellation_dares_custom_v1';

export function loadSavedCustomDares(): DareItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DARES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [
    { id: 'custom_default_1', category: 'custom', text: 'Take a silly selfie with the phone and pass it along!', isCustom: true },
    { id: 'custom_default_2', category: 'custom', text: 'Speak only in questions until your next turn!', isCustom: true }
  ];
}

export function saveCustomDares(dares: DareItem[]) {
  try {
    localStorage.setItem(CUSTOM_DARES_STORAGE_KEY, JSON.stringify(dares));
  } catch {}
}

export function pickRandomDare(
  enabledCategories: { party: boolean; physical: boolean; social: boolean; custom: boolean },
  customDares: DareItem[],
  lastDareId?: string
): DareItem {
  const pool: DareItem[] = [];

  if (enabledCategories.party) {
    pool.push(...DEFAULT_DARES.filter(d => d.category === 'party'));
  }
  if (enabledCategories.physical) {
    pool.push(...DEFAULT_DARES.filter(d => d.category === 'physical'));
  }
  if (enabledCategories.social) {
    pool.push(...DEFAULT_DARES.filter(d => d.category === 'social'));
  }
  if (enabledCategories.custom) {
    pool.push(...customDares);
  }

  // Fallback to all if pool is empty
  const activePool = pool.length > 0 ? pool : DEFAULT_DARES;

  // Filter out immediate repeat if possible
  const validPool = activePool.length > 1 && lastDareId 
    ? activePool.filter(d => d.id !== lastDareId) 
    : activePool;

  const randomIndex = Math.floor(Math.random() * validPool.length);
  return validPool[randomIndex];
}
