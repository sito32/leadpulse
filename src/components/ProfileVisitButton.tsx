import { useState } from 'react';
import type { Platform } from '../types';

interface Props {
  url: string;
  platform: Platform;
  className?: string;
  compact?: boolean;
}

const PLATFORM_INSTRUCTIONS: Record<Platform, string[]> = {
  Instagram: [
    'Copy the link below 👇',
    'Open Instagram app on your phone',
    'Tap the search 🔍 icon',
    'Paste the username or open browser & paste full URL',
  ],
  Twitter: [
    'Tap "Open in Browser" below',
    'Or copy URL and open in Twitter app',
    'Find their profile and send DM',
  ],
  Facebook: [
    'Tap "Open in Browser" below',
    'Or copy URL and open Facebook app',
    'Find their profile and send message',
  ],
  LinkedIn: [
    'Tap "Open in Browser" below',
    'Or copy URL and open LinkedIn app',
    'Find their profile and send a message',
  ],
  Other: [
    'Copy the URL below',
    'Open the platform in your browser or app',
    'Find the profile and send your message',
  ],
};

// Platforms that block direct in-app browser visits
const BLOCKED_PLATFORMS: Platform[] = ['Instagram'];

export function ProfileVisitButton({ url, platform, className = '', compact = false }: Props) {
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const isBlocked = BLOCKED_PLATFORMS.includes(platform);

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(url).catch(() => {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVisit = () => {
    if (isBlocked) {
      setShowGuide(true);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (compact) {
    return (
      <>
        <button
          onClick={handleVisit}
          className={`flex items-center justify-center gap-1.5 ${className}`}
        >
          🔗 Visit Profile
        </button>
        {showGuide && (
          <InstagramGuideModal
            url={url}
            platform={platform}
            copied={copied}
            onCopy={handleCopyUrl}
            onClose={() => setShowGuide(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleVisit}
        className={`flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all ${className}`}
      >
        🔗 Visit Profile
      </button>
      {showGuide && (
        <InstagramGuideModal
          url={url}
          platform={platform}
          copied={copied}
          onCopy={handleCopyUrl}
          onClose={() => setShowGuide(false)}
        />
      )}
    </>
  );
}

function InstagramGuideModal({
  url,
  platform,
  copied,
  onCopy,
  onClose,
}: {
  url: string;
  platform: Platform;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  const steps = PLATFORM_INSTRUCTIONS[platform];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-5 pb-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-2xl flex items-center justify-center text-2xl shadow-md">
            📸
          </div>
          <div>
            <div className="font-black text-slate-800 text-base">Visit {platform} Profile</div>
            <div className="text-xs text-slate-500">
              {platform} blocks direct opens — here's how:
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2 mb-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="text-sm text-slate-700 font-medium">{step}</div>
            </div>
          ))}
        </div>

        {/* URL Copy Box */}
        <div className="bg-slate-50 rounded-2xl p-3 border-2 border-slate-200 mb-4">
          <div className="text-xs font-bold text-slate-400 mb-1.5">Profile URL</div>
          <div className="text-xs text-slate-600 font-mono break-all mb-2.5">{url}</div>
          <button
            onClick={onCopy}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
            }`}
          >
            {copied ? '✅ URL Copied! Now open Instagram' : '📋 Copy Profile URL'}
          </button>
        </div>

        {/* Try direct open anyway */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-slate-200 text-slate-600 py-3 rounded-2xl font-bold text-sm"
          >
            Got it ✓
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 flex items-center justify-center bg-slate-800 text-white py-3 rounded-2xl font-bold text-sm"
          >
            Try Open Anyway ↗
          </a>
        </div>
      </div>
    </div>
  );
}
