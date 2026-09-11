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
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dialog__header">
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Title className="dialog__title">
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Description className="dialog__description">
      {children}
    </DialogPrimitive.Description>
  );
}