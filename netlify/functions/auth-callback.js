exports.handler = async function(event) {
  const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
  const STORE = 'nxacmt-ks.myshopify.com';

  const { code } = event.queryStringParameters || {};

  if (!code) {
    return {
      statusCode: 400,
      body: 'Geen code ontvangen van Shopify'
    };
  }

  try {
    const res = await fetch(`https://${STORE}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code
      })
    });

    const data = await res.json();
    const token = data.access_token;

    if (!token) {
      return {
        statusCode: 500,
        body: 'Token ophalen mislukt: ' + JSON.stringify(data)
      };
    }

    // Stuur token naar de pagina via URL fragment (blijft in browser, gaat niet naar server)
    return {
      statusCode: 302,
      headers: {
        Location: `https://stellular-syrniki-04d7f0.netlify.app/?token=${token}`
      }
    };
  } catch(e) {
    return { statusCode: 500, body: 'Fout: ' + e.message };
  }
};
