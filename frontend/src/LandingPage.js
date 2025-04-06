import { useState } from "react";
import NavigationBar from "./NavigationBar"
import styles from "./LandingPage.module.css";

function LandingPage() {
    return (
        <div>
            <NavigationBar />
            <div className={styles.pRow}>
            </div>
        </div>
        
    );
}

export default LandingPage;