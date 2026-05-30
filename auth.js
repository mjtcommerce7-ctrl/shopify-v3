exports.handler = async function(event) {
  const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
  const STORE = 'nxacmt-ks.myshopify.com';
  const REDIRECT_URI = 'https://stellular-syrniki-04d7f0.netlify.app/.netlify/functions/auth-callback';
  const SCOPES = 'write_products,read_products,write_files,read_files';

  const authUrl = `https://${STORE}/admin/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  return {
    statusCode: 302,
    headers: { Location: authUrl }
  };
};
