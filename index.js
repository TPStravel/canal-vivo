// server.js
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis do .env
dotenv.config();

// Corrigir diretório base
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar app Express
const app = express();
const port = 3000;

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota para token Amadeus
app.get('/token', async (req, res) => {
  try {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY,
      client_secret: process.env.AMADEUS_API_SECRET
    });

    const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    res.json({ token: response.data.access_token });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ✅ Rota protegida para OpenRouter GPT
app.post('/gpt-tps', express.json(), async (req, res) => {
  try {
    const { prompt, model } = req.body;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: model || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`);
});
