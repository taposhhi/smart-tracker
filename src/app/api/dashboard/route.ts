import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Kono timezone-e kono somoyer "tarikh" (YYYY-MM-DD)
function dayKey(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isValidTz(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const tzParam = new URL(req.url).searchParams.get("tz") ?? "UTC";
  const tz = isValidTz(tzParam) ? tzParam : "UTC";

  const now = new Date();
  const todayKey = dayKey(now, tz);

  // Last 7 din-er key (purono theke notun)
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    dayKeys.push(dayKey(new Date(now.getTime() - i * 24 * 60 * 60 * 1000), tz));
  }

  // 8 din-er kaj anlei 7 din cover hoy (timezone-er gap-er jonno)
  const since = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

  const [logs, tasks, doneToday] = await Promise.all([
    prisma.timeLog.findMany({
      where: { userId, startTime: { gte: since } },
      include: { task: { select: { id: true, title: true } } },
    }),
    prisma.task.findMany({ where: { userId }, select: { status: true } }),
    prisma.task.findMany({
      where: { userId, status: "DONE", updatedAt: { gte: since } },
      select: { updatedAt: true },
    }),
  ]);

  const perDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));
  const perTaskToday: Record<string, { title: string; seconds: number }> = {};
  let active: { taskTitle: string; startTime: string } | null = null;

  for (const l of logs) {
    const end = l.endTime ?? now;
    const secs = Math.max(0, Math.floor((end.getTime() - l.startTime.getTime()) / 1000));
    const key = dayKey(l.startTime, tz);

    if (key in perDay) perDay[key] += secs;

    if (key === todayKey) {
      const cur = perTaskToday[l.taskId] ?? { title: l.task.title, seconds: 0 };
      cur.seconds += secs;
      perTaskToday[l.taskId] = cur;
    }
    if (!l.endTime) active = { taskTitle: l.task.title, startTime: l.startTime.toISOString() };
  }

  const completedToday = doneToday.filter((t) => dayKey(t.updatedAt, tz) === todayKey).length;
  const secondsToday = perDay[todayKey] ?? 0;

  const week = dayKeys.map((k) => {
    const [, m, d] = k.split("-");
    return {
      label: `${pad(Number(d))}/${pad(Number(m))}`,
      hours: Math.round((perDay[k] / 3600) * 100) / 100,
      isToday: k === todayKey,
    };
  });

  return NextResponse.json({
    completedToday,
    secondsToday,
    tasksWorkedToday: Object.keys(perTaskToday).length,
    counts: {
      TODO: tasks.filter((t) => t.status === "TODO").length,
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      DONE: tasks.filter((t) => t.status === "DONE").length,
    },
    week,
    perTaskToday: Object.values(perTaskToday).sort((a, b) => b.seconds - a.seconds),
    active,
  });
}