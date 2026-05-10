import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  const params = await searchParams;
  const error = params.error;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">RP Motors · Acceso Admin</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-600">Solo personal autorizado.</p>

        {error === "credenciales" ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Usuario o contraseña incorrectos.</p>
        ) : null}

        {error === "bloqueado" ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Demasiados intentos fallidos. Esperá unos minutos e intentá nuevamente.
          </p>
        ) : null}

        <form action="/api/admin/login" method="post" className="mt-5 grid gap-3">
          <input
            name="username"
            required
            placeholder="Usuario"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Contraseña"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
