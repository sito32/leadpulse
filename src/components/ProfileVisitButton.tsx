import type { Platform } from '../types';

interface Props {
  url: string;
  platform?: Platform;
  className?: string;
  compact?: boolean;
}

export function ProfileVisitButton({ url, platform: _platform, className = '', compact = false }: Props) {
  const handleVisit = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleVisit}
        className={`flex items-center justify-center gap-1.5 ${className}`}
      >
        🔗 Visit Profile
      </button>
    );
  }

  return (
    <button
      onClick={handleVisit}
      className={`flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all ${className}`}
    >
      🔗 Visit Profile
    </button>
  );
}
