exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const SHOPIFY_TOKEN = event.headers['x-shopify-token'];
  const STORE = 'nxacmt-ks.myshopify.com';

  if (!SHOPIFY_TOKEN) return { statusCode: 400, body: JSON.stringify({ error: 'Geen Shopify token' }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'Ongeldige JSON' }) }; }

  const product = body.product;

  // Fix variants: als er meerdere varianten zijn, voeg een option toe
  if (product.variants && product.variants.length > 1) {
    product.options = [{ name: body.optionName || 'Formaat' }];
    product.variants = product.variants.map(v => ({
      ...v,
      option1: v.title
    }));
  } else if (product.variants && product.variants.length === 1) {
    // 1 variant: verwijder de title zodat Shopify default gebruikt
    const v = product.variants[0];
    product.variants = [{
      price: v.price || '0.00',
      compare_at_price: v.compare_at_price || null,
      inventory_management: v.inventory_management || null
    }];
  }

  // Fix metafields: verwijder lege waarden
  if (product.metafields) {
    product.metafields = product.metafields.filter(m => m.value && m.value !== '');
  }

  try {
    const res = await fetch('https://' + STORE + '/admin/api/2024-01/products.json', {
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
