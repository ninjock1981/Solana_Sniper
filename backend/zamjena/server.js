import { WebSocketServer } from 'ws';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const PORT = 8081;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'secret123';
const LIST_ON_ME = process.env.LIST_ON_ME === 'true';
const ME_LISTING_MARKUP = parseFloat(process.env.ME_LISTING_MARKUP || '0.15');

const app = express();
app.use(cors());

const wss = new WebSocketServer({ port: PORT });
let clients = [];
let db;

let BOT_RUNNING = true;
let MINT_LIMIT = parseInt(process.env.MINT_LIMIT || '2');
let MAX_PRICE = parseFloat(process.env.MAX_PRICE || '0.5');
let RPC_URL = process.env.RPC_URL || '';

console.log(`📡 WebSocket server pokrenut na ws://localhost:${PORT}`);

// 📂 SQLite baza
async function initDB() {
  db = await open({
    filename: './minted_nfts.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`CREATE TABLE IF NOT EXISTS minted (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mint_address TEXT,
    wallet_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

// 📥 CSV preuzimanje
app.get('/download', (req, res) => {
  const token = req.headers.authorization;
  if (token !== `Bearer ${AUTH_TOKEN}`) return res.status(403).send('Unauthorized');
  const file = './minted_nfts_export.csv';
  if (fs.existsSync(file)) res.download(file);
  else res.status(404).send('CSV not found');
});

// 📤 Pregled mintanih NFT-ova kao JSON
app.get('/minted', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM minted ORDER BY timestamp DESC LIMIT 100');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Greška prilikom čitanja baze.' });
  }
});

app.listen(8082, () => {
  console.log('📦 Express server sluša na http://localhost:8082');
});

wss.on('connection', async (ws, req) => {
  const urlParams = new URLSearchParams(req.url?.split('?')[1]);
  const token = urlParams.get('token');
  if (token !== AUTH_TOKEN) return ws.close();

  clients.push(ws);
  console.log('✅ Povezan novi korisnik.');
  ws.send(JSON.stringify({ type: 'status', message: `Bot status: ${BOT_RUNNING ? 'Aktivan' : 'Pauziran'}` }));

  if (db) {
    const recent = await db.all('SELECT * FROM minted ORDER BY timestamp DESC LIMIT 50');
    const enhanced = recent.map(r => ({
      ...r,
      solscan: `https://solscan.io/token/${r.mint_address}`,
      solanafm: `https://solana.fm/address/${r.mint_address}`
    }));
    ws.send(JSON.stringify({ type: 'minted', data: enhanced }));
  }

  ws.on('message', async (msg) => {
    const data = JSON.parse(msg);

    if (data.type === 'export_csv') {
      const where = [];
      if (data.wallet) where.push(`wallet_address = '${data.wallet}'`);
      if (data.from && data.to) where.push(`DATE(timestamp) BETWEEN '${data.from}' AND '${data.to}'`);
      const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const rows = await db.all(`SELECT * FROM minted ${clause}`);
      const csv = ["id,mint_address,wallet_address,timestamp", ...rows.map(r => `${r.id},${r.mint_address},${r.wallet_address},${r.timestamp}`)].join('\\n');
      fs.writeFileSync('./minted_nfts_export.csv', csv);
      ws.send(JSON.stringify({ type: 'log', message: `✅ CSV exportan (${rows.length} unosa)` }));
    }

    if (data.type === 'admin_command') {
      switch (data.command) {
        case 'start': BOT_RUNNING = true; broadcastStatus('Bot pokrenut.'); break;
        case 'stop': BOT_RUNNING = false; broadcastStatus('Bot pauziran.'); break;
        case 'set_limit': MINT_LIMIT = Number(data.value); broadcastLog(`🎯 Limit: ${MINT_LIMIT}`); break;
        case 'set_price': MAX_PRICE = parseFloat(data.value); broadcastLog(`💰 Max cijena: ${MAX_PRICE} SOL`); break;
        case 'set_rpc': RPC_URL = data.value; broadcastLog(`🔌 RPC: ${RPC_URL}`); break;
        case 'test_telegram': sendTelegram('📩 Ovo je testna poruka s dashboarda!'); break;
      }
    }
  });

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
    console.log(`❌ Korisnik se odspojio.`);
  });
});

function broadcastLog(msg) {
  const data = JSON.stringify({ type: 'log', message: msg });
  clients.forEach(c => { if (c.readyState === 1) c.send(data); });
  sendTelegram(msg);
}

function broadcastStatus(msg) {
  const data = JSON.stringify({ type: 'status', message: msg });
  clients.forEach(c => { if (c.readyState === 1) c.send(data); });
}

function broadcastScore() {
  const value = Math.floor(Math.random() * 40) + 60;
  const recommendation = value > 80 ? 'BUY' : value > 65 ? 'HOLD' : 'SKIP';
  const data = JSON.stringify({ type: 'score', data: { value, recommendation } });
  clients.forEach(client => {
    if (client.readyState === 1) client.send(data);
  });
  if (recommendation === 'BUY') {
    sendTelegram(`🚀 AI SIGNAL: BUY (Score ${value}/100)`);
  }
}

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_TOKEN;
  const chat_ids = (process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || '').split(',');
  if (!token || chat_ids.length === 0) return;
  for (const chat_id of chat_ids) {
    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chat_id.trim(),
        text: message
      });
    } catch (e) {
      console.error('Telegram error:', e.message);
    }
  }
}

// 🧪 Simulacija mintanja + AI score svakih 15s
setInterval(() => {
  if (BOT_RUNNING) {
    broadcastLog(`✅ Mintan novi NFT (simulacija)`);
    broadcastScore();
  }
}, 15000);

await initDB();
