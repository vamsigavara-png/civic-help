import crypto from "crypto";

export function checkSpam(description: string) {
  const linkCount = (description.match(/https?:\/\//g) || []).length;
  const hasRepetition = /(.+)\1{2,}/.test(description);
  const contentHash = crypto.createHash("sha256").update(description).digest("hex");

  return {
    flagged: linkCount > 5 || hasRepetition,
    reason: linkCount > 5 ? "Too many links" : "Repetitive content",
    contentHash,
    linkCount,
    hasRepetitiveContent: hasRepetition,
  };
}
