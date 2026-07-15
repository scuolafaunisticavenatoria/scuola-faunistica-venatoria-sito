import { put } from '@vercel/blob';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

export default async function handler(req, res) {
  try {
    console.log('UPLOAD START', req.method);
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });

    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      console.log('AUTH FAILED', { hasEnv: !!process.env.ADMIN_TOKEN });
      return res.status(401).json({ error: 'Non autorizzato' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { name, dataUrl } = body || {};
    if (!dataUrl) return res.status(400).json({ error: 'Immagine mancante' });

    const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
    if (!match) return res.status(400).json({ error: 'Formato immagine non valido' });
    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');

    const safe = (name || 'locandina').replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = 'locandine/' + Date.now() + '-' + safe;

    console.log('BEFORE PUT', { hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN, size: buffer.length });

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
      token: process.env.blobpub_READ_WRITE_TOKEN
    });

    console.log('UPLOAD OK', blob.url);
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    console.log('UPLOAD ERROR NAME', e && e.name);
    console.log('UPLOAD ERROR MESSAGE', e && e.message);
    console.log('UPLOAD ERROR STACK', e && e.stack);
    return res.status(500).json({ error: 'Caricamento non riuscito: ' + (e && e.message) });
  }
}
