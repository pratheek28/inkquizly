// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import LandingPage from "./LandingPage";
import NavigationBar from "./NavigationBar";
import Login from "./Login";
import SignUp from "./SignUp";
import AccountDashboard from "./AccountDashboard";
import CanvasEditor from './Canvas';
import PWAInstallPrompt from "./pwa";

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Handle the beforeinstallprompt event for deferred installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault(); // Prevent default prompt
      setDeferredPrompt(event); // Save event for later
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show the install prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        console.log("User choice:", choiceResult.outcome);
        setDeferredPrompt(null); // Reset the prompt state
      });
    }
  };

  return (
    <div>
      <Router>
        <div>
          <NavigationBar onInstallClick={handleInstallClick} />
        </div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/AccountDashboard" element={<AccountDashboard />} />
          <Route path="/CanvasEditor" element={<CanvasEditor />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
