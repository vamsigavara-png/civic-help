import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export async function generateCSRFToken() {
  const token = randomBytes(32).toString("hex");
  const cookieStore = cookies();
  cookieStore.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return token;
}

export async function verifyCSRFToken(token: string) {
  const cookieStore = cookies();
  const storedToken = cookieStore.get("csrf-token")?.value;
  return token === storedToken;
}
