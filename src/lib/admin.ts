import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Returns the user only if they are an ADMIN right now (checked in the database)
export async function getAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true },
  });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}