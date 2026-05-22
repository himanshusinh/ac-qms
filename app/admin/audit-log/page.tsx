"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Search, ScrollText, Filter, CalendarClock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDateTime } from "@/lib/utils";
import type { ActionType, DocumentType } from "@/types";

const ACTION_OPTIONS: Array<ActionType | "ALL"> = [
  "ALL",
  "LOGIN",
  "LOGOUT",
  "CREATE",
  "UPDATE",
  "EDIT_USER",
  "VIEW_PASSWORD",
  "RESET_PASSWORD",
  "SUSPEND_USER",
  "ACTIVATE_USER",
  "LOCK_USER",
  "UNLOCK_USER",
  "ARCHIVE_USER",
  "DELETE_USER",
  "BULK_UPDATE_USERS",
  "FAILED_LOGIN",
  "CLEAR_FAILED_ATTEMPTS",
  "CHANGE_ROLE",
  "CHANGE_DEPARTMENT",
  "SUBMIT",
  "QC_APPROVE",
  "QA_SIGN",
  "REJECT",
  "AUTO_GENERATE",
  "ISSUE",
  "SAVE_DRAFT",
  "MARK_COMPLETE",
];

const DOC_TYPES: Array<DocumentType | "ALL"> = ["ALL", "USER", "BATCH", "SPEC", "MOA", "AWS", "COA", "INSTRUMENT", "REAGENT"];

type AuditRow = {
  timestamp: string;
  userName: string;
  targetUserName?: string;
  docRef?: string;
  docId: string;
  action: ActionType;
  docType: DocumentType;
  fieldChanged?: string;
  prevValue?: string;
  newValue?: string;
  reason?: string;
  comment?: string;
};

function exportAuditCsv(rows: AuditRow[]): void {
  const header = ["Timestamp", "Actor", "Target", "Action", "Doc Type", "Doc Ref", "Field", "Before", "After", "Reason"];
  const csv = [header, ...rows.map((row) => [row.timestamp, row.userName, row.targetUserName || row.docRef || row.docId, row.action, row.docType, row.docRef || "", row.fieldChanged || "", row.prevValue || "", row.newValue || "", row.reason || row.comment || ""])]
    .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ac-qms-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const auditLogs = useAppStore((state) => state.auditLogs);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionType | "ALL">("ALL");
  const [docTypeFilter, setDocTypeFilter] = useState<DocumentType | "ALL">("ALL");
  const [userFilter, setUserFilter] = useState("");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SADMIN") router.push("/login");
  }, [currentUser, router]);

  const auditRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return auditLogs.filter((log) => {
      const matchesSearch =
        !query ||
        log.userName.toLowerCase().includes(query) ||
        (log.targetUserName || "").toLowerCase().includes(query) ||
        (log.docRef || "").toLowerCase().includes(query) ||
        (log.comment || "").toLowerCase().includes(query) ||
        (log.reason || "").toLowerCase().includes(query);
      const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
      const matchesDocType = docTypeFilter === "ALL" || log.docType === docTypeFilter;
      const matchesUser = !userFilter || log.userName.toLowerCase().includes(userFilter.toLowerCase());
      return matchesSearch && matchesAction && matchesDocType && matchesUser;
    });
  }, [actionFilter, auditLogs, docTypeFilter, search, userFilter]);

  if (!currentUser) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ScrollText className="w-4 h-4 text-brand-primary" />
            System audit history
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Audit Log</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Track user governance, password events, status changes, and workflow operations across the AC-QMS demo store.
          </p>
        </div>
        <Button variant="outline" onClick={() => {
          exportAuditCsv(auditRows);
          toast.success("Audit CSV export generated");
        }}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Events</p>
              <p className="mt-2 text-3xl font-semibold">{auditLogs.length}</p>
            </div>
            <ScrollText className="w-8 h-8 text-brand-primary" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin actions</p>
              <p className="mt-2 text-3xl font-semibold">{auditLogs.filter((log) => log.docType === "USER").length}</p>
            </div>
            <Filter className="w-8 h-8 text-amber-600" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Password events</p>
              <p className="mt-2 text-3xl font-semibold">{auditLogs.filter((log) => log.action === "VIEW_PASSWORD" || log.action === "RESET_PASSWORD").length}</p>
            </div>
            <CalendarClock className="w-8 h-8 text-violet-600" />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Failed logins</p>
              <p className="mt-2 text-3xl font-semibold">{auditLogs.filter((log) => log.action === "FAILED_LOGIN").length}</p>
            </div>
            <Search className="w-8 h-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="User, target, reference, reason" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as ActionType | "ALL") }>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((action) => (
                    <SelectItem key={action} value={action}>{action === "ALL" ? "All actions" : action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document type</Label>
              <Select value={docTypeFilter} onValueChange={(value) => setDocTypeFilter(value as DocumentType | "ALL") }>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((docType) => (
                    <SelectItem key={docType} value={docType}>{docType === "ALL" ? "All document types" : docType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="max-w-md space-y-2">
            <Label>Actor filter</Label>
            <Input placeholder="Actor username or name" value={userFilter} onChange={(event) => setUserFilter(event.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {auditRows.length === 0 ? (
            <EmptyState
              title="No audit events found"
              description="Adjust filters or search terms to reveal matching activity."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-white">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Doc type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Before</TableHead>
                    <TableHead>After</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditRows.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(log.timestamp)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{log.userName}</p>
                          <p className="text-xs text-muted-foreground">{log.role} · {log.department}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{log.targetUserName || log.docRef || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-white">{log.action}</Badge></TableCell>
                      <TableCell className="text-xs">{log.docType}</TableCell>
                      <TableCell className="font-mono text-xs">{log.docRef || log.docId}</TableCell>
                      <TableCell className="text-xs">{log.fieldChanged || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[10rem] truncate">{log.prevValue || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[10rem] truncate">{log.newValue || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[14rem]">{log.reason || log.comment || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
