import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <img
          src="/logo-face-color.png"
          alt="Facultad de Ciencias Económicas — UNT"
          className="mx-auto mb-3 h-16 w-auto object-contain"
        />
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Sin conexión
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          No pudimos cargar esta página. Revisá tu conexión a internet e
          intentá de nuevo.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Reintentar
        </Link>
      </div>
    </div>
  );
}
