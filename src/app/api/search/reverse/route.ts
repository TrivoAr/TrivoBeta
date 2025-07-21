export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: 'Missing lat/lon parameters' }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = process.env.HERE_API_KEY;

    // Endpoint de HERE para reverse geocoding
    const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lon}&lang=es&apiKey=${apiKey}`;

    console.log('Reverse URL solicitada:', url);

    const response = await fetch(url);
    const data = await response.json();

    console.log('Respuesta HERE reverse:', JSON.stringify(data, null, 2));

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return new Response(JSON.stringify({ display_name: item.address.label }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: 'No address found' }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error('Error in /api/reverse:', error);
    return new Response(JSON.stringify({ error: 'Failed to reverse geocode' }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}