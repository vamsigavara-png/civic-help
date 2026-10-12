import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import QRCode from "qrcode";
import { authenticator } from "otplib";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const secret = authenticator.generateSecret();
  const passwordHash = await hashPassword("Vamsi778+");

  const admin = await prisma.user.upsert({
    where: { email: "vamsigavara964@gmail.com" },
    update: {},
    create: {
      email: "vamsigavara964@gmail.com",
      password: passwordHash,
      role: "SUPER_ADMIN",
      fullName: "Vamsi Gavara",
      department: "Operations",
      totpVerified: true,
      totpSecret: secret,
    },
  });

  const otpAuth = authenticator.keyuri(admin.email, "HelpHub", secret);
  const qr = await QRCode.toDataURL(otpAuth);

  console.log("\n✓ Super admin created");
  console.log("  Email: vamsigavara964@gmail.com");
  console.log("  Password: Vamsi778+");
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
