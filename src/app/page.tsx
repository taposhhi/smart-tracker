import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
        Smart Tracker
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600">
        Organize your tasks, track progress on a Kanban board, and see how
        much time you spend on each task in your dashboard.
      </p>

      <ul className="mt-6 space-y-1 text-zinc-700">
        <li>✅ Create and manage tasks</li>
        <li>📋 Kanban board</li>
        <li>⏱️ Time logs and dashboard</li>
      </ul>

      <div className="mt-8 flex gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-black px-6 py-3 font-medium text-white"
        >
          Get Started
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