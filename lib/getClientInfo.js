// lib/getClientInfo.js
import { formatUserAgent } from "@/lib/ua";

export async function getClientInfo(ip, uaString = "") {
  let geo = null;

  if (ip) {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await res.json();

      if (!data.error) {
        geo = {
          ip: data.ip,
          country: data.country_name,
          region: data.region,
          city: data.city,
        };
      }
    } catch (e) {
      geo = null;
    }
  }

  return {
    ip,
    geo,
    ua: formatUserAgent(uaString),
  };
}