import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loginAction } from "@/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSession();
  if (user) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            S
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Sistema de Stock
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ingresá para administrar tu inventario
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          action={loginAction}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              autoFocus
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-2 focus:outline-indigo-600"
              placeholder="admin@stock.local"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-2 focus:outline-indigo-600"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Ingresar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Demo: admin@stock.local / Admin123!
        </p>
      </div>
    </div>
  );
}
