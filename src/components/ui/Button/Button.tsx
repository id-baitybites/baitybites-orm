import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";

import "./Button.scss";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconSvgElement;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={[
        "button",
        `button--${variant}`,
        `button--${size}`,
        icon ? "button--with-icon" : "",
        loading ? "button--loading" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isDisabled}
      onClick={onClick}
    >
      {loading ? (
        <span
          className="button__spinner"
          aria-hidden="true"
        />
      ) : (
        icon &&
        iconPosition === "left" && (
          <HugeiconsIcon
            icon={icon}
            size={size === "sm" ? 15 : size === "lg" ? 19 : 17}
            strokeWidth={1.8}
          />
        )
      )}

      <span className="button__label">
        {children}
      </span>

      {!loading &&
        icon &&
        iconPosition === "right" && (
          <HugeiconsIcon
            icon={icon}
            size={size === "sm" ? 15 : size === "lg" ? 19 : 17}
            strokeWidth={1.8}
          />
        )}
    </button>
  );
}