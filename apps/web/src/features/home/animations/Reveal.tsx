"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./animations.module.css";

type Props = {
  children: ReactNode;
  delay?: number;
  variant?: "up" | "left" | "right" | "scale";
  className?: string;
};

export function Reveal({ children, delay = 0, variant = "up", className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = { "--delay": `${delay}ms` } as CSSProperties;

  return (
    <div
      ref={ref}
      style={style}
      className={`${styles.reveal} ${styles[variant]} ${visible ? styles.visible : ""} ${className}`}
    >
      {children}
    </div>
  );
}
