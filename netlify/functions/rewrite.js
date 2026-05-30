exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ANTHROPIC_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_KEY niet ingesteld' }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'Ongeldige JSON' }) }; }

  const { description, title } = body;
  if (!description) return { statusCode: 400, body: JSON.stringify({ error: 'Geen beschrijving' }) };

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Herschrijf de volgende parfumbeschrijving naar een professionele, verleidelijke tekst voor een Nederlandse parfumwebshop. Gebruik rijke, sensuele taal die past bij luxe parfumerie. Geen opsommingstekens. Maximaal 3 alinea's. Geef alleen de tekst terug, geen intro of uitleg.${title ? ' Productnaam: ' + title + '.' : ''}\n\nOriginele tekst:\n${description}`
        }]
      })
    });

    const data = await res.json();
    
    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message, full: data }) };
    }

    const text = data.content?.find(b => b.type === 'text')?.text || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: text, debug: data.usage })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
