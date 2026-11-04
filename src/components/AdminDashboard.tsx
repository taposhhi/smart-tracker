"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Data = {
  totals: {
    users: number;
    tasks: number;
    todo: number;
    inProgress: number;
    done: number;
    secondsToday: number;
    completedToday: number;
  };
  week: { label: string; hours: number; isToday: boolean }[];
  perUser: { id: string; name: string; email: string; secondsToday: number; completedToday: number }[];
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

function Stat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    async function load() {
      try {
        const res = await fetch(`/api/admin/dashboard?tz=${encodeURIComponent(tz)}`);
        if (!res.ok) throw new Error("failed");
        setData(await res.json());
        setError("");
      } catch {
        setError("Could not load the dashboard.");
      }
    }

    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-gray-500">Loading...</p>;

  const max = data.perUser[0]?.secondsToday || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Users" value={data.totals.users} sub="registered accounts" />
        <Stat label="Tasks" value={data.totals.tasks} sub={`${data.totals.done} done, ${data.totals.inProgress} in progress`} />
        <Stat label="Time worked today" value={fmt(data.totals.secondsToday)} sub="all users combined" />
        <Stat label="Completed today" value={data.totals.completedToday} sub="tasks marked Done" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 font-semibold">Last 7 days, all users (hours)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.week}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis allowDecimals />
              <Tooltip formatter={(v) => [`${v} hours`, "Work"]} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {data.week.map((d) => (
                  <Cell key={d.label} fill={d.isToday ? "#16a34a" : "#9ca3af"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 font-semibold">Activity today, by user</h2>
        <ul className="space-y-4">
          {data.perUser.map((u) => (
            <li key={u.id}>
              <div className="flex justify-between text-sm">
                <span className="truncate pr-2">
                  {u.name}
                  <span className="ml-2 text-xs text-gray-400">{u.completedToday} done</span>
                </span>
                <span className="font-mono text-gray-600 dark:text-gray-300">{fmt(u.secondsToday)}</span>
              </div>
              <div className="mt-1 h-2 rounded bg-gray-100 dark:bg-neutral-800">
                <div
                  className="h-2 rounded bg-emerald-500"
                  style={{ width: `${u.secondsToday === 0 ? 2 : Math.max(4, (u.secondsToday / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}