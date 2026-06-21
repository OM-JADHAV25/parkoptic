import React from "react";
import styles from "./Badge.module.css";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "success" | "warning" | "critical" | "info" | "neutral";
  pulse?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  pulse = false,
  className = "",
  ...props
}: BadgeProps) {
  const badgeClassName = [
    styles.badge,
    styles[variant],
    pulse ? styles.pulse : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={badgeClassName} {...props}>
      {pulse && <span className={styles.pulseDot} />}
      {children}
    </span>
  );
}
