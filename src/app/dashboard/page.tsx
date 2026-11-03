import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardView from "@/components/DashboardView";

async function Guard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return null;
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Suspense fallback={null}>
        <Guard />
      </Suspense>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daily Dashboard</h1>
        <Link href="/board" className="border rounded px-3 py-1 text-sm">
          ← Board
        </Link>
      </header>
      <DashboardView />
    </main>
  );
}