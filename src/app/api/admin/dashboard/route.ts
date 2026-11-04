import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { dayKey, resolveTz } from "@/lib/time";

export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tz = resolveTz(req);
  const now = new Date();
  const todayKey = dayKey(now, tz);

  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    dayKeys.push(dayKey(new Date(now.getTime() - i * 24 * 60 * 60 * 1000), tz));
  }
  const since = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

  const [users, logs, tasks, doneRecent] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.timeLog.findMany({
      where: { startTime: { gte: since } },
      select: { userId: true, startTime: true, endTime: true },
    }),
    prisma.task.findMany({ select: { status: true } }),
    prisma.task.findMany({
      where: { status: "DONE", updatedAt: { gte: since } },
      select: { userId: true, updatedAt: true },
    }),
  ]);

  const perDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));
  const secondsTodayByUser: Record<string, number> = {};

  for (const l of logs) {
    const end = l.endTime ?? now;
    const secs = Math.max(0, Math.floor((end.getTime() - l.startTime.getTime()) / 1000));
    const key = dayKey(l.startTime, tz);
    if (key in perDay) perDay[key] += secs;
    if (key === todayKey) {
      secondsTodayByUser[l.userId] = (secondsTodayByUser[l.userId] ?? 0) + secs;
    }
  }

  const completedByUser: Record<string, number> = {};
  for (const t of doneRecent) {
    if (dayKey(t.updatedAt, tz) === todayKey) {
      completedByUser[t.userId] = (completedByUser[t.userId] ?? 0) + 1;
    }
  }

  const perUser = users
    .map((u) => ({
      id: u.id,
      name: u.name ?? u.email,
      email: u.email,
      secondsToday: secondsTodayByUser[u.id] ?? 0,
      completedToday: completedByUser[u.id] ?? 0,
    }))
    .sort((a, b) => b.secondsToday - a.secondsToday);

  const week = dayKeys.map((k) => {
    const [, m, d] = k.split("-");
    return {
      label: `${d}/${m}`,
      hours: Math.round((perDay[k] / 3600) * 100) / 100,
      isToday: k === todayKey,
    };
  });

  return NextResponse.json({
    totals: {
      users: users.length,
      tasks: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      secondsToday: perDay[todayKey] ?? 0,
      completedToday: Object.values(completedByUser).reduce((a, b) => a + b, 0),
    },
    week,
    perUser,
  });
}