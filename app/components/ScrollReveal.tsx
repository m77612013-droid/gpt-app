"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "fade";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const variants: Record<Direction, Variants> = {
  up:    { hidden: { opacity: 0, y: 48 },   visible: { opacity: 1, y: 0 } },
  down:  { hidden: { opacity: 0, y: -48 },  visible: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: 48 },   visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: -48 },  visible: { opacity: 1, x: 0 } },
  fade:  { hidden: { opacity: 0 },           visible: { opacity: 1 } },
};

export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
  once = true,
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      variants={variants[direction]}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
