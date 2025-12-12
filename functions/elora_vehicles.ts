export default async function handler(request, context) {
  const { secrets, query } = context;
  
  try {
    const params = new URLSearchParams();
    if (query.customer_id) params.append('customer_id', query.customer_id);
    if (query.site_id) params.append('site_id', query.site_id);
    if (query.start_date) params.append('start_date', query.start_date);
    if (query.end_date) params.append('end_date', query.end_date);
    
    const url = `https://www.elora.com.au/api/vehicles${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': secrets.ELORA_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: { error: 'Failed to fetch vehicles from Elora API' }
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      body: data
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: { error: error.message }
    };
  }
}