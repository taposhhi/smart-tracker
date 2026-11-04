import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ role: z.enum(["ADMIN", "USER"]) });

// Change a user's role
export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  if (id === admin.id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const result = await prisma.user.updateMany({
    where: { id },
    data: { role: parsed.data.role },
  });
  if (result.count === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// Delete a user (their tasks and time logs are deleted too)
export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;

  if (id === admin.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const result = await prisma.user.deleteMany({ where: { id } });
  if (result.count === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}