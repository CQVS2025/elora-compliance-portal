export default async function handler(request, context) {
  const { secrets } = context;
  
  try {
    const response = await fetch('https://www.elora.com.au/api/customers', {
      method: 'GET',
      headers: {
        'X-API-Key': secrets.ELORA_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: { error: 'Failed to fetch customers from Elora API' }
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