import React, { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault(); // Prevent default browser install prompt
      setDeferredPrompt(event); // Save event for later use
      setShowPopup(true); // Show popup when install is available
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register service worker on load
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show native install prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the PWA install');
        } else {
          console.log('User dismissed the PWA install');
        }
        setDeferredPrompt(null);
        setShowPopup(false);
      });
    }
  };

  return (
    <>
      {showPopup && (
        <div className="install-popup">
          <p>Install this app for a better experience!</p>
          <button onClick={handleInstallClick}>Install</button>
          <button onClick={() => setShowPopup(false)}>Close</button>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
