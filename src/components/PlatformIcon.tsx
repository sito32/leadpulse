import type { Platform } from '../types';

const PLATFORM_COLORS: Record<Platform, string> = {
  Twitter: 'bg-sky-500',
  Instagram: 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500',
  Facebook: 'bg-blue-600',
  LinkedIn: 'bg-blue-700',
  Other: 'bg-slate-500',
};

const PLATFORM_LABELS: Record<Platform, string> = {
  Twitter: 'X',
  Instagram: 'IG',
  Facebook: 'FB',
  LinkedIn: 'LI',
  Other: '?',
};

export function PlatformIcon({ platform, size = 'sm' }: { platform: Platform; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <span
      className={`inline-flex items-center justify-center ${sz} rounded-lg text-white font-bold ${PLATFORM_COLORS[platform]}`}
    >
      {PLATFORM_LABELS[platform]}
    </span>
  );
}
