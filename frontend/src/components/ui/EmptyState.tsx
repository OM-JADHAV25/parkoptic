import React from "react";
import styles from "./EmptyState.module.css";
import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon = <AlertCircle size={28} />,
  action
}: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.iconWrapper}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && <div className={styles.actions}>{action}</div>}
    </div>
  );
}
