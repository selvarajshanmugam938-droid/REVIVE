import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Language } from '../../types';

interface OfflineBannerProps {
  language: Language;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ language }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsOnline(navigator.onLine);
      setIsRetrying(false);
    }, 1000);
  };

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold sticky top-0 z-40 animate-in slide-in-from-top">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
        <span>
          {language === 'ta'
            ? 'இணைய இணைப்பு குறைவாக உள்ளது. ஆஃப்லைன் கேச் தரவு காட்டப்படுகிறது.'
            : language === 'hi'
            ? 'कमजोर इंटरनेट कनेक्शन। कैश्ड डेटा प्रदर्शित किया जा रहा है।'
            : 'Weak internet connection. Showing cached healthcare data.'}
        </span>
      </div>

      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-1.5 transition text-xs font-bold shrink-0"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>{language === 'ta' ? 'மீண்டும் முயல்க' : language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</span>
      </button>
    </div>
  );
};
