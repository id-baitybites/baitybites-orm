"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import "./Dialog.scss";

export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog__overlay" />

      <DialogPrimitive.Content
        className={`dialog__content ${className}`}
        {...props}
      >
        {children}

        <DialogPrimitive.Close className="dialog__close">
          <HugeiconsIcon icon={Cancel01Icon} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  children,
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={`dialog__header ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title className={`dialog__title ${className}`} {...props}>
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={`dialog__description ${className}`} {...props}>
      {children}
    </DialogPrimitive.Description>
  );
}