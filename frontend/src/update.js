import { useState, useEffect } from 'react';

const CURRENT_VERSION = '1.7.0-beta';

function UpdatePopup() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');
    if (lastSeenVersion !== CURRENT_VERSION) {
      setShowPopup(true);
      localStorage.setItem('lastSeenVersion', CURRENT_VERSION);
    }
  }, []);

  if (!showPopup) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <h2>🥳 What's New in InkQuizly v{CURRENT_VERSION}</h2>
        <ul>
          <li>🖊️↩️ Undo Redo for pens</li>
          <li>💾 Auto-save every 5 minutes</li>
          <h3>Stay tuned for more!</h3>
        </ul>
        <button onClick={() => setShowPopup(false)} style={styles.button}>
          Close
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  popup: {
    background: 'indigo', color:"white",padding: '2rem', borderRadius: '1rem',
    width: '90%', maxWidth: '500px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  },
  button: {
    marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '0.5rem',
    border: 'none', backgroundColor: 'black', color: 'white', cursor: 'pointer'
  }
};

export default UpdatePopup;
