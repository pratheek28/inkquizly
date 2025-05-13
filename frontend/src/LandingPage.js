// src/components/LandingPage.js
import React, { useEffect, useRef, useState } from "react";
import NavigationBar from "./NavigationBar";
import styles from "./LandingPage.module.css";
import DLMBot from "./DLM_bot";
import PWAInstallPrompt from "./pwa";
import iOSInstallPopup from "./iOSInstallPopup";

export default function LandingPage() {
  const zoomRef = useRef(null);
  const fadeRef = useRef(null);
  const imgRef = useRef(null);
  const afterZoomRef = useRef(null);

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    imageWidth: 0.5,
    imageHeight: 0.5,
    height: 1,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (!zoomRef.current || !imgRef.current) return;

      const WIDTH = document.body.clientWidth;
      const IMAGE_WIDTH = imgRef.current.clientWidth;
      const IMAGE_HEIGHT = imgRef.current.clientHeight;
      const HEIGHT = zoomRef.current.clientHeight;

      setDimensions({ width: WIDTH, imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT, height: HEIGHT });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    let prev = 0;
    let fade = 500;

    const ZOOM_SPEED = 100;
    const FADE_SPEED = 0;

    const anim = () => {
      const scroll = window.scrollY;
      const temp = scroll / ZOOM_SPEED;
      const zoom = temp > 1 ? temp : 1;

      const ZOOM_BREAKPOINT = ((dimensions.width ) / dimensions.imageWidth) * 0.3;
      const IMAGE_HEIGHT_MAX = dimensions.imageHeight * ZOOM_BREAKPOINT;
      const ABSOLUTE = ZOOM_BREAKPOINT * ZOOM_SPEED;

      if (zoomRef.current && imgRef.current) {
        if (zoom < ZOOM_BREAKPOINT) {
          imgRef.current.style.transform = `scale(${zoom})`;
          zoomRef.current.style.top = "0px";
          zoomRef.current.style.position = "fixed";
        } else {
          imgRef.current.style.transform = `scale(${ZOOM_BREAKPOINT})`;
          zoomRef.current.style.position = "absolute";
          zoomRef.current.style.top = ABSOLUTE + "px";
        }
      }

      const dif = prev - scroll;

      if (fadeRef.current) {
        if (zoom < ZOOM_BREAKPOINT - FADE_SPEED / ZOOM_SPEED) {
          fade = 1;
        } else if (zoom > ZOOM_BREAKPOINT) {
          fade = 0;
        } else {
          fade += dif / FADE_SPEED;
        }

        fadeRef.current.style.opacity = fade;
      }

      if (afterZoomRef.current) {
        afterZoomRef.current.style.top = ABSOLUTE + IMAGE_HEIGHT_MAX / 4 + dimensions.height / 2 + "px";
      }

      prev = scroll;
    };

    window.scrollTo(0, 0);
    window.addEventListener("scroll", () => requestAnimationFrame(anim));
    return () => window.removeEventListener("scroll", anim);
  }, [dimensions]);

  const scrollRef = useRef();
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const section = scrollRef.current;
      if (!section) return;
  
      const rect = section.getBoundingClientRect();
      const totalHeight = window.innerHeight + section.offsetHeight;
      const progress = 1 - (rect.bottom - window.innerHeight) / totalHeight;
  
      setScrollProgress(Math.min(Math.max(progress, 0), 1));
    };
  
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate opacity based on scroll
  const titleOpacity = scrollProgress < 0.9
  ? 1
  : scrollProgress > 0.5
  ? 0
  : 1 - (scrollProgress - 0.08) / 0.2;

  return (
    <div className={styles.landingPage}>
      <NavigationBar />

      {/* <-- add the style prop here */}
      <div
        ref={fadeRef}
        style={{
          flex: "0 0 100vh", // Use quotes for full CSS string
          display: "flex",   // Add quotes around "flex"
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",     // Ensure it spans the full width
          height: "100vh",   // Explicit height to match flex-basis
          backgroundImage: `url(${process.env.PUBLIC_URL}/website_landingpage_bg.png)`,
          backgroundSize: "cover",         // Optional: scale image
          backgroundPosition: "center",    // Optional: center image
          opacity: 1,
          zIndex: 1,
          pointerEvents: "none", // Allow clicks to pass through
        }}
        
      />
      <div
        ref={zoomRef}
        style={{
          height: "100vh",
          width: "100%",
          display: "grid",
          placeItems: "center",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 2,
          pointerEvents: "none", // Allow clicks to pass through
        }}
      >
        <img
          ref={imgRef}
          src="/inkai-removebg-preview.png"
          alt=""
          style={{
            width: "80px",
            height: "80px",
            transition: "transform 0.1s",
          }}
        />
      </div>
      
      <div
        ref={afterZoomRef}
        style={{
          position: "absolute",
          height: "200vh",
          width: "100%",
          overflowX: "auto",
          zIndex: 0,
        }}
      >
{/* <div
  ref={scrollRef}
  style={{
    position: "relative",
    height: "100vh", // ensures enough scroll room
    width: "100%",
    overflowX: "hidden",
    zIndex: 0,
  }}
> */}
  {/* <div
    style={{
      position: "sticky",

       height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "3rem",
      background: "white",
      opacity: titleOpacity,
      transition: "opacity 0.3s ease-out",
    }}
  >
   <div
  style={{
    fontFamily: "'Poppins', sans-serif",
    fontSize: "4rem",
    fontWeight: "600", // Bold and impactful
    color: "#333", // Dark text for contrast
    textAlign: "center",
    textTransform: "uppercase", // Optional: makes it all caps
    letterSpacing: "4px", // Adds spacing between letters for a more modern feel
    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)", // Light shadow for depth
    transition: "transform 0.3s ease-in-out",
  }}
>
  Note-taking Revolutionized
</div>
  </div>

  

  {/* Spacer */}
{/* </div> */} */}



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
  <button
  onClick={() =>
    window.location.href =
      "mailto:pranavgowrish@gmail.com,vignesh.tho2006@gmail.com,pratheek0928@gmail.com,sathvik.kum@gmail.com"
  }
  onMouseEnter={(e) => {
    e.target.style.transform = "scale(1.1)";
    e.target.style.transition = "transform 1s ease, background 1s ease";

  }}
  onMouseLeave={(e) => {
    e.target.style.transform = "scale(1)";

  }}
  style={{
    background: "linear-gradient(to right, rgb(77, 119, 255), rgb(255, 64, 30))",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "transform 1s ease, background 1s ease", // default transition
  }}
>
  Email the Team
</button>

  <div style={{ marginTop: "20px", fontSize: "12px", color: "#fff", textAlign: "center" }}>
  <p style={{ margin: 0 }}>Created by</p>
  <p style={{ margin: 0 }}>
    Pranav Gowrishankar, Vignesh Thondikulam, Pratheek Sunilkumar, Sathvik Kumar
  </p>
</div>
</section> 


        {/* …add more sections here… */}
      </div>
      <div
  style={{
    color: 'white',
    textAlign: 'center',
    padding: '50px',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '20px'
  }}
>
  InkQuizly © 2025
</div>

      </div>
    </div>
  );
}