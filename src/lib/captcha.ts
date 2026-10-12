// Simple self-hosted arithmetic CAPTCHA
export function generateCaptcha() {
  const a = Math.floor(Math.random() * 50) + 1;
  const b = Math.floor(Math.random() * 50) + 1;
  const answer = a + b;
  const token = Buffer.from(`${a}:${b}:${answer}`).toString("base64");

  return {
    question: `What is ${a} + ${b}?`,
    token,
  };
}

export function verifyCaptcha(token: string, userAnswer: number) {
  try {
    const [_a, _b, answer] = Buffer.from(token, "base64")
      .toString()
      .split(":")
      .map(Number);
    return userAnswer === answer;
  } catch {
    return false;
  }
}
