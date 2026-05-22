"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void;
}

export function PasswordConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "default",
  onConfirm,
}: Props) {
  const currentUser = useAppStore((s) => s.currentUser);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!currentUser) return;
    if (password !== currentUser.password) {
      setError("Incorrect password");
      return;
    }
    setPassword("");
    setError("");
    onConfirm();
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setPassword("");
      setError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              Enter your password to proceed
            </Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={!password}
            className={
              confirmVariant === "default"
                ? "bg-brand-primary hover:bg-brand-primary/90"
                : ""
            }
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
