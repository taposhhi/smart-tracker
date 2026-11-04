"use client";

import { useCallback, useEffect, useState } from "react";

type U = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  taskCount: number;
  secondsToday: number;
  running: boolean;
  isMe: boolean;
};

function fmt(total: number) {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<U[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch(`/api/admin/users?tz=${encodeURIComponent(tz)}`);
    if (!res.ok) {
      setError("Could not load users.");
      return;
    }
    setUsers(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(u: U) {
    const next = u.role === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Change ${u.name ?? u.email} to ${next}?`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    const data = await res.json().catch(() => ({}));
    setError(res.ok ? "" : data.error ?? "Something went wrong.");
    load();
  }

  async function remove(u: U) {
    if (!confirm(`Delete ${u.name ?? u.email}? All their tasks and time logs will be deleted too.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setError(res.ok ? "" : data.error ?? "Something went wrong.");
    load();
  }

  if (!users) return <p className="text-gray-500">{error || "Loading..."}</p>;

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500 dark:border-neutral-800 dark:text-gray-400">
            <tr>
              <th className="p-3 font-medium">User</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Tasks</th>
              <th className="p-3 font-medium">Time today</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0 dark:border-neutral-800">
                <td className="p-3">
                  <p className="font-medium">
                    {u.name ?? "—"}
                    {u.isMe && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === "ADMIN"
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "border border-gray-300 text-gray-600 dark:border-neutral-600 dark:text-gray-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3">{u.taskCount}</td>
                <td className="p-3">
                  <span className="font-mono">{fmt(u.secondsToday)}</span>
                  {u.running && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      running
                    </span>
                  )}
                </td>
                <td className="p-3 text-gray-500 dark:text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 text-right">
                  {u.isMe ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => changeRole(u)}
                        className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium transition hover:bg-gray-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        {u.role === "ADMIN" ? "Make USER" : "Make ADMIN"}
                      </button>
                      <button
                        onClick={() => remove(u)}
                        className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}