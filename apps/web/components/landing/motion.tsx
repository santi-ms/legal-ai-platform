"use client";

import { motion, useInView, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from "framer-motion";
import { useRef, useEffect, type ReactNode } from "react";

/**
 * Primitivas de motion para la landing.
 *
 * Todas son Client Components, pero se importan solo donde se usan. El
 * shell de la landing sigue siendo RSC — las secciones que usan motion
 * pueden envolver children específicos en `<Reveal>` sin convertir toda
 * la sección a client.
 */

// ─── Reveal: fade-in-up cuando entra en viewport ────────────────────────────

interface RevealProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  /** Desplazamiento Y inicial en px. Default: 24 */
  y?: number;
  /** `once: true` — solo anima la primera vez que entra al viewport */
  once?: boolean;
  /** Margen de trigger — "-100px" dispara antes de entrar completamente */
  margin?: string;
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  once = true,
  margin = "-80px",
  className,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once,
    margin: margin as `${number}px`,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// ─── RevealStagger: contenedor con children escalonados ────────────────────

interface StaggerProps {
  children: ReactNode;
  /** Delay base del primer child, en segundos */
  startDelay?: number;
  /** Delay entre cada child */
  stagger?: number;
  className?: string;
}

export function RevealStagger({
  children,
  startDelay = 0,
  stagger = 0.08,
  className,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once: true,
    margin: "-80px",
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            delayChildren: startDelay,
            staggerChildren: stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Child de `<RevealStagger>` — aplica el fade-up individual */
export function StaggerItem({
  children,
  y = 20,
  className,
}: {
  children: ReactNode;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── MagneticButton: el botón sigue sutilmente al cursor ───────────────────

interface MagneticProps {
  children: ReactNode;
  /** Rango de atracción en px. Default: 60 */
  range?: number;
  /** Intensidad del pull — 0-1. Default: 0.25 */
  strength?: number;
  className?: string;
  asChild?: boolean;
}

export function Magnetic({
  children,
  range = 60,
  strength = 0.25,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < range) {
        x.set(dx * strength);
        y.set(dy * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    }

    function handleLeave() {
      x.set(0);
      y.set(0);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [range, strength, x, y]);

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── CountUp: animación de contador numérico ───────────────────────────────

import { animate } from "framer-motion";

export function CountUp({
  to,
  duration = 1.8,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (!inView) return;
    const unsub = rounded.on("change", (v) => {
      if (textRef.current) textRef.current.textContent = String(v);
    });
    const controls = animate(count, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => {
      unsub();
      controls.stop();
    };
  }, [inView, to, duration, count, rounded]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      <span ref={textRef}>0</span>
      {suffix}
    </motion.span>
  );
}
