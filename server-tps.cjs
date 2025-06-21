
console.log("🔧 Iniciando servidor TPS com GPT e Amadeus...");

const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors({ origin: 'https://canalvivo.org' }));
app.use(express.json());

const GPT_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.2-3b-instruct:free';

app.post('/gpt-tps', async (req, res) => {
  const prompt = req.body.prompt || '';
  const lang = req.body.lang || 'en';

  try {
    const response = await fetch(GPT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://canalvivo.org',
        'X-Title': 'TPS GPT'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: `Você é o TPS, um assistente de viagem. Responda no idioma ${lang} e detecte origem, destino e data caso o usuário fale sobre voo.` },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "Não consegui responder no momento.";

    const reply = text;
    const intent = /voo|flight/.test(prompt.toLowerCase()) ? 'flight_search' : null;
    const extract = extractFlightData(prompt);

    res.json({ reply, intent, ...extract });
  } catch (err) {
    console.error("Erro GPT:", err);
    res.status(500).json({ reply: "Erro interno no servidor GPT." });
  }
});

function extractFlightData(text) {
  const result = {};
  const regexCidade = /(?:de|from)?\s?(\w{3,})\s?(?:para|to)\s?(\w{3,})/i;
  const regexData = /(\d{1,2}\/\d{1,2}\/\d{4})/;
  const matchCidade = text.match(regexCidade);
  const matchData = text.match(regexData);
  if (matchCidade) {
    result.origin = matchCidade[1];
    result.destination = matchCidade[2];
  }
  if (matchData) {
    result.date = formatarData(matchData[1]);
  }
  return result;
}

function formatarData(d) {
  const [dia, mes, ano] = d.split('/');
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

app.post('/buscar-voos', async (req, res) => {
  const { origem, destino, data } = req.body;

  try {
    const tokenRes = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${process.env.AMADEUS_API_KEY}&client_secret=${process.env.AMADEUS_API_SECRET}`
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    const response = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origem}&destinationLocationCode=${destino}&departureDate=${data}&adults=1&nonStop=false&currencyCode=USD&max=3`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const dataJson = await response.json();
    const voos = dataJson.data.map(v => ({
      airline: v.validatingAirlineCodes[0],
      departure: v.itineraries[0].segments[0].departure.at,
      arrival: v.itineraries[0].segments.slice(-1)[0].arrival.at,
      class: v.travelerPricings[0].fareDetailsBySegment[0].cabin,
      price: `$${v.price.total} ${v.price.currency}`
    }));

    res.json(voos);
  } catch (err) {
    console.error("Erro ao buscar voos:", err);
    res.status(500).json({ error: "Erro ao buscar voos." });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🧠 GPT + Amadeus rodando em http://localhost:${PORT}`);
});
