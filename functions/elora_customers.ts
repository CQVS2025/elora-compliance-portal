Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("ELORA_API_KEY");
    
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://www.elora.com.au/api/customers', {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Elora API error: ${response.statusText}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});