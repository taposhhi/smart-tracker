import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = new URL(req.url).searchParams.get("userId");
  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: userId ? { userId } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { id: true, name: true, email: true } },
      timeLogs: { select: { startTime: true, endTime: true } },
    },
  });

  return NextResponse.json(
    tasks.map((t) => {
      const seconds = t.timeLogs.reduce((sum, l) => {
        const end = l.endTime ?? now;
        return sum + Math.max(0, Math.floor((end.getTime() - l.startTime.getTime()) / 1000));
      }, 0);
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        seconds,
        user: t.user,
      };
    })
  );
}