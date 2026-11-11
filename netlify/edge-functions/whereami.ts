// Returns the visitor's IP-based approximate location using Netlify's built-in geo data.
// No third-party lookup service is involved.
export default (_request: Request, context: any) => {
  const g = context.geo || {};
  return new Response(JSON.stringify({
    ip: context.ip || null,
    city: g.city || null,
    region: (g.subdivision && g.subdivision.name) || null,
    country: (g.country && g.country.name) || null,
    country_code: (g.country && g.country.code) || null,
    lat: typeof g.latitude === "number" ? g.latitude : null,
    lon: typeof g.longitude === "number" ? g.longitude : null,
    timezone: g.timezone || null,
  }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
};
export const config = { path: "/api/whereami" };
