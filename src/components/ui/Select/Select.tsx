"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import "./Select.scss";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={`radix-select__trigger ${className}`}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="radix-select__arrow" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className = "", children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={`radix-select__content ${className}`}
      position={position}
      sideOffset={4}
      {...props}
    >
      <SelectPrimitive.Viewport className="radix-select__viewport">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={`radix-select__item ${className}`}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="radix-select__indicator">
      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
