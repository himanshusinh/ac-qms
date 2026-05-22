"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { cn, fmtDate } from "@/lib/utils";
import type { Department, Role, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { UserDetailsDrawer } from "@/components/users/UserDetailsDrawer";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";
import { Plus, Search, SlidersHorizontal, ChevronUp, ChevronDown, MoreHorizontal, Users, Download, ShieldAlert, UserCog, Eye, LockKeyhole, Unlock, Trash2, Archive, Power, RotateCcw, Ban, LogOut } from "lucide-react";
import { ROLE_PERMISSIONS, USER_STATUSES } from "@/lib/adminSecurity";

const PAGE_SIZE = 5;

type SortKey = "name" | "lastLogin" | "role" | "createdAt";
type FilterStatus = "ALL" | User["status"];
type FilterRole = "ALL" | Role;
type FilterDepartment = "ALL" | Department;

type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function compareDates(a?: string | null, b?: string | null): number {
  const left = a ? new Date(a).getTime() : 0;
  const right = b ? new Date(b).getTime() : 0;
  return left - right;
}

function exportUsersCsv(users: User[]): void {
  const header = [
    "Name",
    "Username",
    "Role",
    "Department",
    "Status",
    "Last Login",
    "Created Date",
    "Failed Attempts",
    "Locked At",
    "Suspended At",
  ];

  const rows = users.map((user) => [
    user.name,
    user.username,
    user.role,
    user.department,
    user.status,
    user.lastLogin || "",
    user.createdAt || "",
    String(user.failedLoginAttempts || 0),
    user.lockedAt || "",
    user.suspendedAt || "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ac-qms-users-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function roleLabel(role: Role): string {
  return role.replace("_", " ");
}

export default function UsersListPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const users = useAppStore((state) => state.users);
  const suspendUser = useAppStore((state) => state.suspendUser);
  const activateUser = useAppStore((state) => state.activateUser);
  const lockUser = useAppStore((state) => state.lockUser);
  const unlockUser = useAppStore((state) => state.unlockUser);
  const resetPassword = useAppStore((state) => state.resetPassword);
  const archiveUser = useAppStore((state) => state.archiveUser);
  const deleteUser = useAppStore((state) => state.deleteUser);
  const bulkUpdateUsers = useAppStore((state) => state.bulkUpdateUsers);
  const generateTempPassword = useAppStore((state) => state.generateTemporaryPassword);

  const isHydrated = true;
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<FilterDepartment>("ALL");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<ConfirmAction | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SADMIN") router.push("/login");
  }, [currentUser, router]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const nextUsers = users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.employeeId || "").toLowerCase().includes(query);
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesDepartment = departmentFilter === "ALL" || user.department === departmentFilter;
      const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });

    nextUsers.sort((left, right) => {
      let comparison = 0;
      if (sortKey === "name") comparison = left.name.localeCompare(right.name);
      if (sortKey === "role") comparison = left.role.localeCompare(right.role);
      if (sortKey === "lastLogin") comparison = compareDates(left.lastLogin, right.lastLogin);
      if (sortKey === "createdAt") comparison = compareDates(left.createdAt, right.createdAt);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return nextUsers;
  }, [departmentFilter, roleFilter, search, sortDirection, sortKey, statusFilter, users]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
  const selectedCount = selectedUsers.length;

  const allVisibleSelected = paginatedUsers.length > 0 && paginatedUsers.every((user) => selectedIds.includes(user.id));
  const someVisibleSelected = paginatedUsers.some((user) => selectedIds.includes(user.id)) && !allVisibleSelected;

  const visibleRoleCounts = useMemo(() => {
    return users.reduce<Record<Role, number>>((accumulator, user) => {
      accumulator[user.role] = (accumulator[user.role] || 0) + 1;
      return accumulator;
    }, { SADMIN: 0, QC_EXEC: 0, QC_MGR: 0, QA_EXEC: 0, QA_MGR: 0 });
  }, [users]);

  const visibleStatusCounts = useMemo(() => {
    return users.reduce<Record<string, number>>((accumulator, user) => {
      accumulator[user.status] = (accumulator[user.status] || 0) + 1;
      return accumulator;
    }, {});
  }, [users]);

  const openConfirm = (payload: ConfirmAction) => setPendingAction(payload);
  const closeConfirm = () => setPendingAction(null);

  const runBulkUpdate = (patch: Partial<User>, action: Parameters<typeof bulkUpdateUsers>[2], description: string) => {
    if (!selectedIds.length) return;
    bulkUpdateUsers(selectedIds, patch, action, description);
    toast.success(description, { description: `${selectedIds.length} users updated.` });
    setSelectedIds([]);
  };

  const handleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      const nextSelection = Array.from(new Set([...selectedIds, ...paginatedUsers.map((user) => user.id)]));
      setSelectedIds(nextSelection);
      return;
    }
    setSelectedIds(selectedIds.filter((id) => !paginatedUsers.some((user) => user.id === id)));
  };

  const handleToggleSelection = (userId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? Array.from(new Set([...current, userId])) : current.filter((id) => id !== userId)
    );
  };

  const visibleColumnHeader = (
    <TableHead className="w-10">
      <Checkbox checked={allVisibleSelected} onCheckedChange={(value) => handleSelectAllVisible(Boolean(value))} />
    </TableHead>
  );

  if (!currentUser || currentUser.role !== "SADMIN") return null;

  if (!isHydrated) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl border bg-white animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-xl border bg-white animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ShieldAlert className="w-4 h-4 text-brand-primary" />
            Super Admin Control Center
          </div>
          <h1 className="font-semibold tracking-tight" style={{ fontSize: "var(--type-page-title-size)" }}>User Governance</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Search, inspect, and control every user account from one enterprise view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/audit-log")}>View audit log</Button>
          <Button className="bg-brand-primary hover:bg-brand-primary/90" onClick={() => router.push("/admin/users/new")}>
            <Plus className="w-4 h-4 mr-2" /> Add user
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total users</p>
              <p className="mt-2 text-3xl font-semibold">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-brand-primary" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">{users.filter((user) => user.status === "Active").length}</p>
            </div>
            <Power className="w-8 h-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Suspended / Locked</p>
              <p className="mt-2 text-3xl font-semibold text-amber-600">
                {users.filter((user) => user.status === "Suspended" || user.status === "Locked").length}
              </p>
            </div>
            <LockKeyhole className="w-8 h-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin coverage</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {Object.keys(ROLE_PERMISSIONS).length}
              </p>
            </div>
            <UserCog className="w-8 h-8 text-slate-500" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle className="text-lg">Filters and sorting</CardTitle>
              <p className="text-sm text-muted-foreground">Use search, filters, and sorts to isolate the account set you want to manage.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="w-4 h-4" /> {totalUsers} result{totalUsers === 1 ? "" : "s"}
            </div>
          </div>

          <div className="grid gap-[var(--space-standard)] lg:grid-cols-5">
            <div className="space-y-[var(--space-compact)] lg:col-span-2">
              <Label htmlFor="user-search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="user-search"
                  className="pl-9 h-[var(--button-h-default)]"
                  placeholder="Name, username, email, employee ID"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-[var(--space-compact)]">
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as FilterRole)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  <SelectItem value="SADMIN">Super Admin</SelectItem>
                  <SelectItem value="QC_EXEC">QC Executive</SelectItem>
                  <SelectItem value="QC_MGR">QC Manager</SelectItem>
                  <SelectItem value="QA_EXEC">QA Executive</SelectItem>
                  <SelectItem value="QA_MGR">QA Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value as FilterDepartment)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All departments</SelectItem>
                  <SelectItem value="QC">QC</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {USER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-[var(--space-standard)] md:grid-cols-4">
            <div className="space-y-[var(--space-compact)]">
              <Label>Sort by</Label>
              <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="lastLogin">Last login</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="createdAt">Created date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-[var(--space-compact)]">
              <Label>Order</Label>
              <Button variant="outline" className="w-full justify-between" onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}>
                {sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {sortDirection === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>
            <div className="space-y-[var(--space-compact)]">
              <Label>Quick visibility</Label>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-white">{visibleRoleCounts.SADMIN} SADMIN</Badge>
                <Badge variant="outline" className="bg-white">{visibleStatusCounts.Active || 0} active</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Selected</Label>
              <div className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
                <span>{selectedCount} users</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} disabled={!selectedIds.length}>Clear</Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {selectedIds.length > 0 && (
            <div className="flex flex-col gap-[var(--space-compact)] rounded-lg bg-[var(--bg-muted-30)] p-[var(--space-standard)] lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-medium">{selectedIds.length} user{selectedIds.length === 1 ? "" : "s"} selected</p>
                <p className="text-sm text-muted-foreground">Bulk operations will apply to the selected records only.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => openConfirm({
                  title: "Suspend selected users",
                  description: `Suspend ${selectedIds.length} selected user${selectedIds.length === 1 ? "" : "s"}?`,
                  confirmLabel: "Suspend",
                  confirmVariant: "destructive",
                  onConfirm: () => runBulkUpdate({ status: "Suspended", suspendedAt: new Date().toISOString(), statusReason: "Bulk suspended" }, "BULK_UPDATE_USERS", "Selected users suspended"),
                })}>
                  <Ban className="w-4 h-4 mr-2" /> Suspend
                </Button>
                <Button variant="outline" onClick={() => openConfirm({
                  title: "Activate selected users",
                  description: `Activate ${selectedIds.length} selected user${selectedIds.length === 1 ? "" : "s"}?`,
                  confirmLabel: "Activate",
                  onConfirm: () => runBulkUpdate({ status: "Active", suspendedAt: null, lockedAt: null, failedLoginAttempts: 0 }, "BULK_UPDATE_USERS", "Selected users activated"),
                })}>
                  <Power className="w-4 h-4 mr-2" /> Activate
                </Button>
                <Button variant="outline" onClick={() => openConfirm({
                  title: "Archive selected users",
                  description: `Archive ${selectedIds.length} selected user${selectedIds.length === 1 ? "" : "s"}?`,
                  confirmLabel: "Archive",
                  onConfirm: () => runBulkUpdate({ status: "Archived", archivedAt: new Date().toISOString(), statusReason: "Bulk archived" }, "ARCHIVE_USER", "Selected users archived"),
                })}>
                  <Archive className="w-4 h-4 mr-2" /> Archive
                </Button>
                <Button variant="outline" onClick={() => openConfirm({
                  title: "Reset passwords",
                  description: `Reset passwords for ${selectedIds.length} selected user${selectedIds.length === 1 ? "" : "s"}?`,
                  confirmLabel: "Reset",
                  onConfirm: () => {
                    selectedIds.forEach((id) => resetPassword(id, generateTempPassword()));
                    toast.success("Passwords reset", { description: `${selectedIds.length} users received temporary passwords.` });
                    setSelectedIds([]);
                  },
                })}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset passwords
                </Button>
                <Button variant="outline" onClick={() => openConfirm({
                  title: "Force logout selected users",
                  description: `Terminate sessions for ${selectedIds.length} selected user${selectedIds.length === 1 ? "" : "s"}?`,
                  confirmLabel: "Logout",
                  onConfirm: () => {
                    selectedIds.forEach((id) => toast.success("Force logout issued", { description: `User ${id} will be terminated in the demo store.` }));
                    setSelectedIds([]);
                  },
                })}>
                  <LogOut className="w-4 h-4 mr-2" /> Force logout
                </Button>
                <Button variant="outline" onClick={() => exportUsersCsv(selectedUsers)}>
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg bg-[var(--bg-card)] shadow-sm">
            <Table>
              <TableHeader className="sticky top-0 bg-[var(--bg-card)] z-10">
                <TableRow>
                  {visibleColumnHeader}
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead>Created date</TableHead>
                  <TableHead>Account state</TableHead>
                  <TableHead>Failed attempts</TableHead>
                  <TableHead className="sticky right-0 bg-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="p-0">
                      <EmptyState
                        title="No users found"
                        description="Adjust the filters or search terms to reveal matching accounts."
                        action={{
                          label: "Reset filters",
                          onClick: () => {
                            setSearch("");
                            setRoleFilter("ALL");
                            setDepartmentFilter("ALL");
                            setStatusFilter("ALL");
                          },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => {
                    const rowSelected = selectedIds.includes(user.id);
                    const accountState = user.deletedAt
                      ? "Deleted"
                      : user.archivedAt
                        ? "Archived"
                        : user.lockedAt
                          ? "Locked"
                          : user.suspendedAt
                            ? "Suspended"
                            : "Available";

                    return (
                      <TableRow
                        key={user.id}
                        data-state={rowSelected ? "selected" : undefined}
                        className={cn("cursor-pointer", rowSelected && "bg-slate-50")}
                        onClick={() => setDrawerUserId(user.id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={rowSelected}
                            onCheckedChange={(value) => handleToggleSelection(user.id, Boolean(value))}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar size="sm" className="bg-brand-primary/10">
                              <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs font-semibold">{initials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <button className="font-medium text-left hover:text-brand-primary" onClick={(event) => { event.stopPropagation(); setDrawerUserId(user.id); }}>
                                {user.name}
                              </button>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-white">{roleLabel(user.role)}</Badge>
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell><UserStatusBadge status={user.status} /></TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p>{user.lastLogin ? fmtDate(user.lastLogin) : "Never"}</p>
                            <p className="text-xs text-muted-foreground">{user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : "No login yet"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{fmtDate(user.createdAt || user.lastLogin || new Date().toISOString())}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50">{accountState}</Badge>
                        </TableCell>
                        <TableCell>{user.failedLoginAttempts || 0}</TableCell>
                        <TableCell className="sticky right-0 bg-white text-right shadow-[-12px_0_18px_-18px_rgba(0,0,0,0.25)]">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" onClick={(event) => event.stopPropagation()}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56" onClick={(event) => event.stopPropagation()}>
                              <DropdownMenuItem onSelect={() => setDrawerUserId(user.id)}>
                                <Eye className="w-4 h-4 mr-2" /> View details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => openConfirm({
                                title: "Suspend user",
                                description: `Suspend ${user.name}?`,
                                confirmLabel: "Suspend",
                                confirmVariant: "destructive",
                                onConfirm: () => suspendUser(user.id, "Suspended from quick actions"),
                              })}>
                                <Ban className="w-4 h-4 mr-2" /> Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openConfirm({
                                title: "Activate user",
                                description: `Activate ${user.name}?`,
                                confirmLabel: "Activate",
                                onConfirm: () => activateUser(user.id),
                              })}>
                                <Power className="w-4 h-4 mr-2" /> Activate
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openConfirm({
                                title: "Lock account",
                                description: `Lock ${user.name}?`,
                                confirmLabel: "Lock",
                                onConfirm: () => lockUser(user.id, "Locked from quick actions"),
                              })}>
                                <LockKeyhole className="w-4 h-4 mr-2" /> Lock
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openConfirm({
                                title: "Unlock account",
                                description: `Unlock ${user.name}?`,
                                confirmLabel: "Unlock",
                                onConfirm: () => unlockUser(user.id),
                              })}>
                                <Unlock className="w-4 h-4 mr-2" /> Unlock
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openConfirm({
                                title: "Reset password",
                                description: `Reset password for ${user.name}? A temporary password will be generated.`,
                                confirmLabel: "Reset",
                                onConfirm: () => {
                                  const temp = resetPassword(user.id, generateTempPassword());
                                  toast.success("Password reset", { description: temp ? `Temporary password generated for ${user.username}.` : "Reset failed." });
                                },
                              })}>
                                <RotateCcw className="w-4 h-4 mr-2" /> Reset password
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openConfirm({
                                title: "Archive user",
                                description: `Archive ${user.name}?`,
                                confirmLabel: "Archive",
                                onConfirm: () => archiveUser(user.id, "Archived from quick actions"),
                              })}>
                                <Archive className="w-4 h-4 mr-2" /> Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onSelect={() => openConfirm({
                                title: "Archive and delete user",
                                description: `Soft delete ${user.name}?`,
                                confirmLabel: "Archive",
                                confirmVariant: "destructive",
                                onConfirm: () => deleteUser(user.id),
                              })}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, totalUsers)} of {totalUsers} filtered user{totalUsers === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>
                Previous
              </Button>
              <Badge variant="outline" className="bg-white px-3 py-1">Page {currentPage} of {totalPages}</Badge>
              <Button variant="outline" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserDetailsDrawer key={drawerUserId || "closed"} open={drawerUserId !== null} onOpenChange={(value) => !value && setDrawerUserId(null)} userId={drawerUserId} />

      <ConfirmActionDialog
        open={pendingAction !== null}
        onOpenChange={(value) => !value && closeConfirm()}
        title={pendingAction?.title || "Confirm action"}
        description={pendingAction?.description || "Confirm this action."}
        confirmLabel={pendingAction?.confirmLabel || "Confirm"}
        confirmVariant={pendingAction?.confirmVariant || "default"}
        onConfirm={() => {
          pendingAction?.onConfirm();
          closeConfirm();
        }}
      />
    </div>
  );
}
