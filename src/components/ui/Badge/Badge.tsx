import type { ReactNode } from "react";

import "./Badge.scss";

export type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "neutral",
  size = "sm",
}: BadgeProps) {
  return (
    <span
      className={`badge badge--${variant} badge--${size}`}
    >
      {children}
    </span>
  );
}