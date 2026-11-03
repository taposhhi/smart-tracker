import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Returns the running timer and total seconds per task
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.timeLog.findMany({ where: { userId: session.user.id } });

  const totals: Record<string, number> = {};
  let active: { id: string; taskId: string; startTime: string } | null = null;

  for (const l of logs) {
    if (l.endTime) {
      const secs = Math.floor((l.endTime.getTime() - l.startTime.getTime()) / 1000);
      totals[l.taskId] = (totals[l.taskId] ?? 0) + secs;
    } else {
      active = { id: l.id, taskId: l.taskId, startTime: l.startTime.toISOString() };
    }
  }
  return NextResponse.json({ active, totals });
}

const startSchema = z.object({ taskId: z.string().min(1) });

// Start a timer
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const parsed = startSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { taskId } = parsed.data;

  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (task.status === "DONE") {
    return NextResponse.json({ error: "Cannot start a timer on a completed task" }, { status: 400 });
  }

  const now = new Date();
  await prisma.$transaction([
    // Stop any other running timer
    prisma.timeLog.updateMany({ where: { userId, endTime: null }, data: { endTime: now } }),
    prisma.timeLog.create({ data: { taskId, userId, startTime: now } }),
  ]);

  if (task.status === "TODO") {
    await prisma.task.update({ where: { id: taskId }, data: { status: "IN_PROGRESS" } });
  }

  return NextResponse.json({ ok: true, movedToInProgress: task.status === "TODO" });
}

// Stop the running timer
export async function PATCH() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.timeLog.updateMany({
    where: { userId: session.user.id, endTime: null },
    data: { endTime: new Date() },
  });
  return NextResponse.json({ ok: true });
}