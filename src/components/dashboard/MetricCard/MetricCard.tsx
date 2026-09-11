import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";

import "./MetricCard.scss";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: IconSvgElement;
  variant?: "primary" | "success" | "info" | "warning";
}

export function MetricCard({
  label,
  value,
  icon,
  variant = "primary",
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${variant}`}>
      <div className="metric-card__icon">
        <HugeiconsIcon
          icon={icon}
          size={23}
          strokeWidth={1.8}
        />
      </div>

      <div className="metric-card__content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}