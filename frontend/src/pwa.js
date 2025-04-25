// PWAInstallPrompt.js
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

const PWAInstallPrompt = forwardRef((props, ref) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault(); // Prevent the default browser install prompt
      setDeferredPrompt(event);
      setShowPrompt(true); // Show your custom install prompt
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

  // Expose the handleInstallClick function to parent component
  useImperativeHandle(ref, () => ({
    handleInstallClick,
  }));

  return null; // You may choose to render something here for the user prompt
});

export default PWAInstallPrompt;
