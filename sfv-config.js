/* ============================================================
   CONFIGURAZIONE — Scuola Faunistica Venatoria
   ------------------------------------------------------------
   Sito pubblicato su Vercel, stesso progetto che contiene già
   le API (api/locandine.js, api/upload.js, api/recensioni.js).

   1) SFV_API_BASE
      Impostato automaticamente sull'indirizzo da cui il sito
      viene aperto (funziona su qualunque dominio/anteprima
      Vercel senza doverlo scrivere a mano).

   2) SFV_ADMIN_TOKEN
      La password dell'area amministratore. DEVE essere identica
      alla variabile ADMIN_TOKEN già impostata su questo progetto
      Vercel (Settings → Environment Variables).
   ============================================================ */

window.SFV_API_BASE    = window.location.origin;
window.SFV_ADMIN_TOKEN = 'Rudy26061976+';
