"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PasswordConfirmModal } from "@/components/shared/PasswordConfirmModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateId, now } from "@/lib/utils";
import type { Role, Department } from "@/types";

export default function AddUserPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const addUser = useAppStore((s) => s.addUser);
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("QC_EXEC");
  const [dept, setDept] = useState<Department>("QC");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SADMIN") router.push("/login");
  }, [currentUser, router]);

  const usernameExists = users.some((u) => u.username === username);
  const valid = name && username && email && !usernameExists;

  const handleCreate = () => {
    addUser({ id: generateId(), name, username, email, role, department: dept, status: "Active", lastLogin: null, password: "password123" });
    toast.success(`User "${name}" created successfully`);
    router.push("/admin/users");
  };

  if (!currentUser) return null;
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New User</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" /></div>
          <div className="space-y-2"><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
            {usernameExists && <p className="text-xs text-red-600">Username already exists</p>}
          </div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@adityachem.com" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="QC_EXEC">QC Executive</SelectItem>
                  <SelectItem value="QC_MGR">QC Manager</SelectItem>
                  <SelectItem value="QA_EXEC">QA Executive</SelectItem>
                  <SelectItem value="QA_MGR">QA Manager</SelectItem>
                  <SelectItem value="SADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Department</Label>
              <Select value={dept} onValueChange={(v) => setDept(v as Department)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="QC">QC</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-md bg-muted p-3 text-sm"><span className="font-medium">Generated Password:</span> <code>password123</code></div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => router.push("/admin/users")}>Cancel</Button>
            <Button className="bg-brand-primary hover:bg-brand-primary/90" disabled={!valid} onClick={() => setShowConfirm(true)}>Create User</Button>
          </div>
        </CardContent>
      </Card>
      <PasswordConfirmModal open={showConfirm} onOpenChange={setShowConfirm} title="Confirm User Creation" description={`Create user "${name}" with role ${role.replace("_"," ")}`} confirmLabel="Create" onConfirm={handleCreate} />
    </div>
  );
}
