import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Pengaturan</h1>
        <p className="mt-1 text-sm text-slate-400">
          Kelola profil dan pengaturan akun Anda
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">Nama</p>
              <p className="font-medium text-white">{session.user.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <p className="font-medium text-white">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Role</p>
              <p className="font-medium capitalize text-white">
                {session.user.role}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubah Password</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
