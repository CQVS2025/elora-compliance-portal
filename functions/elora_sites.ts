export default async function handler(request, context) {
  const { secrets, query } = context;
  
  try {
    const params = new URLSearchParams();
    if (query.customer_id) params.append('customer_id', query.customer_id);
    
    const url = `https://www.elora.com.au/api/sites${params.toString() ? '?' + params.toString() : ''}`;
    
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
        body: { error: 'Failed to fetch sites from Elora API' }
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