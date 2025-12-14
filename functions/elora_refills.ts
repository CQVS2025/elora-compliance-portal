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

    const { searchParams } = new URL(req.url);
    const params = await req.json().catch(() => ({}));
    
    const customerRef = params.customer_id || searchParams.get('customer_id');
    const siteRef = params.site_id || searchParams.get('site_id');
    const fromDate = params.from_date || searchParams.get('from_date');
    const toDate = params.to_date || searchParams.get('to_date');

    const urlParams = new URLSearchParams();
    if (customerRef && customerRef !== 'all') urlParams.set('customer', customerRef);
    if (siteRef && siteRef !== 'all') urlParams.set('site', siteRef);
    if (fromDate) urlParams.set('fromDate', fromDate);
    if (toDate) urlParams.set('toDate', toDate);

    const eloraUrl = `https://api.acatc.com.au/api/refills?${urlParams.toString()}`;
    const response = await fetch(eloraUrl, {
      headers: { 'x-api-key': apiKey }
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: 'Elora API error', details: error }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);

  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
});