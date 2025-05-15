// src/components/LandingPage.js
import React, { useEffect, useRef, useState } from "react";
import NavigationBar from "./NavigationBar";
import styles from "./LandingPage.module.css";
import DLMBot from "./DLM_bot";
import PWAInstallPrompt from "./pwa";
import iOSInstallPopup from "./iOSInstallPopup";
import { useScroll, useTransform, motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';


export default function LandingPage() {
  const navigate = useNavigate();

  const { scrollY } = useScroll();
  const [vh, setVh] = useState("300vh");

  // Constants to control zoom/fade behavior
  const ZOOM_LIMIT = 300; // How far to zoom before stopping
  const MAX_SCALE = 4; // Max zoom scale

  // Animate scale of the logo image
  const scale = useTransform(scrollY, [0, ZOOM_LIMIT], [1, MAX_SCALE]);
  const opacity = useTransform(scrollY, [0, ZOOM_LIMIT * 0.7, ZOOM_LIMIT], [1, 0.5, 0]);

  // Set vh dynamically based on the screen height
  useEffect(() => {
    const screenHeight = window.innerHeight;
    setVh(`${(ZOOM_LIMIT / 100) * screenHeight}px`);
  }, []);

  // const scrollRef = useRef();
  // const [scrollProgress, setScrollProgress] = useState(0);
  
  // useEffect(() => {
  //   const handleScroll = () => {
  //     const section = scrollRef.current;
  //     if (!section) return;
  
  //     const rect = section.getBoundingClientRect();
  //     const totalHeight = window.innerHeight + section.offsetHeight;
  //     const progress = 1 - (rect.bottom - window.innerHeight) / totalHeight;
  
  //     setScrollProgress(Math.min(Math.max(progress, 0), 1));
  //   };
  
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  // // Calculate opacity based on scroll
  // const titleOpacity = scrollProgress < 0.9
  // ? 1
  // : scrollProgress > 0.5
  // ? 0
  // : 1 - (scrollProgress - 0.08) / 0.2;

  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const step1Opacity = useTransform(scrollYProgress, [0.0, 0.1, 0.2], [1, 1, 0]);
  const step2Opacity = useTransform(scrollYProgress, [0.2, 0.3, 0.4], [0, 1, 0]);
  const step3Opacity = useTransform(scrollYProgress, [0.4, 0.5, 0.6], [0, 1, 1]);


  const sections = [
    {
      texts: [
        "Section 1: First part of description.",
        "Section 1: Second part of description.",
        "Section 1: Third part of description.",
      ],
      gifSrc: "https://cdn.dribbble.com/userupload/19490657/file/original-50bc6c3af904efa302b532a17f6cc6fa.gif",
    },
    {
      texts: [
        "Section 2: First part of description.",
        "Section 2: Second part of description.",
        "Section 2: Third part of description.",
      ],
      gifSrc: "https://cdn.pond5.com/blog/rs/uploads/2016/05/GIF-Tutorial-Step-2.gif",
    },
    {
      texts: [
        "Section 3: First part of description.",
        "Section 3: Second part of description.",
        "Section 3: Third part of description.",
      ],
      gifSrc: "https://wideo.co/wp-content/uploads/2016/04/GIFWIDEO.gif",
    },
    {
      texts: [
        "Section 3: First part of description.",
        "Section 3: Second part of description.",
        "Section 3: Third part of description.",
      ],
      gifSrc: "https://aterimber.com/wp-content/uploads/2020/11/GIF-Tutorial-SAVEDFORWEB-1.gif",
    },
  ];

  // Section animation variants
  const sectionVariants = {
    offscreen: {
      opacity: 0,
      y: 100,
      scale: 0.95,
    },
    onscreen: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 25,
        duration: 1.2,
        ease: "easeOut",
      },
    },
  };
  const tiltVariants = {
    hover: {
      scale: 1.05,
      rotateX: 10,
      rotateY: 10,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  // Text animation variants (one by one)
  const textVariants = {
    offscreen: {
      opacity: 0,
      x: -50,
    },
    onscreen: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 25,
        duration: 1.0,
        ease: "easeOut",
      },
    },
  };
  const parallaxVariants = {
    offscreen: {
      y: 100,
    },
    onscreen: {
      y: 0,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 25,
        duration: 1.2,
        ease: "easeOut",
      },
    },
  };
  const fadeSlideUpVariants = {
    offscreen: {
      opacity: 0,
      y: 50,
    },
    onscreen: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 25,
        duration: 1,
        ease: "easeOut",
      },
    },
  };

  const imageVariants = {
    offscreen: {
      opacity: 0,
      scale: 0.9,
    },
    onscreen: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.3,
        type: "spring",
        stiffness: 100,
        damping: 30,
        duration: 1.0,
        ease: "easeOut",
      },
    },
  };
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY, target } = e;
    const { left, top, width, height } = target.getBoundingClientRect();

    // Calculate the position of the mouse relative to the element
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;

    // Set the tilt values (in range -10 to 10 for both axes)
    setTilt({
      x: y * 15, // Rotate based on Y-axis (vertical mouse movement)
      y: -x * 15, // Rotate based on X-axis (horizontal mouse movement)
    });
  };

  


  return (

      <>
      <NavigationBar />
      {/* Background layer that fades out */}
      <div style={{color:"white"}}>Under Construction. Please check back later</div>
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "100%",
          backgroundImage: `url(${process.env.PUBLIC_URL}/website_landingpage_bg.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 10,
          opacity,
          pointerEvents: "none",
        }}
      />
      {/* Centered zooming logo */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "100%",
          display: "grid",
          placeItems: "center",
          zIndex: 11,
          pointerEvents: "none",
        }}
      >
        <motion.img
          src="/inkai-removebg-preview.png"
          alt="InkQuizly Logo"
          style={{
            width: "80px",
            height: "80px",
            scale,
            opacity
          }}
        />
      </div>

      {/* Invisible spacer to push the main content down */}
      <div style={{ height: vh, width: "100%" }} />



      <div className={styles.landingContent}>
      <div style={{ height: "100px" }} /> {/* Spacer */}
        <PWAInstallPrompt />
        <iOSInstallPopup />
        <DLMBot />

        <motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1 }}
  style={{
    width: "100%",
    padding: "200px 20px",
    textAlign: "center",
    fontSize: "2.5rem",
    fontWeight: "bold",
    lineHeight: "1.6",
    marginTop: "1900px",
  }}
>
<p
  style={{
    background: "linear-gradient(90deg, #2893fe, #e52e71)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontSize: "3rem", // optional styling
    fontWeight: "bold",
  }}
>What is InkQuizly?</p>
  
  <motion.p
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.8, duration: 1 }}
    style={{
      fontSize: "1.2rem",
      fontWeight: "normal",
      maxWidth: "700px",
      margin: "30px auto 0",
      color: "white",
      lineHeight: "1.8",
    }}
  >
    InkQuizly is your AI-powered companion for smarter, more effective note-taking. Enhanced by Google Gemini for smarter summaries, clearer explanations, and richer notes—typed or handwritten. Where timeless study methods like Pomodoro meet the latest machine intelligence technologies, InkQuizly reimagines how you learn, review, and grow.
  </motion.p>
</motion.div>

        {/* Scroll-triggered Sections */}
        {sections.map((section, index) => (
          <motion.div
            key={index}
            variants={fadeSlideUpVariants}
            initial="offscreen"
            whileInView="onscreen"
          >
    <motion.div
      onMouseMove={handleMouseMove}
      variants={{
        hover: {
          scale: 1.05,
          rotateX: tilt.x, // Dynamic X-axis tilt
          rotateY: tilt.y, // Dynamic Y-axis tilt
          transition: { type: "spring", stiffness: 300, damping: 20 },
        },
      }}
      initial="rest"
      whileHover="hover"
    >          <motion.div
        variants={parallaxVariants}
        initial="offscreen"
        whileInView="onscreen"
        style={{ padding: "50px", background: "rgba(127, 123, 123, 0.35)", textAlign: "center",borderRadius:"20px" }}
        
      >
            {/* Your section content */}
            <motion.section
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                overflow: "hidden",
              }}
            >

            {/* Text on the left */}
            <div style={{ width: "50%", fontSize: "1.5rem", lineHeight: "1.6" }}>
              {section.texts.map((text, textIndex) => (
                <motion.p
                  key={textIndex}
                  variants={textVariants}
                  style={{ margin: "0 0 0 0",color: "white" }}
                  initial="offscreen"
                  whileInView="onscreen"
                  transition={{
                    delay: textIndex * 0.3, // Stagger text animation by delay
                    duration: 1,
                    ease: "easeOut",
                  }}
                >
                  {text}
                </motion.p>
              ))}
            </div>

            {/* Gif on the right */}
            <div style={{ width: "50%" }}>
              <motion.img
                src={section.gifSrc}
                alt="GIF"
                variants={imageVariants}
                style={{ maxWidth: "100%", height: "auto", borderRadius: "10px" }}
              />
            </div>
          </motion.section></motion.div></motion.div></motion.div>
        ))}

<motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 1 }}
      style={{
        background: 'linear-gradient(135deg, rgb(0, 213, 255), rgb(8, 37, 252))',
        padding: '100px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '100vh',
        color: 'white',
        borderRadius: '20px',
      }}
    >
      <motion.h2
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 2 }}
        style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '20px',
        }}
      >
        Join InkQuizly Today
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 2 }}
        style={{
          fontSize: '1.2rem',
          marginBottom: '30px',
          maxWidth: '600px',
        }}
      >
        Unlock smarter note-taking with Gemini AI. Sign up to start your learning journey with InkQuizly. It's quick, easy, and free!
      </motion.p>

      {/* Scroll-triggered Sign-Up Button */}
      <motion.button
        onClick={() => {
          navigate('/SignUp')
        }}
        whileHover={{
          scale: 1.1,
          boxShadow: '0 10px 20px rgba(41, 147, 254, 0.6)',
          textShadow: '0 0 8px rgba(41, 147, 254, 0.7)', // Glowing text effect
        }}
        whileTap={{
          scale: 0.98,
          boxShadow: '0 5px 10px rgba(41, 147, 254, 0.4)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          delay: 1.1,
          duration: 2,
        }}
        style={{
          padding: '15px 30px',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: 'white',
          background: 'linear-gradient(90deg,rgb(47, 40, 254),rgb(113, 46, 229))',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          marginTop: '30px',
        }}
      >
        Sign Up
      </motion.button>
    </motion.div>

<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1 }}
  style={{
    width: "100%",
    padding: "50px 20px",
    textAlign: "center",
    fontSize: "2.5rem",
    fontWeight: "bold",
    lineHeight: "1.6",
    marginTop: "100px", // Adjust as needed
  }}
>
  <p
    style={{
      background: "linear-gradient(90deg, #2893fe, #e52e71)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      fontSize: "3rem", // Optional styling
      fontWeight: "bold",
    }}
  >
    Contact Us
  </p>

  {/* Cool Framer Motion Button with Shape Transformation */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1.2, duration: 1 }}
  >
    <motion.a
      href="mailto:pranavgowrish@gmail.com,vignesh.tho2006@gmail.com,pratheek0928@gmail.com,sathvik.kum@gmail.com"
      style={{
        fontSize: "1.2rem",
        fontWeight: "bold",
        color: "white",
        textDecoration: "none",
        padding: "10px 20px",
        border: "2px solid #2893fe",
        borderRadius: "50px", // Rounded shape initially
        background: "linear-gradient(90deg, #2893fe, #e52e71)",
        boxShadow: "0 4px 15px rgba(41, 147, 254, 0.5)",
        display: "inline-block",
        transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border-radius 0.3s ease",
      }}
      whileHover={{
        scale: 1.1, // Slight scale up
        boxShadow: "0 10px 20px rgba(41, 147, 254, 0.6)",
        textShadow: "0 0 8px rgba(41, 147, 254, 0.7)", // Glowing text effect
        cursor: "pointer",
        borderRadius: "20px", // Transform to a less rounded rectangle
      }}
      whileTap={{
        borderRadius: "100%", // Fully rounded when clicked
      }}

    >
      Email the Team
    </motion.a>
      <div style={{ marginTop: "20px", fontSize: "20px", color: "#fff", textAlign: "center" }}>
  <p style={{ margin: 0 }}>Created by</p>
  <p style={{ margin: 0 }}>
    Pranav Gowrishankar, Vignesh Thondikulam, Pratheek Sunilkumar, Sathvik Kumar
  </p>
</div>
  </motion.div>
</motion.div>






 
        {/* <section className={styles.section}>
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
</section>  */}


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
<div
  style={{
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '10px',
    marginBottom: '30px',
  }}
>
Google Gemini can make mistakes, so double-check it.</div>
</>
  );
}