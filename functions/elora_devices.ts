import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('ELORA_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'ELORA_API_KEY not configured' }, { status: 500 });
    }

    const { searchParams } = new URLSearchParams(req.url);
    const params = await req.json().catch(() => ({}));
    
    const status = params.status || searchParams.get('status') || 'active';

    const urlParams = new URLSearchParams();
    urlParams.set('status', status);

    const eloraUrl = `https://api.acatc.com.au/api/devices?${urlParams.toString()}`;
    const response = await fetch(eloraUrl, {
      headers: { 'x-api-key': apiKey }
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: 'Elora API error', details: error }, { status: response.status });
    }

    const result = await response.json();
    return Response.json(result.data || result);

  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
});