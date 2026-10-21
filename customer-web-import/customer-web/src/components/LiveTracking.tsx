"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

const STAGES = [
  { label: "Confirmed", text: "Restaurant confirmed your order", eta: "28 min" },
  { label: "Preparing", text: "The kitchen is preparing your food", eta: "21 min" },
  { label: "On the way", text: "Rider is on the way to you", eta: "9 min" },
  { label: "Delivered", text: "Delivered. Enjoy your meal", eta: "Done" },
];

export default function LiveTracking() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setStep((s) => (s + 1) % STAGES.length), 2600);
    return () => clearInterval(timer);
  }, []);

  const pct = (step / (STAGES.length - 1)) * 100;
  const current = STAGES[step];

  return (
    <section id="tracking" className="sec">
      <div className="track-panel">
        <div>
          <h2>Know where your food is, every minute</h2>
          <p className="track-sub">
            From the moment the kitchen confirms your order to the knock at your door, follow each step live.
          </p>
          <a href="#restaurants" className="track-cta">Place an order</a>
        </div>
        <div className="track-card" aria-live="polite">
          <div className="track-head">
            <span>Example order</span>
            <span className="eta">{current.eta}</span>
          </div>
          <div className="route">
            <div className="route-fill" style={{ width: `${pct}%` }} />
            {STAGES.map((s, i) => (
              <span
                key={s.label}
                className={`stop ${i <= step ? "done" : ""}`}
                style={{ left: `${(i / (STAGES.length - 1)) * 100}%` }}
              />
            ))}
            <span className="rider" style={{ left: `${pct}%` }}>
              <Icon name="bike" size={18} />
            </span>
          </div>
          <div className="labels">
            {STAGES.map((s, i) => (
              <span key={s.label} className={i <= step ? "on" : ""}>
                {s.label}
              </span>
            ))}
          </div>
          <div className="track-status">
            <Icon name="clock" size={18} />
            <span>{current.text}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
