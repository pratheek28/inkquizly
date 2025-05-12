// src/components/LandingPage.js
import React from "react";
import NavigationBar from "./NavigationBar";
import styles from "./LandingPage.module.css";
import DLMBot from "./DLM_bot";
import PWAInstallPrompt from "./pwa";
import iOSInstallPopup from "./iOSInstallPopup";

export default function LandingPage() {
  return (
    <div className={styles.landingPage}>
      <NavigationBar />

      {/* <-- add the style prop here */}
      <div
        className={styles.landingHero}
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/website_landingpage_bg.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <h1>Welcome to InkQuizly</h1>
      </div>

      <div className={styles.landingContent}>
        <PWAInstallPrompt />
        <iOSInstallPopup />
        <DLMBot />

        <section className={styles.section}>
          <h2>What is InkQuizly?</h2>
          <p>
            AI-powered note taking PWA that meets proven study methods, from Pomodoro to Spaced Repetition
          </p>
          <p>
            Utilizes Google Gemini for Summarizing, Explaining, and adding more to Written and Typed Notes
          </p>
        </section>

        <section className={styles.section}>
          <h2>Features</h2>
          <ul>
            <li>Subtitle detection for written and typed notes</li>
            <li>Active Recall & Spaced Repetition</li>
            <li>PDF template on each note & unlimited notes (Pro)</li>
            <li>Folder organization for streamlined study</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Get Started</h2>
          <ul>
            <li>
              Click “Sign Up” in the navbar to create an account and start your revolutionized note-taking journey
            </li>
            <li>
              Install as a PWA for seamless access, performance improvement, and device integration
            </li>
            <li>
              Have questions? Ask our custom ChatBot via the bottom-left icon for instant support
            </li>
          </ul>
        </section>
        <section className={styles.section}>
          <h2>Contact Us</h2>
          <ul>
            <li>
              Vignesh Thondikulam:{" "}
              <a href="mailto:vignesh.tho2006@gmail.com"
                 className={styles.contactLink}
                 >
                vignesh.tho2006@gmail.com
              </a>
            </li>
            <li>
              Pranav Gowrishankar:{" "}
              <a href="mailto:pranavgowrish@gmail.com"
                 className={styles.contactLink}
                 >
                pranavgowrish@gmail.com
              </a>
            </li>
            <li>
              Pratheek Sunilkumar:{" "}
              <a href="mailto:pratheek0928@gmail.com"
                 className={styles.contactLink}
                 >
                pratheek0928@gmail.com
              </a>
            </li>
            <li>
              Sathvik Kumar:{" "}
              <a href="mailto:sathvik.kum@gmail.com"
                 className={styles.contactLink}
                 >
                sathvik.kum@gmail.com
              </a>
            </li>
          </ul>
        </section>

        {/* …add more sections here… */}
      </div>
    </div>
  );
}