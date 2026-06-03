const chars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateCode() {
  const length =
    Math.floor(Math.random() * 3) + 4;

  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex =
      Math.floor(Math.random() * chars.length);

    code += chars[randomIndex];
  }

  return code;
}