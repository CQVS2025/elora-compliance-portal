Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("ELORA_API_KEY");
    
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Test getting BORAL - QLD sites
    const boralRef = "20231031142907S3457";
    
    const response = await fetch('https://www.elora.com.au/api/sites', {
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      return Response.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    const allSites = await response.json();
    const boralSites = allSites.filter(site => site.customerRef === boralRef);
    
    return Response.json({
      totalSites: allSites.length,
      boralSites: boralSites.length,
      boralSitesData: boralSites
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});