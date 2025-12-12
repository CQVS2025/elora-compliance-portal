Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("ELORA_API_KEY");
    
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const url = new URL(req.url);
    const customerId = url.searchParams.get('customer_id');
    const siteId = url.searchParams.get('site_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    const params = new URLSearchParams();
    if (customerId && customerId !== 'all') params.append('customer_id', customerId);
    if (siteId && siteId !== 'all') params.append('site_id', siteId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const apiUrl = `https://www.elora.com.au/api/vehicles${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(apiUrl, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Elora API error (${response.status}):`, errorText);
      return Response.json({ 
        error: `Elora API error: ${response.status}`,
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return Response.json(data);
    } else if (data.body && Array.isArray(data.body)) {
      return Response.json(data.body);
    } else if (data.data && Array.isArray(data.data)) {
      return Response.json(data.data);
    } else {
      console.warn('Unexpected response structure:', data);
      return Response.json([]);
    }
    
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});