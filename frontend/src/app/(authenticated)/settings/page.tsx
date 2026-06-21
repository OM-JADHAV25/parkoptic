import React from "react";
import { PageWrapper } from "@/components/layout";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui";

export default function SettingsPlaceholder() {
  return (
    <PageWrapper
      title="Settings & Configurations"
      description="Configure city boundary offsets, patrol thresholds, API nodes, and administrative access keys."
    >
      <Card variant="glass">
        <CardBody>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
            The global settings panels will render in this workspace canvas. The surrounding floating navigation shell and telemetry loops remain mounted.
          </p>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
