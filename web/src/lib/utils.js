import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusionne des classes Tailwind conditionnelles (convention shadcn/ui). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Code lisible d'une tâche : « KEY-N » (ex. ATLAS-12). `fallbackKey` si project non peuplé. */
export function taskCode(task, fallbackKey) {
  if (!task?.number) return null;
  const key = task.project?.key || fallbackKey;
  return key ? `${key}-${task.number}` : `#${task.number}`;
}

/** Initiales à partir d'un nom complet (« Mounia Manager » -> « MM »). */
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

/** Couleur d'avatar déterministe à partir d'une chaîne (id/nom). */
const AVATAR_PALETTE = ['blue', 'emerald', 'amber', 'rose', 'sky', 'teal', 'cyan'];
export function avatarColor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}
