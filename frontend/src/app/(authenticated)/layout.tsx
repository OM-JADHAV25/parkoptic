"use client";

import React, { useState } from "react";
import {
  Sidebar,
  TopNavigation,
  WorkspaceContainer,
  StartupLoader,
  AICopilotButton
} from "@/components/layout";
import { AnimatePresence, motion } from "framer-motion";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isBooted, setIsBooted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <>
      {/* 1. Global Noise Overlay */}
      <div className="noise-overlay" />

      {/* 2. Premium Startup Boot Loader Sequence */}
      <AnimatePresence mode="wait">
        {!isBooted ? (
          <StartupLoader key="startup" onComplete={() => setIsBooted(true)} />
        ) : (
          <motion.div
            key="dashboard-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              padding: "24px",
              paddingLeft: "338px",   /* 24px gap + 290px sidebar + 24px gap */
              boxSizing: "border-box",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Sidebar Floating Console — fixed position, lives outside document flow */}
            <Sidebar />

            {/* Mobile backdrop overlay */}
            {isSidebarOpen && (
              <div
                onClick={closeSidebar}
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(2px)",
                  zIndex: 190,
                }}
                className="lg:hidden"
              />
            )}

            {/* Main Command Workspace Section */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                minWidth: 0,
                minHeight: 0,
                position: "relative",
              }}
            >
              <TopNavigation onToggleSidebar={toggleSidebar} />
              <WorkspaceContainer>{children}</WorkspaceContainer>
            </div>

            {/* Floating AI Copilot Action Point */}
            <AICopilotButton />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
