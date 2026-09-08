// api/recensioni.js — recensioni degli allievi con verifica (moderazione)
// Usa Vercel Blob (gratuito) per conservare i dati, come le locandine.
//
//  GET  /api/recensioni          -> pubblico: solo le recensioni APPROVATE
//  GET  /api/recensioni?all=1    -> protetto: TUTTE (comprese in attesa) [Bearer ADMIN_TOKEN]
//  POST /api/recensioni          -> pubblico: un allievo invia una recensione (resta "pending")
//  PUT  /api/recensioni          -> protetto: salva l'elenco intero

import { put, list } from '@vercel/blob';

const PATH = 'data/recensioni.json';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function isAdmin(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

async function readData() {
  try {
    const { blobs } = await list({ prefix: PATH, limit: 1 });
    if (!blobs.length) return [];
    const r = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

async function writeData(items) {
  await put(PATH, JSON.stringify(items), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  let all = await readData();

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    if (req.query && req.query.all === '1') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
      return res.status(200).json(all);
    }
    return res.status(200).json(all.filter((r) => r.stato === 'approved'));
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const nome = (body.nome || '').toString().slice(0, 120).trim();
      const testo = (body.testo || '').toString().slice(0, 4000).trim();
      if (!nome || !testo) return res.status(400).json({ error: 'Nome e testo obbligatori' });
      const review = {
        id: 'rec-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        nome,
        titolo: (body.titolo || '').toString().slice(0, 160).trim(),
        testo,
        corso: (body.corso || '').toString().slice(0, 160).trim(),
        stato: 'pending',
        creata: Date.now()
      };
      all.push(review);
      await writeData(all);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Invio non riuscito' });
    }
  }

  if (req.method === 'PUT') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Non autorizzato' });
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!Array.isArray(body)) return res.status(400).json({ error: 'Formato non valido' });
      await writeData(body);
      return res.status(200).json({ ok: true, count: body.length });
    } catch (e) {
      return res.status(500).json({ error: 'Salvataggio non riuscito' });
    }
  }

  return res.status(405).json({ error: 'Metodo non consentito' });
}
