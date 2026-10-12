import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import QRCode from "qrcode";
import { authenticator } from "otplib";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const secret = authenticator.generateSecret();
  const passwordHash = await hashPassword("admin123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@helphub.local" },
    update: {},
    create: {
      email: "admin@helphub.local",
      password: passwordHash,
      role: "SUPER_ADMIN",
      fullName: "System Administrator",
      department: "Operations",
      totpVerified: true,
      totpSecret: secret,
    },
  });

  const otpAuth = authenticator.keyuri(admin.email, "HelpHub", secret);
  const qr = await QRCode.toDataURL(otpAuth);

  console.log("\n✓ Super admin created");
  console.log("  Email: admin@helphub.local");
  console.log("  Password: admin123");
  console.log("\n2FA QR Code:");
  console.log(qr);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
