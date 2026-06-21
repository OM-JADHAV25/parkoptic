import React from "react";
import styles from "./Skeleton.module.css";

interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "text" | "rect" | "circle";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const skeletonClassName = [
    styles.skeleton,
    variant === "circle" ? styles.circle : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const customStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return <span className={skeletonClassName} style={customStyle} {...props} />;
}
