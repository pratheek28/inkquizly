import { useState } from "react";
import NavigationBar from "./NavigationBar"
import styles from "./LandingPage.module.css";
import PWAInstallPrompt from "./pwa";
import iOSInstallPopup from "./iOSInstallPopup";

function LandingPage() {
    return (
        <div>
            <NavigationBar />
            <div>
                <PWAInstallPrompt />
                <iOSInstallPopup />
            </div>
            <div className={styles.pRow}>
            </div>
        </div>
        
    );
}

export default LandingPage;
