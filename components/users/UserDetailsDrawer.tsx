"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Eye, EyeOff, Copy, Shield, Activity, KeyRound, LogOut, LockKeyhole, Unlock, Trash2, Archive, Ban, BadgeCheck, Download, Fingerprint } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ROLE_PERMISSIONS } from "@/lib/adminSecurity";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import type { Department, Role, User } from "@/types";

type UserDrawerTab = "profile" | "security" | "permissions" | "activity" | "admin";

type UserDrawerFormProps = {
  user: User;
  onOpenChange: (open: boolean) => void;
  activeTab: UserDrawerTab;
  onActiveTabChange: (tab: UserDrawerTab) => void;
};

function createProfileDraft(user: User) {
  return {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    employeeId: user.employeeId || "",
    role: (user.role || "QC_EXEC") as Role,
    department: (user.department || "QC") as Department,
    status: (user.status || "Active") as User["status"],
    reason: user.statusReason || user.suspendedReason || "",
  };
}

function UserSummaryCard({ user }: { user: User }) {
  return (
    <div className="rounded-xl border border-border/60 bg-white p-[var(--space-standard)] shadow-sm">
      <div className="flex items-start gap-[var(--space-standard)]">
        <Avatar className="h-12 w-12 rounded-lg border border-border/60 bg-[var(--bg-muted-30)]">
          <AvatarFallback className="bg-[var(--color-brand-primary)] text-white font-semibold">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.username} · {user.role.replace("_", " ")} · {user.department}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <UserStatusBadge status={user.status} />
            {user.forcePasswordChange && <Badge variant="outline" className="bg-[var(--bg-muted-30)]">Password change required</Badge>}
            <Badge variant="outline" className="bg-[var(--bg-muted-30)]">Failed attempts: {user.failedLoginAttempts || 0}</Badge>
            <Badge variant="outline" className="bg-[var(--bg-muted-30)]">Employee ID: {user.employeeId || "—"}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDrawerContent({ user, onOpenChange, activeTab, onActiveTabChange }: UserDrawerFormProps) {
  console.log("[UserDrawerContent] render", { userId: user.id, activeTab });

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b px-[var(--space-large)] py-[var(--space-standard)] bg-[var(--color-brand-primary)] text-white">
        <div className="flex items-start gap-[var(--space-standard)]">
          <Avatar className="w-14 h-14 rounded-lg border border-white/10 bg-white/6"><AvatarFallback className="bg-white/10 text-white text-lg font-semibold">{initials(user.name)}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-[var(--type-section-title-size)] text-white font-semibold">{user.name}</SheetTitle>
            <SheetDescription className="text-white/80">{user.username} · {user.role.replace("_", " ")} · {user.department}</SheetDescription>
            <div className="mt-[var(--space-compact)] flex flex-wrap items-center gap-[var(--space-compact)]">
              <UserStatusBadge status={user.status} />
              {user.forcePasswordChange && (<Badge variant="outline" className="border-white/20 bg-white/5 text-white text-[var(--type-helper-size)]">Password change required</Badge>)}
              <Badge variant="outline" className="border-white/20 bg-white/5 text-white text-[var(--type-helper-size)]">Failed attempts: {user.failedLoginAttempts || 0}</Badge>
            </div>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 px-[var(--space-large)] py-[var(--space-section)]">
        <div className="w-full rounded-full bg-muted p-[3px]">
          <div className="grid grid-cols-2 gap-[3px] sm:flex sm:flex-wrap">
            {(["profile", "security", "permissions", "activity", "admin"] as UserDrawerTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  console.log("[UserDrawerContent] tab change", { userId: user.id, from: activeTab, to: tab });
                  onActiveTabChange(tab);
                }}
                aria-pressed={activeTab === tab}
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-[var(--space-section)] py-[6px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-[var(--space-section)]">
          {activeTab === "profile" && <ProfileTab key={`profile-${user.id}`} user={user} onOpenChange={onOpenChange} />}
          {activeTab === "security" && <SecurityTab key={`security-${user.id}`} user={user} />}
          {activeTab === "permissions" && <PermissionsTab key={`permissions-${user.id}`} user={user} />}
          {activeTab === "activity" && <ActivityTab key={`activity-${user.id}`} user={user} />}
          {activeTab === "admin" && <AdminTab key={`admin-${user.id}`} user={user} onOpenChange={onOpenChange} />}
        </div>
      </div>

      <SheetFooter className="border-t px-[var(--space-large)] py-[var(--space-compact)]">
        <div className="flex flex-wrap items-center gap-[var(--space-compact)]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" onClick={() => window.print()}><Download className="w-4 h-4 mr-2"/> Export profile</Button>
        </div>
      </SheetFooter>
    </div>
  );
}

function ProfileTab({ user, onOpenChange }: { user: User; onOpenChange: (open: boolean) => void }) {
  const updateUser = useAppStore((s) => s.updateUser);
  const [draft, setDraft] = useState(() => createProfileDraft(user));

  console.log("PROFILE RENDER", { userId: user.id, draftName: draft.name });

  const saveProfile = () => {
    const nextUser: User = {
      ...user,
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      employeeId: draft.employeeId.trim(),
      role: draft.role,
      department: draft.department,
      status: draft.status,
      statusReason: draft.reason.trim() || user.statusReason || null,
      suspendedReason: draft.reason.trim() || user.suspendedReason || null,
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    updateUser(nextUser);
    toast.success("User profile updated", { description: `${user.name} was saved successfully.` });
  };

  return (
    <div className="space-y-[var(--space-section)]">
      <div className="grid gap-[var(--space-standard)] md:grid-cols-2">
        <div className="space-y-[var(--space-compact)]"><Label>Full name</Label><Input value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} /></div>
        <div className="space-y-[var(--space-compact)]"><Label>Username</Label><Input value={user.username} disabled /></div>
        <div className="space-y-[var(--space-compact)]"><Label>Email</Label><Input value={draft.email} onChange={(e) => setDraft((current) => ({ ...current, email: e.target.value }))} /></div>
        <div className="space-y-[var(--space-compact)]"><Label>Phone</Label><Input value={draft.phone} onChange={(e) => setDraft((current) => ({ ...current, phone: e.target.value }))} placeholder="+91..." /></div>
        <div className="space-y-[var(--space-compact)]"><Label>Employee ID</Label><Input value={draft.employeeId} onChange={(e) => setDraft((current) => ({ ...current, employeeId: e.target.value }))} /></div>
        <div className="space-y-[var(--space-compact)]"><Label>Created date</Label><Input value={formatDate(user.createdAt)} disabled /></div>
        <div className="space-y-[var(--space-compact)]"><Label>Role</Label><Select value={draft.role} onValueChange={(value) => setDraft((current) => ({ ...current, role: value as Role }))}><SelectTrigger className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="SADMIN">Super Admin</SelectItem><SelectItem value="QA_MGR">QA Manager</SelectItem><SelectItem value="QA_EXEC">QA Executive</SelectItem><SelectItem value="QC_MGR">QC Manager</SelectItem><SelectItem value="QC_EXEC">QC Executive</SelectItem></SelectContent></Select></div>
        <div className="space-y-[var(--space-compact)]"><Label>Department</Label><Select value={draft.department} onValueChange={(value) => setDraft((current) => ({ ...current, department: value as Department }))}><SelectTrigger className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="SYSTEM">System</SelectItem><SelectItem value="QA">QA</SelectItem><SelectItem value="QC">QC</SelectItem></SelectContent></Select></div>
        <div className="space-y-[var(--space-compact)]"><Label>Status</Label><Select value={draft.status} onValueChange={(value) => setDraft((current) => ({ ...current, status: value as User["status"] }))}><SelectTrigger className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Suspended">Suspended</SelectItem><SelectItem value="Locked">Locked</SelectItem><SelectItem value="Archived">Archived</SelectItem><SelectItem value="Disabled">Disabled</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-[var(--space-compact)]"><Label>Status reason</Label><Textarea value={draft.reason} onChange={(e) => setDraft((current) => ({ ...current, reason: e.target.value }))} rows={3} placeholder="Suspension or status note..." /></div>
      <div className="flex flex-wrap gap-[var(--space-compact)]"><Button onClick={saveProfile} className="bg-brand-primary hover:bg-brand-primary/90">Save profile</Button><Button variant="outline" onClick={() => onOpenChange(false)}>Close drawer</Button></div>
    </div>
  );
}

function SecurityTab({ user }: { user: User }) {
  const resetPassword = useAppStore((s) => s.resetPassword);
  const readPasswordFromStore = useAppStore((s) => s.getUserPassword);
  const currentUser = useAppStore((s) => s.currentUser)!;
  const isSAdmin = currentUser.role === "SADMIN";

  const [showPassword, setShowPassword] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  console.log("SECURITY RENDER", { userId: user.id, showPassword });

  const handleResetPassword = () => {
    if (!isSAdmin) { toast.error("Only SADMIN can reset passwords"); return; }
    const nextPassword = resetPassword(user.id, manualPassword || undefined);
    if (!nextPassword) { toast.error("Password reset failed"); return; }
    setManualPassword("");
    setTempPassword(nextPassword);
    toast.success("Password reset complete", { description: manualPassword ? "Manual password saved" : "Temporary password generated" });
  };

  const handleRevealPassword = () => {
    if (!isSAdmin) { toast.error("Password visibility is SADMIN-only"); return; }
    if (showPassword) { setShowPassword(false); setRevealedPassword(""); return; }
    const password = readPasswordFromStore(user.id);
    if (!password) { toast.error("Unable to reveal password"); return; }
    setRevealedPassword(password);
    setShowPassword(true);
  };

  return (
    <div className="space-y-[var(--space-section)]">
      <UserSummaryCard user={user} />
      <div className="grid gap-[var(--space-standard)] md:grid-cols-2">
        <div className="space-y-[var(--space-compact)]"><Label>Password</Label><div className="flex gap-2"><Input value={manualPassword} onChange={(e) => setManualPassword(e.target.value)} placeholder="Set manual password" /><Button onClick={handleResetPassword} className="bg-brand-primary hover:bg-brand-primary/90"><KeyRound className="w-4 h-4 mr-2"/> Reset</Button></div></div>
        <div className="space-y-[var(--space-compact)]">
          <Label>Reveal</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleRevealPassword} variant="outline" className="sm:w-12 sm:px-0">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Input
              readOnly
              value={showPassword ? revealedPassword : "Click reveal to show password"}
              className={cn("font-mono", !showPassword && "text-muted-foreground")}
            />
            {showPassword && (
              <Button onClick={() => navigator.clipboard.writeText(revealedPassword)} variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {tempPassword && (<div className="rounded-lg border border-dashed bg-white p-3 text-sm"><p className="font-medium mb-1">Latest generated password</p><p className="font-mono text-muted-foreground break-all">{tempPassword}</p></div>)}
    </div>
  );
}

function PermissionsTab({ user }: { user: User }) {
  const permissions = ROLE_PERMISSIONS[user.role] || [];

  console.log("PERMISSIONS RENDER", { userId: user.id, permissions: permissions.length });

  return (
    <div className="space-y-[var(--space-section)]">
      <UserSummaryCard user={user} />
      <div className="rounded-lg bg-[var(--bg-card)] p-[var(--space-standard)] shadow-sm">
      <div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-brand-primary"/><h3 className="font-medium">Role permissions</h3></div>
      <div className="flex flex-wrap gap-2">{permissions.length === 0 ? <span className="text-sm text-muted-foreground">No explicit permissions assigned.</span> : permissions.map((permission) => <Badge key={permission} variant="outline" className="bg-[var(--bg-muted-30)]">{permission}</Badge>)}</div>
      </div>
    </div>
  );
}

function ActivityTab({ user }: { user: User }) {
  const auditLogs = useAppStore((s) => s.auditLogs);
  const recentActivity = auditLogs.filter((log) => log.docType === "USER" && log.docId === user.id).slice(0, 8);
  const loginHistory = auditLogs.filter((log) => log.docType === "USER" && log.docId === user.id && (log.action === "LOGIN" || log.action === "FAILED_LOGIN")).slice(0, 8);

  console.log("ACTIVITY RENDER", { userId: user.id, recentActivity: recentActivity.length, loginHistory: loginHistory.length });

  return (
    <div className="space-y-[var(--space-section)]">
      <UserSummaryCard user={user} />
      <div className="rounded-lg bg-[var(--bg-card)] p-[var(--space-standard)] shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3"><div className="flex items-center gap-2"><Activity className="w-4 h-4 text-brand-primary"/><h3 className="font-medium">Recent audit logs</h3></div><span className="text-xs text-muted-foreground">Targeted to this user</span></div>
        <div className="space-y-2">{recentActivity.length === 0 ? <p className="text-sm text-muted-foreground">No audit activity found for this user.</p> : recentActivity.map((log) => <div key={log.id} className="rounded-lg bg-[var(--bg-muted-30)] p-[var(--space-compact)] text-sm shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{log.action}</p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</p></div><Badge variant="outline" className="bg-[var(--bg-card)]">{log.docType}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{log.comment||log.reason||log.fieldChanged||"—"}</p></div>)}</div>
      </div>
      <div className="rounded-lg bg-[var(--bg-card)] p-[var(--space-standard)] shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3"><div className="flex items-center gap-2"><Shield className="w-4 h-4 text-brand-primary"/><h3 className="font-medium">Login history</h3></div><span className="text-xs text-muted-foreground">Recent sign-in activity</span></div>
        <div className="space-y-2">{loginHistory.length === 0 ? <p className="text-sm text-muted-foreground">No login history found for this user.</p> : loginHistory.map((log) => <div key={log.id} className="rounded-lg bg-[var(--bg-muted-30)] p-[var(--space-compact)] text-sm shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{log.action}</p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</p></div><Badge variant="outline" className="bg-[var(--bg-card)]">{log.docType}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{log.comment||log.reason||log.fieldChanged||"—"}</p></div>)}</div>
      </div>
    </div>
  );
}

function AdminTab({ user, onOpenChange }: { user: User; onOpenChange: (open: boolean) => void }) {
  const suspendUser = useAppStore((s) => s.suspendUser);
  const activateUser = useAppStore((s) => s.activateUser);
  const lockUser = useAppStore((s) => s.lockUser);
  const unlockUser = useAppStore((s) => s.unlockUser);
  const deleteUser = useAppStore((s) => s.deleteUser);
  const archiveUser = useAppStore((s) => s.archiveUser);
  const forceLogoutUser = useAppStore((s) => s.forceLogoutUser);
  const impersonateUser = useAppStore((s) => s.impersonateUser);
  const clearFailedAttempts = useAppStore((s) => s.clearFailedAttempts);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  console.log("ADMIN RENDER", { userId: user.id, pendingAction: pendingAction?.kind || null });

  const openAction = (kind: NonNullable<PendingAction>["kind"]) => {
    switch (kind) {
      case "suspend": return setPendingAction({ kind, title: "Suspend user", description: `Suspend ${user.name}? The account will be blocked from login until reactivated.`, confirmLabel: "Suspend" });
      case "activate": return setPendingAction({ kind, title: "Activate user", description: `Activate ${user.name}? The account will be allowed to sign in again.`, confirmLabel: "Activate" });
      case "lock": return setPendingAction({ kind, title: "Lock account", description: `Lock ${user.name}? The account will require admin unlock.`, confirmLabel: "Lock" });
      case "unlock": return setPendingAction({ kind, title: "Unlock account", description: `Unlock ${user.name}? The account will be restored to Active.`, confirmLabel: "Unlock" });
      case "archive": return setPendingAction({ kind, title: "Archive user", description: `Archive ${user.name}? This keeps the record but removes the account from active use.`, confirmLabel: "Archive" });
      case "delete": return setPendingAction({ kind, title: "Archive and delete user", description: `Archive ${user.name}? In this demo, delete is a soft-delete archive action.`, confirmLabel: "Archive" });
      case "logout": return setPendingAction({ kind, title: "Force logout", description: `Force logout ${user.name}? Their current demo session will be terminated.`, confirmLabel: "Force logout" });
      case "impersonate": return setPendingAction({ kind, title: "Impersonate user", description: `Switch the current demo session to ${user.name}? This action is audit logged.`, confirmLabel: "Impersonate" });
      default: return setPendingAction(null);
    }
  };

  const runAction = () => {
    if (!pendingAction) return;
    const reason = user.statusReason || user.suspendedReason || "Admin action";
    if (pendingAction.kind === "suspend") { suspendUser(user.id, reason); toast.success("User suspended"); }
    else if (pendingAction.kind === "activate") { activateUser(user.id); toast.success("User activated"); }
    else if (pendingAction.kind === "lock") { lockUser(user.id, reason); toast.success("Account locked"); }
    else if (pendingAction.kind === "unlock") { unlockUser(user.id); clearFailedAttempts(user.id); toast.success("Account unlocked"); }
    else if (pendingAction.kind === "archive") { archiveUser(user.id, reason); toast.success("User archived"); }
    else if (pendingAction.kind === "delete") { deleteUser(user.id); toast.success("User archived", { description: "Soft delete recorded in the demo store." }); }
    else if (pendingAction.kind === "logout") { forceLogoutUser(user.id); toast.success("Force logout sent"); }
    else if (pendingAction.kind === "impersonate") { const ok = impersonateUser(user.id); if (ok) { toast.success("Impersonation started", { description: "Demo session switched to the selected user." }); onOpenChange(false); } else { toast.error("Impersonation failed"); } }
    setPendingAction(null);
  };

  return (
    <div className="space-y-[var(--space-section)]">
      <UserSummaryCard user={user} />
      <div className="rounded-lg bg-[var(--bg-card)] p-[var(--space-standard)] shadow-sm space-y-[var(--space-compact)]">
      <div className="flex items-center gap-2"><LockKeyhole className="w-4 h-4 text-brand-primary"/><h3 className="font-medium">Admin actions</h3></div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"><Button variant="outline" onClick={() => openAction("suspend")}><Ban className="w-4 h-4 mr-2"/> Suspend</Button><Button variant="outline" onClick={() => openAction("activate")}><BadgeCheck className="w-4 h-4 mr-2"/> Activate</Button><Button variant="outline" onClick={() => openAction("lock")}><LockKeyhole className="w-4 h-4 mr-2"/> Lock</Button><Button variant="outline" onClick={() => openAction("unlock")}><Unlock className="w-4 h-4 mr-2"/> Unlock</Button><Button variant="outline" onClick={() => openAction("logout")}><LogOut className="w-4 h-4 mr-2"/> Force logout</Button><Button variant="outline" onClick={() => openAction("impersonate")}><Fingerprint className="w-4 h-4 mr-2"/> Impersonate</Button></div>
      <div className="rounded-lg bg-[var(--bg-muted-30)] p-[var(--space-compact)]"><p className="text-sm font-medium">Danger zone</p><p className="text-xs text-muted-foreground mb-[var(--space-compact)]">Destructive actions are irreversible in production.</p><div className="flex gap-2"><Button variant="outline" onClick={() => openAction("archive")}><Archive className="w-4 h-4 mr-2"/> Archive</Button><Button variant="destructive" onClick={() => openAction("delete")}><Trash2 className="w-4 h-4 mr-2"/> Delete</Button></div></div>
      <div className="text-sm text-muted-foreground">Demo note: actions remain local-only and are audit logged for future backend parity.</div>
      <ConfirmActionDialog open={pendingAction !== null} onOpenChange={(value) => !value && setPendingAction(null)} title={pendingAction?.title || "Confirm action"} description={pendingAction?.description || "Confirm this action."} confirmLabel={pendingAction?.confirmLabel || "Confirm"} confirmVariant={pendingAction?.kind === "delete" ? "destructive" : "default"} onConfirm={runAction} />
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

type PendingAction =
  | { kind: "suspend"; title: string; description: string; confirmLabel: string }
  | { kind: "activate"; title: string; description: string; confirmLabel: string }
  | { kind: "lock"; title: string; description: string; confirmLabel: string }
  | { kind: "unlock"; title: string; description: string; confirmLabel: string }
  | { kind: "archive"; title: string; description: string; confirmLabel: string }
  | { kind: "delete"; title: string; description: string; confirmLabel: string }
  | { kind: "logout"; title: string; description: string; confirmLabel: string }
  | { kind: "impersonate"; title: string; description: string; confirmLabel: string }
  | null;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function UserDetailsDrawer({ open, onOpenChange, userId }: Props) {
  const users = useAppStore((state) => state.users);
  const user = useMemo(() => users.find((c) => c.id === userId) || null, [userId, users]);
  const stableUser = useMemo(() => {
    if (!user) return null;
    return { ...user };
  }, [user]);
  const [activeTab, setActiveTab] = useState<UserDrawerTab>("profile");

  console.log({ selectedUserId: userId, resolvedUser: stableUser?.id, activeTab });

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setActiveTab("profile");
    }
  };

  if (!stableUser) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-0">
        <UserDrawerContent key={stableUser.id} user={stableUser} onOpenChange={handleOpenChange} activeTab={activeTab} onActiveTabChange={setActiveTab} />
      </SheetContent>
    </Sheet>
  );
}
