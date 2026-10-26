import type { CSSProperties } from "react";
import styles from "./solar-system.module.css";

const bodies = [
  ["mercury", "7.5s", "#a9acb3"], ["venus", "11s", "#e8b77c"], ["earth", "15s", "#4f9fd2"],
  ["mars", "20s", "#d97952"], ["jupiter", "27s", "#d5b18c"], ["saturn", "35s", "#e4ca8e"],
  ["uranus", "44s", "#8ed4d2"], ["neptune", "54s", "#668bdb"],
];

export function SolarSystemArtwork({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.solarArt} solar-art ${className}`} aria-hidden="true">
      <div className={styles.solarGlow} />
      <div className={styles.solarCore}><span /></div>
      {bodies.map(([name, duration, color], index) => (
        <div className={`${styles.orbit} ${styles[`orbit_${name}`]}`} key={name} style={{ "--orbit-speed": duration } as CSSProperties}>
          <span className={`${styles.orbitBody} ${styles[`body_${name}`]}`} style={{ "--planet-color": color, "--planet-scale": `${0.48 + index * 0.075}` } as CSSProperties} />
        </div>
      ))}
      <div className={`${styles.solarDust} ${styles.dustOne}`} /><div className={`${styles.solarDust} ${styles.dustTwo}`} /><div className={`${styles.solarDust} ${styles.dustThree}`} />
    </div>
  );
}
