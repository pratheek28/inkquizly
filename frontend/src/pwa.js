import React, { useState, useEffect } from "react";

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault(); // Prevent default browser install prompt
      setDeferredPrompt(event); // Save event for later use
      setShowPopup(true); // Show popup when install is available
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show native install prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the PWA install");
        } else {
          console.log("User dismissed the PWA install");
        }
        setDeferredPrompt(null);
        setShowPopup(false);
      });
    }
  };

  return (
    <>
      {showPopup && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#06042b",
            border: "1px solid #ccc",
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            maxWidth: "300px",
            fontFamily: "sans-serif",
            animation: "slideIn 0.3s ease-in-out",
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#b8b6b6",
            }}
          >
            🖋️ Install Inkquizly!
          </p>
          <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#d1c0c0" }}>
            Get the full app experience—seamless and instantly available!
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleInstallClick}
              style={{
                padding: "8px 12px",
                background: "#4b7ee3",
                color: "#0b1b3b",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Install
            </button>
            <button
              onClick={() => setShowPopup(false)}
              style={{
                padding: "8px 12px",
                background: "#eee",
                color: "#4e5054",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
