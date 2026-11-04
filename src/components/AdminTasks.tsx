"use client";

import { useEffect, useState } from "react";

type T = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  seconds: number;
  user: { id: string; name: string | null; email: string };
};
type UserOpt = { id: string; name: string | null; email: string };

const STATUS_LABEL = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
const STATUS_STYLE = {
  TODO: "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
};
const PRIORITY_STYLE = {
  LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  HIGH: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
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

export default function AdminTasks() {
  const [tasks, setTasks] = useState<T[] | null>(null);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => Array.isArray(data) && setUsers(data));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/tasks${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setTasks(data);
          setError("");
        }
      })
      .catch(() => !cancelled && setError("Could not load tasks."));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-gray-500 dark:text-gray-400">User</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white"
        >
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email}
            </option>
          ))}
        </select>
        {tasks && <span className="text-sm text-gray-500">{tasks.length} tasks</span>}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {!tasks ? (
        <p className="text-gray-500">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500">No tasks found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500 dark:border-neutral-800 dark:text-gray-400">
              <tr>
                <th className="p-3 font-medium">Task</th>
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Priority</th>
                <th className="p-3 font-medium">Time logged</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 last:border-0 dark:border-neutral-800">
                  <td className="p-3 font-medium">{t.title}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">{t.user.name ?? t.user.email}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[t.priority]}`}>
                      {t.priority.charAt(0) + t.priority.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{fmt(t.seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}