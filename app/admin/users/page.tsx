"use client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function UsersListPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || currentUser.role !== "SADMIN") router.push("/login");
  }, [currentUser, router]);
  if (!currentUser) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button className="bg-brand-primary hover:bg-brand-primary/90" onClick={() => router.push("/admin/users/new")}>
          <Plus className="w-4 h-4 mr-2" /> Add New User
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left py-2 px-3 font-medium">Name</th>
              <th className="text-left py-2 px-3 font-medium">Username</th>
              <th className="text-left py-2 px-3 font-medium">Role</th>
              <th className="text-left py-2 px-3 font-medium">Department</th>
              <th className="text-left py-2 px-3 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2.5 px-3 font-medium">{u.name}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{u.username}</td>
                  <td className="py-2.5 px-3"><Badge variant="outline" className="text-xs">{u.role.replace("_"," ")}</Badge></td>
                  <td className="py-2.5 px-3">{u.department}</td>
                  <td className="py-2.5 px-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{u.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
