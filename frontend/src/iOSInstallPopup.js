// iOSInstallPopup.js
import React, { useEffect, useState } from "react";

const iOSInstallPopup = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;

    if (isIOS && !isStandalone) {
      setTimeout(() => setShowPopup(true), 1000); // Delay for better UX
    }
  }, []);

  if (!showPopup) return null;

  return (
    <div style={popupStyle}>
      <p style={{ margin: 0 }}>
        Install this app: Tap <strong>Share</strong> →{" "}
        <strong>Add to Home Screen</strong>
      </p>
      <button style={buttonStyle} onClick={() => setShowPopup(false)}>
        Close
      </button>
    </div>
  );
};

const popupStyle = {
  position: "fixed",
  bottom: "1rem",
  left: "1rem",
  right: "1rem",
  background: "#222",
  color: "#fff",
  padding: "1rem",
  borderRadius: "8px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  zIndex: 999,
};

const buttonStyle = {
  background: "#fff",
  color: "#000",
  border: "none",
  borderRadius: "4px",
  padding: "0.4rem 0.8rem",
  cursor: "pointer",
};

export default iOSInstallPopup;
