const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// ===== Limite de requisições =====
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, content: "🚫 Limite de requisições excedido." }
});
app.use("/gpt-tps", limiter);

// ===== MODELOS GPT com fallback =====
const MODELS = [
  "deepseek-ai/deepseek-chat",
  "openchat/openchat-3.5-0106",
  "openai/gpt-3.5-turbo"
];

function logError(error, model, attempt) {
  console.error(`[${new Date().toISOString()}] ❌ Erro no modelo ${model} (tentativa ${attempt}):`, error.message || error);
}

async function fetchWithFallback(models, prompt, apiKey, timeoutMs = 10000) {
  let lastError = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://canalvivo.org",
          "X-Title": "TPS Travel Assistant"
        },
        body: JSON.stringify({
          model: model,
          messages: prompt,
          temperature: 0.7,
          max_tokens: 1000
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        return { success: true, content: data.choices[0].message.content };
      } else {
        throw new Error("Resposta inesperada da API");
      }
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      logError(error, model, i + 1);
    }
  }

  throw lastError || new Error("Todos os modelos falharam");
}

// ===== Endpoint GPT principal =====
app.post("/gpt-tps", async (req, res) => {
  try {
    const prompt = req.body.messages || req.body.prompt || [{ role: "user", content: "Olá, quem é você?" }];
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("API Key não fornecida");

    const result = await fetchWithFallback(MODELS, prompt, apiKey);
    res.json({ success: true, content: result.content });
  } catch (error) {
    logError(error, "gpt-tps endpoint", 1);
    res.status(500).json({ success: false, content: error.message });
  }
});

// ===== Endpoint /buscar-voos com Amadeus =====
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;

let amadeusAccessToken = null;
let tokenExpiration = 0;

async function autenticarAmadeus() {
  const now = Date.now();
  if (amadeusAccessToken && now < tokenExpiration) return amadeusAccessToken;

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: AMADEUS_API_KEY,
      client_secret: AMADEUS_API_SECRET
    })
  });

  const data = await response.json();
  amadeusAccessToken = data.access_token;
  tokenExpiration = now + (data.expires_in * 1000);
  return amadeusAccessToken;
}

app.post("/buscar-voos", async (req, res) => {
  const { origem, destino, data } = req.body;
  if (!origem || !destino || !data) {
    return res.status(400).json({ success: false, content: "Parâmetros ausentes: origem, destino ou data" });
  }

  try {
    const token = await autenticarAmadeus();
    const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origem}&destinationLocationCode=${destino}&departureDate=${data}&adults=1&max=5&currencyCode=USD`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const dataJson = await response.json();
    if (!dataJson.data || !Array.isArray(dataJson.data)) {
      return res.status(500).json({ success: false, content: "Nenhum voo encontrado." });
    }

    const voos = dataJson.data.map((voo, i) => {
      const seg = voo.itineraries[0].segments[0];
      return {
        id: i + 1,
        companhia: seg.carrierCode,
        saida: seg.departure.at,
        chegada: seg.arrival.at,
        preco: `$${voo.price.total}`,
        afiliado: "https://trip.tp.st/SEU-LINK-AQUI"
      };
    });

    res.json({ success: true, voos });
  } catch (err) {
    console.error("🔴 Erro ao buscar voos Amadeus:", err);
res.status(500).json({ success: false, content: err.message || "Erro desconhecido ao buscar voos da Amadeus." });
  }
});

// ===== Início do servidor =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔧 SERVER INICIADO COM CHAVE:", process.env.OPENROUTER_API_KEY ? "✅ CARREGADA" : "❌ FALTANDO");
  console.log(`🧠 GPT Backend rodando em http://localhost:${PORT}`);
});
