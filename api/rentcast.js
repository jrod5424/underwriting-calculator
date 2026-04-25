// api/rentcast.js — Vercel serverless proxy for Rentcast API
// Keeps the API key off the client (public HTML) and resolves CORS

export default async function handler(req, res) {
  // Allow only GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, propertyType, radius = 5, count = 10 } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'address is required' });
  }

  const RENTCAST_KEY = process.env.RENTCAST_API_KEY;
  if (!RENTCAST_KEY) {
    return res.status(500).json({ error: 'RENTCAST_API_KEY not configured in environment' });
  }

  const params = new URLSearchParams({
    address,
    radius: String(radius),
    count: String(count),
  });
  if (propertyType) params.append('propertyType', propertyType);

  try {
    const upstream = await fetch(
      `https://api.rentcast.io/v1/avm/sale/comparables?${params.toString()}`,
      {
        headers: {
          'X-Api-Key': RENTCAST_KEY,
          'Accept': 'application/json',
        },
      }
    );

    const data = await upstream.json();

    // Pass through status + data
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('Rentcast proxy error:', err);
    res.status(500).json({ error: 'Upstream fetch failed', detail: err.message });
  }
}
