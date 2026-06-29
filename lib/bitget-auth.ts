import crypto from "crypto";

const API_KEY        = process.env.BITGET_API_KEY!;
const SECRET         = process.env.BITGET_SECRET!;
const PASSPHRASE     = process.env.BITGET_PASSPHRASE!;
const BASE           = "https://api.bitget.com";

function sign(timestamp: string, method: string, path: string, body: string) {
  const msg = timestamp + method.toUpperCase() + path + body;
  return crypto.createHmac("sha256", SECRET).update(msg).digest("base64");
}

export async function bitgetRequest(
  method: "GET" | "POST",
  path: string,
  body: object = {}
) {
  const ts        = Date.now().toString();
  const bodyStr   = method === "POST" ? JSON.stringify(body) : "";
  const signature = sign(ts, method, path, bodyStr);

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type":       "application/json",
      "ACCESS-KEY":         API_KEY,
      "ACCESS-SIGN":        signature,
      "ACCESS-TIMESTAMP":   ts,
      "ACCESS-PASSPHRASE":  PASSPHRASE,
    },
    body: method === "POST" ? bodyStr : undefined,
  });

  return res.json();
}