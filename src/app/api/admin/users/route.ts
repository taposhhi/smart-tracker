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
  const since = new Date(now.getTime() - 36 * 60 * 60 * 1000);

  const [users, logs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
    }),
    prisma.timeLog.findMany({
      where: { startTime: { gte: since } },
      select: { userId: true, startTime: true, endTime: true },
    }),
  ]);

  const secondsToday: Record<string, number> = {};
  const running = new Set<string>();

  for (const l of logs) {
    if (!l.endTime) running.add(l.userId);
    if (dayKey(l.startTime, tz) !== todayKey) continue;
    const end = l.endTime ?? now;
    const secs = Math.max(0, Math.floor((end.getTime() - l.startTime.getTime()) / 1000));
    secondsToday[l.userId] = (secondsToday[l.userId] ?? 0) + secs;
  }

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      taskCount: u._count.tasks,
      secondsToday: secondsToday[u.id] ?? 0,
      running: running.has(u.id),
      isMe: u.id === admin.id,
    }))
  );
}