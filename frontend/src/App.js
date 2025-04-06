// App.js or App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage"
import NavigationBar from "./NavigationBar";
import Login from "./Login";
import SignUp from "./SignUp";
import AccountDashboard from "./AccountDashboard";

function App() {
  return (
    <div>
        <div>
        <Router>
            <div>
                <NavigationBar />
            </div>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/Login" element={<Login />} />
                <Route path="/SignUp" element={<SignUp />} />
                <Route path="/AccountDashboard" element={<AccountDashboard />} />
            </Routes>
        </Router>
        </div>
    </div>
    
  );
}

export default App;
