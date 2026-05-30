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
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Verwerk de onderstaande parfuminformatie naar een vaste HTML-structuur voor een Nederlandse parfumwebshop. Gebruik altijd exact dit formaat:\n\n1. Begin met een <ul> met alle productspecificaties als <li> items (artikelnummer, geurnoot, topnoten, hartnoten, basisnoten, navulbaar, producttype, toepassingsgebied, trend, etc.). Zet de naam vet: <li><strong>Geurnoot:</strong> Zoet</li>. Geen lege regels tussen de items.\n\n2. Daarna direct de beschrijvende tekst als losse <p> alinea's. Verwijder tussenkopjes zoals GEURFAMILIE, TYPE GEUR, BESCHRIJVING VAN DE GEUR etc. Verwerk die informatie in de lopende tekst. Herschrijf de beschrijvende tekst zodat die vloeiend, professioneel en goed leesbaar is. Geen lege <p> tags of extra witruimte tussen alinea's.\n\nGeef uitsluitend de HTML terug. Geen markdown, geen codeblok, geen uitleg.${title ? ' Productnaam: ' + title + '.' : ''}\n\nOriginele tekst:\n${description}`
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
