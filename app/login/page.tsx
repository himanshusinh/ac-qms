"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { QUICK_LOGIN_ACCOUNTS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { FlaskConical, Shield, Microscope, ClipboardCheck, Search, BadgeCheck } from "lucide-react";
import type { Role } from "@/types";

const roleIcons: Record<string, React.ReactNode> = {
  SADMIN: <Shield className="w-5 h-5" />,
  QC_EXEC: <Microscope className="w-5 h-5" />,
  QC_MGR: <ClipboardCheck className="w-5 h-5" />,
  QA_EXEC: <Search className="w-5 h-5" />,
  QA_MGR: <BadgeCheck className="w-5 h-5" />,
};

function getRouteForRole(role: Role): string {
  switch (role) {
    case "SADMIN":
      return "/admin/dashboard";
    case "QC_EXEC":
    case "QC_MGR":
      return "/qc/dashboard";
    case "QA_EXEC":
    case "QA_MGR":
      return "/qa/dashboard";
    default:
      return "/login";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (user: string, pass: string) => {
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      const loggedInUser = login(user, pass);
      if (loggedInUser) {
        toast.success(`Welcome back, ${loggedInUser.name}`, {
          description: `Logged in as ${loggedInUser.role.replace("_", " ")}`,
        });
        router.push(getRouteForRole(loggedInUser.role));
      } else {
        setError("Invalid username or password");
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(username, password);
  };

  const handleQuickLogin = (account: (typeof QUICK_LOGIN_ACCOUNTS)[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    handleLogin(account.username, account.password);
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Brand Panel ─── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D4F5C 0%, #1A8FA3 60%, #0D4F5C 100%)" }}
      >
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-20 left-20 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute top-40 right-16 w-24 h-24 border-2 border-white rounded-full" />
          <div className="absolute bottom-32 left-32 w-32 h-32 border-2 border-white rounded-full" />
          <div className="absolute bottom-16 right-28 w-20 h-20 border border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white rounded-full" />
        </div>

        <div className="relative z-10 text-center text-white max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <FlaskConical className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">AC-QMS</h1>
          <p className="text-lg text-white/80 mb-1">Aditya Chemicals</p>
          <p className="text-sm text-white/60 mb-8">Quality Management System</p>

          <div className="w-16 h-0.5 bg-[#E8732C] mx-auto mb-8" />

          <p className="text-white/70 text-sm leading-relaxed">
            Digital LIMS for pharmaceutical batch quality release through a sequential 4-document approval chain.
          </p>

          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-white/50">
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold text-white/80">SPEC</span>
              <span>Specification</span>
            </div>
            <span className="text-white/30">→</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold text-white/80">MOA</span>
              <span>Method</span>
            </div>
            <span className="text-white/30">→</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold text-white/80">AWS</span>
              <span>Worksheet</span>
            </div>
            <span className="text-white/30">→</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold text-white/80">COA</span>
              <span>Certificate</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Login Form ─── */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-brand-subtle">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FlaskConical className="w-7 h-7 text-brand-primary" />
              <h1 className="text-2xl font-bold text-brand-primary">AC-QMS</h1>
            </div>
            <p className="text-sm text-muted-foreground">Aditya Chemicals Quality Management</p>
          </div>

          {/* Login card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-brand-primary hover:bg-brand-primary/90"
                  disabled={isLoading || !username || !password}
                >
                  {isLoading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Login Cards */}
          <div className="mt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Quick Login — Demo Accounts
            </p>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_LOGIN_ACCOUNTS.map((account) => (
                <button
                  key={account.username}
                  onClick={() => handleQuickLogin(account)}
                  disabled={isLoading}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 hover:border-brand-accent/40 transition-all text-left group disabled:opacity-50 cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: account.color }}
                  >
                    {roleIcons[account.role]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{account.name}</span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${account.color}15`,
                          color: account.color,
                        }}
                      >
                        {account.label}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {account.username} · {account.dept}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to login →
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            AC-QMS Prototype · Aditya Chemicals · FY 2026–27
          </p>
        </div>
      </div>
    </div>
  );
}
