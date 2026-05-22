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
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareWarning, AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: (comment: string) => void;
}

export function RejectModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: Props) {
  const currentUser = useAppStore((s) => s.currentUser);
  const [comment, setComment] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!currentUser) return;
    if (!comment.trim()) {
      setError("Rejection comment is required");
      return;
    }
    if (password !== currentUser.password) {
      setError("Incorrect password");
      return;
    }
    onConfirm(comment.trim());
    setComment("");
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setComment("");
      setPassword("");
      setError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <MessageSquareWarning className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reject-comment">
              Rejection Comment <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reject-comment"
              placeholder="Explain why this document is being rejected..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError("");
              }}
              rows={3}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reject-password">Password</Label>
            <Input
              id="reject-password"
              type="password"
              placeholder="Enter your password to confirm"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={!comment.trim() || !password}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
