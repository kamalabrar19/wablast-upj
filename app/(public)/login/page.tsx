import { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Masuk ke dashboard WA Blast UPJ",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">Sign In</h1>
            <p className="mt-2 text-sm text-slate-400">
              Masuk ke dashboard WA Blast UPJ
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
