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
- Geef de output terug als nette HTML.
- Gebruik voor productspecificaties bovenaan een <div class="perfume-specs"> met per specificatie een losse <div class="perfume-spec-row">.
- Zet de naam van de specificatie in <strong> en de waarde er direct achter.
- Gebruik voor de beschrijvende tekst losse <p>-alinea's.
- Behoud exact dezelfde volgorde van alle informatie.
- Behoud alle productspecificaties zoals artikelnummer, geurnoot, topnoot, hartnoot, basisnoot, navulbaar, producttype, toepassingsgebied en trend.
- Herschrijf alleen de beschrijvende tekst zodat deze vloeiender, professioneler en beter leesbaar wordt.
- Verwijder geen informatie en voeg geen nieuwe informatie toe.
- Gebruik natuurlijk, correct en professioneel Nederlands.
- Behoud een premium parfumwebshop-stijl.
- Geef uitsluitend de HTML terug.
- Geen markdown, geen codeblok, geen uitleg, geen intro.

${title ? 'Productnaam: ' + title + '.' : ''}

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
