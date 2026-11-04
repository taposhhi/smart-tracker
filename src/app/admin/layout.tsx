import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";
import ThemeToggle from "@/components/ThemeToggle";

async function Guard({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/board");

  const btn =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-900 dark:hover:bg-neutral-800";

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold leading-tight">Admin panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as {admin.name ?? "Admin"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/board" className={btn}>
            My board
          </Link>
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className={btn}>Logout</button>
          </form>
        </div>
      </header>
      <AdminNav />
      {children}
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-black dark:text-gray-100">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
          <Guard>{children}</Guard>
        </Suspense>
      </div>
    </main>
  );
}