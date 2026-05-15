// lib/getClientInfo.js

export async function getClientInfo(req) {
  // --- 1. IP取得 ---
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null;

  // --- 2. 地域情報取得 ---
  let geo = null;

  if (ip) {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      if (res.ok) {
        const data = await res.json();
        geo = {
          ip: data.ip,
          country: data.country_name,
          region: data.region,
          city: data.city,
        };
      }
    } catch (e) {
      geo = null; // API失敗時は null のまま
    }
  }

  return { ip, geo };
}