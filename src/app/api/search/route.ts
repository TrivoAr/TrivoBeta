export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('q');

  if (!rawQuery) {
    return new Response(JSON.stringify({ error: 'Missing query parameter' }), { status: 400 });
  }

  try {
    const apiKey = process.env.HERE_API_KEY;
    const lat = -26.8333;
    const lng = -65.2167;
    let url = '';

    let query = rawQuery.trim();

    if (query.toLowerCase().includes(' y ')) {
      // Normalizar " y " a " & "
      query = query.replace(/ y /gi, ' & ');

      // Agregar contexto de ciudad/provincia
      query += ', Yerba Buena, Tucumán, Argentina';

      // Buscar intersección con geocode
      url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(query)}&apiKey=${apiKey}&at=${lat},${lng}&limit=6`;
    } else {
      // Buscar direcciones, plazas, etc. con autosuggest
      url = `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(query)}&apiKey=${apiKey}&at=${lat},${lng}&in=countryCode:ARG&limit=6`;
    }

    console.log('URL solicitada:', url);

    const response = await fetch(url);
    const data = await response.json();

    console.log('Respuesta HERE:', JSON.stringify(data, null, 2));

    if (!data.items || !Array.isArray(data.items)) {
      console.error('Unexpected API response format:', data);
      return new Response(JSON.stringify([]));
    }

    const suggestions = data.items
      .filter((item: any) => item.position && (item.address?.label || item.title))
      .map((item: any) => ({
        display_name: item.address?.label || item.title,
        lat: item.position.lat,
        lon: item.position.lng,
      }));

    return Response.json(suggestions);
  } catch (error) {
    console.error('Error in /api/search:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch suggestions' }), { status: 500 });
  }
}
