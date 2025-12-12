Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("ELORA_API_KEY");
    
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const url = new URL(req.url);
    const customerId = url.searchParams.get('customer_id');

    let apiUrl = 'https://www.elora.com.au/api/sites';
    if (customerId) {
      apiUrl += `?customer_id=${customerId}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Elora API error: ${response.statusText}`);
    }

    const data = await response.json();
    return Response.json(data.data || []);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});