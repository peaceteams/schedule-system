// lib/getClientInfo.js
import { formatUserAgent } from "@/lib/ua";

export async function getClientInfoFromIp(ip, uaString = "") {
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

  const formattedUA = formatUserAgent(uaString);

  return { ip, geo, ua: formattedUA };
}