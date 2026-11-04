import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
        Smart Tracker
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600">
        Apnar task gulo organize korun, Kanban board-e track korun, ar kon
        kaje koto somoy dilen dashboard-e dekhun.
      </p>

      <ul className="mt-6 space-y-1 text-zinc-700">
        <li>✅ Task toiri ar manage</li>
        <li>📋 Kanban board</li>
        <li>⏱️ Time log ar dashboard</li>
      </ul>

      <div className="mt-8 flex gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-black px-6 py-3 font-medium text-white"
        >
          Get Started (Register)
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-900"
        >
          Login
        </Link>
      </div>
    </main>
  );
}