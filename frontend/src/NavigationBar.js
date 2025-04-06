// import {useState} from 'react';
import styles from "./NavigationBar.module.css";
import { useNavigate } from 'react-router-dom';


function NavigationBar() {
    const navigate = useNavigate();

    const handleClickLanding = () => [
        navigate("/")
    ]

    const handleClickSignUp = () => {
        navigate("/SignUp")
    };
    const handleClickLogIn = () => {
        navigate("/LogIn")
    };

    const handleClickAccountDash = () => {
        navigate("/AccountDashboard")
    };



    return (
        <div>
            <header className={styles.header}>
                <div className={styles.h1Row}>
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