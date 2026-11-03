import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import KanbanBoard from "@/components/KanbanBoard";
import ThemeToggle from "@/components/ThemeToggle";

async function BoardContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const name = session.user.name ?? "User";
  const initial = name.charAt(0).toUpperCase();

  return (
    <>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-lg font-semibold text-white dark:bg-white dark:text-black">
            {initial}
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">My Tasks</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {name}
              <span className="ml-2 rounded-full border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300">
                {session.user.role}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            Dashboard
          </Link>
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
              Logout
            </button>
          </form>
        </div>
      </header>
      <KanbanBoard />
    </>
  );
}

export default function BoardPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-black dark:text-gray-100">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
          <BoardContent />
        </Suspense>
      </div>
    </main>
  );
}