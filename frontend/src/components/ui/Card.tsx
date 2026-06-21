"use client";

import React, { useRef } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "glass" | "elevated" | "success" | "warning" | "critical";
  interactive?: boolean;
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  glass: {
    backgroundColor: "rgba(8, 12, 28, 0.7)",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 8px 32px -4px rgba(0, 0, 0, 0.4)",
  },
  elevated: {
    backgroundColor: "#111528",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
  },
  success: {
    backgroundColor: "rgba(6, 78, 59, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    boxShadow: "0 0 15px rgba(16, 185, 129, 0.05)",
  },
  warning: {
    backgroundColor: "rgba(120, 53, 15, 0.1)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    boxShadow: "0 0 15px rgba(245, 158, 11, 0.05)",
  },
  critical: {
    backgroundColor: "rgba(127, 29, 29, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    boxShadow: "0 0 20px rgba(239, 68, 68, 0.08)",
  },
};

export function Card({
  children,
  variant = "default",
  interactive = false,
  className = "",
  style,
  onMouseMove,
  ...props
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);

    if (onMouseMove) onMouseMove(e);
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: "16px",
    padding: "22px 24px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
    ...variantStyles[variant],
    ...(interactive
      ? {
          cursor: "pointer",
          backgroundImage:
            "radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(6, 182, 212, 0.05), transparent 80%)",
        }
      : {}),
    ...style,
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={className}
      style={baseStyles}
      {...props}
    >
      {children}
    </div>
  );
}

// Composition subcomponents
export function CardHeader({
  children,
  className = "",
  title,
  subtitle,
  style,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & { title?: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "16px",
        ...style,
      }}
      {...props}
    >
      <div>
        {title && (
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "#f1f5f9",
              letterSpacing: "0.025em",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h3>
        )}
        {subtitle && (
          <p
            style={{
              fontSize: "0.7rem",
              color: "#64748b",
              marginTop: "5px",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "", style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        fontSize: "0.8rem",
        color: "#94a3b8",
        lineHeight: 1.6,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        marginTop: "16px",
        paddingTop: "12px",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "8px",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Bind subcomponents (kept for backward compatibility, prefer direct imports)
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
