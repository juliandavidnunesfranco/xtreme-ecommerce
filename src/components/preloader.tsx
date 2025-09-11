"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./logo";

// Variant for the SVG path drawing animation
const drawVariant = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: 0.2, type: "spring", duration: 1.5, bounce: 0 },
      opacity: { delay: 0.2, duration: 0.01 },
    },
  },
};

// Variant for the text reveal animation
const textVariant = {
  hidden: { opacity: 0, y: 50, skewY: 5 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    skewY: 0,
    transition: {
      delay: 1.5 + i * 0.15, // Start after the 'X' is drawn
      duration: 1.2,
      ease: [0.23, 1, 0.32, 1],
    },
  }),
};

const PreLoader: React.FC = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide the preloader after the full animation sequence completes
    const timeout = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="preloader"
          style={{
            height: "100vh",
            width: "100%",
            background: "#0a122e",
            color: "#ffffff",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
          exit={{
            y: "-100vh",
            opacity: 0,
            transition: { duration: 1, ease: "easeInOut" },
          }}
        >
          <motion.div
            className="flex flex-col md:flex-row items-center justify-center text-xl md:text-2xl font-bold"
            initial="hidden"
            animate="visible"
          >
            {/* Top line for mobile, first part of row for desktop */}
            <motion.div className="flex items-center">
              <motion.svg
                width="40"
                height="40"
                viewBox="0 0 32 32"
                className="mr-2"
              >
                <motion.line
                  x1="4"
                  y1="28"
                  x2="28"
                  y2="4"
                  stroke="currentColor"
                  strokeWidth="3"
                  variants={drawVariant}
                />
                <motion.line
                  x1="4"
                  y1="4"
                  x2="28"
                  y2="28"
                  stroke="currentColor"
                  strokeWidth="3"
                  variants={drawVariant}
                />
              </motion.svg>
              <motion.span variants={textVariant} custom={1}>
                treme Construction
              </motion.span>
            </motion.div>

            {/* The slash, only on desktop */}
            <motion.span
              variants={textVariant}
              custom={2}
              className="hidden md:block mx-2"
            >
              /
            </motion.span>

            {/* Bottom line for mobile, second part of row for desktop */}
            <motion.div className="flex items-center mt-2 md:mt-0">
              <motion.span variants={textVariant} custom={3}>
                E-commerce
              </motion.span>
              <motion.div variants={textVariant} custom={4} className="ml-3">
                <Logo width={90} height={90} />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PreLoader;
