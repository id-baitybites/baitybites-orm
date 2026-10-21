"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import "./Checkbox.scss";

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className = "", ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={`radix-checkbox ${className}`}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="radix-checkbox__indicator">
      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
