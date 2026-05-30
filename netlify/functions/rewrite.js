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
          content: `Herschrijf de volgende parfumbeschrijving voor een professionele Nederlandse parfumwebshop.

Belangrijke regels:
- Behoud exact dezelfde structuur als het origineel.
- Behoud productspecificaties zoals artikelnummer, geurnoten, topnoten, hartnoten, basisnoten, producttype, toepassingsgebied en overige producteigenschappen als losse regels bovenaan.
- Behoud de volgorde van alle informatie.
- Herschrijf alleen de beschrijvende tekst zodat deze vloeiender, professioneler en beter leesbaar wordt.
- Verwijder geen informatie en voeg geen nieuwe informatie toe.
- Gebruik natuurlijk en correct Nederlands.
- Behoud de premium uitstraling van het merk.
- Maak de tekst overzichtelijk met duidelijke alinea's.
- Geurnoten, kenmerken en productspecificaties mogen niet worden samengevat of herschreven naar bulletpoints als deze oorspronkelijk geen bulletpoints zijn.
- Geef uitsluitend de uiteindelijke beschrijving terug.
- Geen introductie, geen conclusie, geen opmerkingen.

${title ? ' Productnaam: ' + title + '.' : ''}

Originele tekst:
${description}`
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
