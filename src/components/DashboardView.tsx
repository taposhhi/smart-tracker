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
  completedToday: number;
  secondsToday: number;
  tasksWorkedToday: number;
  counts: { TODO: number; IN_PROGRESS: number; DONE: number };
  week: { label: string; hours: number; isToday: boolean }[];
  perTaskToday: { title: string; seconds: number }[];
  active: { taskTitle: string; startTime: string } | null;
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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardView() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    async function load() {
      try {
        const res = await fetch(`/api/dashboard?tz=${encodeURIComponent(tz)}`);
        if (!res.ok) throw new Error("load failed");
        setData(await res.json());
        setError("");
      } catch {
        setError("Could not load the dashboard.");
      }
    }

    load();
    const t = setInterval(load, 30000); // auto refresh every 30 seconds
    return () => clearInterval(t);
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading...</p>;

  const totalTasks = data.counts.TODO + data.counts.IN_PROGRESS + data.counts.DONE;
  const maxToday = data.perTaskToday[0]?.seconds || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Completed today" value={data.completedToday} sub="tasks marked Done" />
        <StatCard label="Time worked today" value={fmt(data.secondsToday)} sub="total time" />
        <StatCard label="Tasks worked on today" value={data.tasksWorkedToday} sub="tasks" />
        <StatCard
          label="Currently running"
          value={data.active ? data.active.taskTitle : "Nothing"}
          sub={data.active ? "timer is running" : "no timer is running"}
        />
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-4">Last 7 days (hours)</h2>
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

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Time spent per task today</h2>
          {data.perTaskToday.length === 0 ? (
            <p className="text-sm text-gray-500">No timer has been started today.</p>
          ) : (
            <ul className="space-y-3">
              {data.perTaskToday.map((t, i) => (
                <li key={i}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate pr-2">{t.title}</span>
                    <span className="font-mono text-gray-600">{fmt(t.seconds)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded mt-1">
                    <div
                      className="h-2 bg-green-500 rounded"
                      style={{ width: `${Math.max(4, (t.seconds / maxToday) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Task status</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>To Do</span>
              <b>{data.counts.TODO}</b>
            </li>
            <li className="flex justify-between">
              <span>In Progress</span>
              <b>{data.counts.IN_PROGRESS}</b>
            </li>
            <li className="flex justify-between">
              <span>Done</span>
              <b>{data.counts.DONE}</b>
            </li>
            <li className="flex justify-between border-t pt-2">
              <span>Total</span>
              <b>{totalTasks}</b>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}