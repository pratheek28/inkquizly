import React, { useEffect, useState } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault(); // Prevent automatic prompt
      setDeferredPrompt(event);
      setShowPrompt(true); // Show your custom UI
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
      });
    }
  };

  return (
    showPrompt && (
      <div className="fixed bottom-5 right-5 bg-white border rounded-xl shadow-lg p-4 z-50">
        <p className="text-gray-800 font-semibold mb-2">
          Install InkQuizly on your home screen?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
          >
            Install
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  );
};

export default PWAInstallPrompt;
