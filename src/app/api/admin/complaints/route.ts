import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canAccessComplaint } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessComplaint(user.role as string, "VIEW_COMPLAINTS")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const complaints = await prisma.complaint.findMany({
      select: {
        id: true,
        complaintNumber: true,
        title: true,
        category: true,
        status: true,
        severity: true,
        createdAt: true,
        assignedToId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    await writeAuditLog({
      action: "VIEW_COMPLAINTS_LIST",
      resource: "complaint",
      resourceId: "list",
      performedById: user.sub as string,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(complaints);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
