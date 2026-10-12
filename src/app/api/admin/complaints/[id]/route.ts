import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canAccessComplaint } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessComplaint(user.role as string, "VIEW_COMPLAINTS")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
      include: {
        privateData: canAccessComplaint(user.role as string, "VIEW_PRIVATE_DATA")
          ? true
          : false,
        messages: true,
        evidence: true,
        report: true,
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await writeAuditLog({
      action: "VIEW_COMPLAINT",
      resource: "complaint",
      resourceId: complaint.id,
      performedById: user.sub as string,
      complaintId: complaint.id,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(complaint);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessComplaint(user.role as string, "MANAGE_COMPLAINTS")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const complaint = await prisma.complaint.update({
      where: { id: params.id },
      data: {
        status: body.status,
        severity: body.severity,
        assignedToId: body.assignedToId,
        verificationStatus: body.verificationStatus,
      },
    });

    await writeAuditLog({
      action: "UPDATE_COMPLAINT",
      resource: "complaint",
      resourceId: complaint.id,
      performedById: user.sub as string,
      complaintId: complaint.id,
      details: JSON.stringify(body),
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(complaint);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
