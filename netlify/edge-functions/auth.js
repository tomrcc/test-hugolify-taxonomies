// Netlify Edge Function pour protéger l'accès avec un token stocké dans Google Sheets

export default async function handler(request, context) {
  const url = new URL(request.url);
  
  // ⚠️ Bypass pour les fichiers statiques
  if (url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
    return context.next();
  }

  const token = url.searchParams.get("token");

  // Récupération des variables d'environnement (Edge = Deno.env.get)
  const SHEET_ID = Deno.env.get("GOOGLE_SHEET_ID");
  const SHEET_RANGE = "Tokens!A:A"; // feuille "Tokens", colonne A
  const API_KEY = Deno.env.get("GOOGLE_API_KEY");

  // Construire l'URL vers l'API Google Sheets
  const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}?key=${API_KEY}`;

  let allowedTokens = [];
  try {
    const res = await fetch(sheetUrl);
    if (res.ok) {
      const data = await res.json();
      allowedTokens = (data.values || []).map(row => row[0].trim());
    } else {
      console.error("Erreur Google Sheets:", res.status, res.statusText);
    }
  } catch (err) {
    console.error("Erreur fetch Google Sheets:", err);
  }

  // Vérification du token
  if (!token || !allowedTokens.includes(token)) {
    return new Response("Accès refusé", { status: 403 });
  }

  // Autoriser l'accès
  return context.next();
}
