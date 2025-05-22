// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import LandingPage from "./LandingPage";
import NavigationBar from "./NavigationBar";
import Login from "./Login";
import SignUp from "./SignUp";
import AccountDashboard from "./AccountDashboard";
import CanvasEditor from "./Canvas";
import PWAInstallPrompt from "./pwa";
import iOSInstallPopup from "./iOSInstallPopup";
import { GoogleOAuthProvider } from "@react-oauth/google"; // ✅ Add this import


function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (example: 2 seconds)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          backgroundColor: "black",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <img
          src="/512logo.png"
          alt="Loading..."
          style={{ width: "150px", height: "150px" }}
        />
        <p style={{ marginTop: "20px", fontSize: "20px", color: "white" }}>
          InkQuizly
        </p>
      </div>
    );
  }
  return (
    <GoogleOAuthProvider clientId="465386176997-676bbvqp4hukkvl3evkidh5lm8ludt0n.apps.googleusercontent.com"> {/* ✅ Wrap with this */}
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/AccountDashboard" element={<AccountDashboard />} />
          <Route path="/CanvasEditor" element={<CanvasEditor />} />
        </Routes>
      </Router>
    </div>
    </GoogleOAuthProvider>

  );
}

export default App;
