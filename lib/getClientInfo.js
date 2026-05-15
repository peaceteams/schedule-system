// lib/getClientInfo.js

export async function getClientInfo(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null;

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

  return { ip, geo };
}