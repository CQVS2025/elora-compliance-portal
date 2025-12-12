Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("ELORA_API_KEY");
    
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Test filtering vehicles by BORAL - QLD customer
    const boralRef = "20231031142907S3457";
    const archerfieldRef = "20231102140953S61643";
    
    const params1 = new URLSearchParams({ 
      status: '1',
      customer: boralRef 
    });
    
    const response1 = await fetch(`https://www.elora.com.au/api/vehicles?${params1.toString()}`, {
      headers: { 'x-api-key': apiKey }
    });
    const json1 = await response1.json();
    
    const params2 = new URLSearchParams({ 
      status: '1',
      customer: boralRef,
      site: archerfieldRef 
    });
    
    const response2 = await fetch(`https://www.elora.com.au/api/vehicles?${params2.toString()}`, {
      headers: { 'x-api-key': apiKey }
    });
    const json2 = await response2.json();
    
    return Response.json({
      boralVehiclesCount: json1.total || json1.data?.length || 0,
      archerfieldVehiclesCount: json2.total || json2.data?.length || 0,
      boralVehicles: (json1.data || []).slice(0, 5),
      archerfieldVehicles: (json2.data || []).slice(0, 5)
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});