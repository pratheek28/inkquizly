import { useState } from "react";
import NavigationBar from "./NavigationBar"
import styles from "./LandingPage.module.css";
import PWAInstallPrompt from "./pwa";

function LandingPage() {
    return (
        <div>
            <NavigationBar />
            <div className={styles.pRow}>
            </div>
            <div>
                <PWAInstallPrompt />
            </div>
        </div>
        
    );
}

export default LandingPage;
