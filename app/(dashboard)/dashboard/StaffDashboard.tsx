import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Send, CheckCircle2, Target } from "lucide-react";
import { DashboardCharts } from "./DashboardCharts";

interface StaffDashboardProps {
  session: {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
    };
  };
}

export async function StaffDashboard({ session }: StaffDashboardProps) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalContacts,
    totalBlastsThisMonth,
    totalTargets,
    successTargets,
    recentBlasts,
  ] = await Promise.all([
    prisma.contact.count({ where: { createdById: session.user.id } }),
    prisma.blast.count({
      where: { createdById: session.user.id, createdAt: { gte: startOfMonth } },
    }),
    prisma.blastTarget.count({ where: { blast: { createdById: session.user.id } } }),
    prisma.blastTarget.count({
      where: { blast: { createdById: session.user.id }, status: { in: ["sent", "read"] } },
    }),
    prisma.blast.findMany({
      where: { createdById: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { targets: true } } },
    }),
  ]);

  const successRate = totalTargets > 0
    ? Math.round((successTargets / totalTargets) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Selamat datang, {session.user.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Kontak Saya</CardTitle>
            <Users className="h-4 w-4 text-whatsapp" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{totalContacts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Blast Saya Bulan Ini</CardTitle>
            <Send className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{totalBlastsThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Tingkat Keberhasilan</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{successRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Terkirim</CardTitle>
            <Target className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{successTargets}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Grafik Performa</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardCharts />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Blast Terbaru Saya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBlasts.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">Belum ada blast</p>
              ) : (
                recentBlasts.map((blast) => (
                  <div key={blast.id} className="flex items-center justify-between rounded-lg border border-slate-800 p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{blast.title}</p>
                      <p className="text-xs text-slate-500">{blast._count.targets} target</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      blast.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                      blast.status === "failed" ? "bg-red-500/10 text-red-400" :
                      blast.status === "sending" ? "bg-blue-500/10 text-blue-400" :
                      "bg-slate-500/10 text-slate-400"
                    }`}>{blast.status}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
