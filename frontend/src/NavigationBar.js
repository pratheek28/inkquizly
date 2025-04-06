// NavigationBar.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from "./NavigationBar.module.css";

function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCanvasEditor = location.pathname === '/CanvasEditor';

  const handleClickLanding = () => {
    navigate("/");
  };

  const handleClickSignUp = () => {
    navigate("/SignUp");
  };

  const handleClickLogIn = () => {
    navigate("/LogIn");
  };

  const handleClickAccountDash = () => {
    navigate("/AccountDashboard");
  };

  return (
    <div>
      <header className={styles.header}>
        <div className={styles.h1Row}>
          <img src="/images/logo.png" alt="Logo" className={styles.logo} />
          <button onClick={handleClickLanding}>About</button>
          <button onClick={handleClickSignUp}>Sign Up</button>
          <button onClick={handleClickLogIn}>Log In</button>
          <button onClick={handleClickAccountDash}>Account Dashboard</button>
        </div>
      </header>
    </div>
  );
}

export default NavigationBar;
