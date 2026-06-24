import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusionne des classes Tailwind conditionnelles (convention shadcn/ui). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
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
const AVATAR_PALETTE = ['indigo', 'emerald', 'amber', 'rose', 'sky', 'violet'];
export function avatarColor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}
