import React from "react";

interface PageWrapperProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageWrapper({
  children,
  title,
  description,
  actions
}: PageWrapperProps) {
  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-1.5 leading-normal">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
