// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const rawQuery = searchParams.get('q');

//   if (!rawQuery) {
//     return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
//       status: 400,
//       headers: { "Content-Type": "application/json" },
//     });
//   }

//   try {
//     const apiKey = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
//     const lat = -26.8333;
//     const lng = -65.2167;
//     let url = '';

//     let query = rawQuery.trim();

//     if (query.toLowerCase().includes(' y ')) {
//       query = query.replace(/ y /gi, ' & ');
//       query += ', Yerba Buena, Tucumán, Argentina';
//       // url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(query)}&apiKey=${apiKey}&at=${lat},${lng}&limit=6`;
//       url= `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${apiKey}&limit=6&autocomplete=true`;
//   const r = await fetch(url);
//     } else {
//       url = `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(query)}&apiKey=${apiKey}&at=${lat},${lng}&in=countryCode:ARG&limit=6`;
//     }

//     console.log('URL solicitada:', url);

//     const response = await fetch(url);
//     const data = await response.json();

//     console.log('Respuesta HERE:', JSON.stringify(data, null, 2));

//     if (!data.items || !Array.isArray(data.items)) {
//       console.error('Unexpected API response format:', data);
//       return new Response(JSON.stringify([]), {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     const suggestions = data.items
//       .filter((item: any) => item.position && (item.address?.label || item.title))
//       .map((item: any) => ({
//         display_name: item.address?.label || item.title,
//         lat: item.position.lat,
//         lon: item.position.lng,
//       }));

//     return new Response(JSON.stringify(suggestions), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error('Error in /api/search:', error);
//     return new Response(JSON.stringify({ error: 'Failed to fetch suggestions' }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }

// app/api/search/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('q');

  if (!rawQuery) {
    return new Response(JSON.stringify([]), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const token = process.env.MAPBOX_TOKEN;
    const query = rawQuery.trim();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=6&autocomplete=true&language=es`;

    const r = await fetch(url);
    const data = await r.json();

    const suggestions = (data.features || []).map((f: any) => ({
      display_name: f.place_name,
      lat: f.center[1],
      lon: f.center[0],
    }));

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in /api/search:", error);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
