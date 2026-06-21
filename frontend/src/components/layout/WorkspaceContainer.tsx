"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

interface WorkspaceContainerProps {
  children: React.ReactNode;
}

export function WorkspaceContainer({ children }: WorkspaceContainerProps) {
  const pathname = usePathname();

  return (
    <main
      style={{
        flex: 1,
        backgroundColor: "rgba(2, 6, 23, 0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "24px",
        overflowY: "auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
