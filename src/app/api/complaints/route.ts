import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ComplaintInputSchema } from "@/lib/validation";
import { generateComplaintNumber, generateTrackingCode } from "@/lib/ids";
import { checkSpam } from "@/lib/spam";
import { verifyCaptcha } from "@/lib/captcha";
import { checkRateLimit } from "@/lib/rateLimit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";

    // Rate limiting
    const allowed = await checkRateLimit(clientIp, "/api/complaints", 5, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json();

    // Verify CAPTCHA
    if (!verifyCaptcha(body.captchaToken, body.captchaAnswer)) {
      return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 400 });
    }

    // Validate input
    const parsed = ComplaintInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }

    // Check spam
    const spamCheck = checkSpam(parsed.data.description);
    const trackingCode = generateTrackingCode();
    const trackingCodeHash = crypto.createHash("sha256").update(trackingCode).digest("hex");

    // Create complaint with private data
    const complaint = await prisma.complaint.create({
      data: {
        complaintNumber: generateComplaintNumber(),
        title: parsed.data.title,
        category: parsed.data.category,
        description: parsed.data.description,
        trackingCodeHash,
        locationCity: parsed.data.city,
        locationDistrict: parsed.data.district,
        autoFlagged: spamCheck.flagged,
        autoFlagReason: spamCheck.reason,
        contentHash: spamCheck.contentHash,
        privateData: {
          create: {
            firstName: body.firstName || "Anonymous",
            lastName: body.lastName || "",
            email: parsed.data.email || "",
            phone: body.phone,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
            fullAddress: body.fullAddress,
            preferredLanguage: parsed.data.preferredLanguage || "en",
          },
        },
        report: {
          create: {
            linkCount: spamCheck.linkCount,
            hasRepetitiveContent: spamCheck.hasRepetitiveContent,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        complaintNumber: complaint.complaintNumber,
        trackingCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
