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

</>
  );
}