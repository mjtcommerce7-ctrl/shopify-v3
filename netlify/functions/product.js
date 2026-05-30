exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const SHOPIFY_TOKEN = event.headers['x-shopify-token'];
  const STORE = 'nxacmt-ks.myshopify.com';

  if (!SHOPIFY_TOKEN) return { statusCode: 400, body: JSON.stringify({ error: 'Geen Shopify token' }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'Ongeldige JSON' }) }; }

  const product = body.product;

  // Als er maar 1 variant is zonder naam, verwijder variants zodat Shopify de default aanmaakt
  if (product.variants && product.variants.length === 1 && product.variants[0].title === 'Standaard') {
    const variant = product.variants[0];
    product.variants = undefined;
    if (variant.price) product.variants = [{ price: variant.price, compare_at_price: variant.compare_at_price }];
  }

  try {
    const res = await fetch(`https://${STORE}/admin/api/2024-01/products.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': SHOPIFY_TOKEN },
      body: JSON.stringify({ product })
    });
    const data = await res.json();
    return { statusCode: res.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
