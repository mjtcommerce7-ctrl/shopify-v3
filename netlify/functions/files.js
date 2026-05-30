exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const SHOPIFY_TOKEN = event.headers['x-shopify-token'];
  const STORE = 'nxacmt-ks.myshopify.com';

  if (!SHOPIFY_TOKEN) return { statusCode: 400, body: JSON.stringify({ error: 'Geen Shopify token' }) };

  const query = `{
    files(first: 250, query: "media_type:IMAGE") {
      edges {
        node {
          id
          ... on MediaImage {
            id
            image {
              url
              altText
            }
          }
          ... on GenericFile {
            id
            url
            mimeType
          }
        }
      }
    }
  }`;

  try {
    const res = await fetch('https://' + STORE + '/admin/api/2024-01/graphql.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_TOKEN
      },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    const files = (data.data && data.data.files && data.data.files.edges ? data.data.files.edges : []).map(e => ({
      gid: e.node.id,
      url: (e.node.image && e.node.image.url) ? e.node.image.url : e.node.url,
      filename: (e.node.image && e.node.image.altText) ? e.node.image.altText : (e.node.url ? e.node.url.split('/').pop().split('?')[0] : 'bestand'),
      content_type: 'image/jpeg'
    })).filter(f => f.url);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
