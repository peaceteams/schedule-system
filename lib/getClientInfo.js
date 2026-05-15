// lib/getClientInfo.js
import { formatUserAgent } from "@/lib/ua";

function getRealIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim());
    return parts[parts.length - 1]; // ← 最後が本当のIP
  }
  return req.socket?.remoteAddress || null;
}

export async function getClientInfo(req) {
  const ip = getRealIp(req);

  let geo = null;

  if (ip) {
    try {
      const res = await fetch(`https://ipwho.is/${ip}`);
      const data = await res.json();

      if (data.success) {
        geo = {
          ip: data.ip,
          country: data.country,
          region: data.region,
          city: data.city,
        };
      }
    } catch (e) {
      geo = null;
    }
  }

  const ua = req.headers["user-agent"] || "";
  const formattedUA = formatUserAgent(ua);

  return { ip, geo, ua: formattedUA };
}