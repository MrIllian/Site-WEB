import http from "node:http";
import https from "node:https";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Backend minimal (zéro dépendance) pour le vrai flux OAuth2 Discord.
 *
 * Pourquoi un serveur est obligatoire : Discord n'autorise pas l'échange
 * "code -> token" directement depuis le navigateur (le endpoint token
 * n'envoie pas d'en-têtes CORS pour ça), et de toute façon le
 * client_secret ne doit JAMAIS être exposé côté client. Ce serveur fait
 * cet échange, récupère le profil Discord, puis pose un cookie de session
 * signé (HMAC) que le front lit via GET /api/auth/me.
 *
 * Sert aussi les fichiers statiques du site (même origine = pas de CORS,
 * cookies simples en SameSite=Lax).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Node ne lit pas les fichiers .env tout seul : on le fait à la main,
// sans dépendance externe. Les variables déjà présentes dans
// l'environnement (ex: définies par systemd/pm2) restent prioritaires.
function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile();

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const IS_PROD = process.env.NODE_ENV === "production";

// Optionnelles : la connexion Discord marche sans, seules les routes
// /api/servers/* renverront "bot_api_unavailable" tant qu'elles ne sont
// pas configurées (le bot Beep tourne à côté, sur le même VPS).
const BOT_API_URL = process.env.BOT_API_URL || "http://127.0.0.1:8787";
const BOT_API_SECRET = process.env.BOT_API_SECRET;

for (const [name, value] of Object.entries({
  DISCORD_CLIENT_ID: CLIENT_ID,
  DISCORD_CLIENT_SECRET: CLIENT_SECRET,
  DISCORD_REDIRECT_URI: REDIRECT_URI,
  SESSION_SECRET: SESSION_SECRET,
})) {
  if (!value) {
    console.error(`Variable d'environnement manquante : ${name}. Copiez .env.example vers .env et complétez-le.`);
    process.exit(1);
  }
}

const SESSION_COOKIE = "beep_session";
const STATE_COOKIE = "beep_oauth_state";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours, en secondes
const ADMINISTRATOR = 0x8n;
const MANAGE_GUILD = 0x20n;

// ---------------------------------------------------------------------
// Cookies signés (HMAC-SHA256) — pas de base de données de sessions.
// ---------------------------------------------------------------------

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function unsign(token) {
  try {
    if (!token) return null;
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function setCookie(res, name, value, { maxAge } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (IS_PROD) parts.push("Secure");
  if (maxAge != null) parts.push(`Max-Age=${maxAge}`);
  const existing = res.getHeader("Set-Cookie");
  const next = existing ? [...(Array.isArray(existing) ? existing : [existing]), parts.join("; ")] : [parts.join("; ")];
  res.setHeader("Set-Cookie", next);
}

function clearCookie(res, name) {
  setCookie(res, name, "", { maxAge: 0 });
}

// ---------------------------------------------------------------------
// Appels API Discord (module https natif, pas de dépendance fetch/axios)
// ---------------------------------------------------------------------

function requestJson(client, { method, hostname, port, path: reqPath, headers }, body) {
  return new Promise((resolve, reject) => {
    const req = client.request({ method, hostname, port, path: reqPath, headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, json: data ? JSON.parse(data) : null });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  }).toString();
  const { status, json } = await requestJson(
    https,
    {
      method: "POST",
      hostname: "discord.com",
      path: "/api/oauth2/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body
  );
  if (status !== 200) throw new Error("Échange du code Discord échoué : " + JSON.stringify(json));
  return json; // { access_token, token_type, expires_in, refresh_token, scope }
}

async function fetchDiscordUser(accessToken) {
  const { status, json } = await requestJson(https, {
    method: "GET",
    hostname: "discord.com",
    path: "/api/users/@me",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (status !== 200) throw new Error("Impossible de récupérer le profil Discord : " + JSON.stringify(json));
  return json;
}

async function fetchDiscordGuilds(accessToken) {
  const { status, json } = await requestJson(https, {
    method: "GET",
    hostname: "discord.com",
    path: "/api/users/@me/guilds",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return status === 200 && Array.isArray(json) ? json : [];
}

function avatarUrl(discordUser) {
  if (!discordUser.avatar) return null;
  const ext = discordUser.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${ext}?size=128`;
}

function isAdminGuild(guild) {
  const perms = BigInt(guild.permissions || 0);
  return (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;
}

// ---------------------------------------------------------------------
// API interne du bot Beep (même VPS, 127.0.0.1 uniquement). Le contrôle
// "cette personne est admin de ce serveur Discord" se fait ICI, avec la
// vraie session Discord OAuth, avant d'appeler le bot — voir
// server/index.js côté bot (Beep/bot.py) pour le reste de la confiance.
// ---------------------------------------------------------------------

async function callBotApi(method, botPath, body) {
  if (!BOT_API_SECRET) {
    const err = new Error("BOT_API_SECRET non configuré");
    err.code = "BOT_API_NOT_CONFIGURED";
    throw err;
  }
  const target = new URL(botPath, BOT_API_URL);
  const payload = body ? JSON.stringify(body) : null;
  return requestJson(
    http,
    {
      method,
      hostname: target.hostname,
      port: target.port,
      path: target.pathname + target.search,
      headers: {
        "X-Internal-Secret": BOT_API_SECRET,
        ...(payload
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
          : {}),
      },
    },
    payload
  );
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function getSession(req) {
  const cookies = parseCookies(req);
  return unsign(cookies[SESSION_COOKIE]);
}

async function relayToBotApi(res, method, botPath, body) {
  try {
    const { status, json } = await callBotApi(method, botPath, body);
    res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(json));
  } catch (err) {
    console.error(err);
    res.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "bot_api_unavailable" }));
  }
}

// ---------------------------------------------------------------------
// Fichiers statiques (le front est en hash routing : le serveur ne voit
// jamais "/serveurs", seulement "/" — pas besoin de fallback SPA).
// ---------------------------------------------------------------------

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function serveStatic(req, res, pathname) {
  const relative = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(ROOT, relative));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" }).end(data);
  });
}

// ---------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------

async function handleLogin(req, res) {
  const state = crypto.randomBytes(16).toString("hex");
  setCookie(res, STATE_COOKIE, state, { maxAge: 600 });
  const authorizeUrl = new URL("https://discord.com/oauth2/authorize");
  authorizeUrl.searchParams.set("client_id", CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "identify guilds");
  authorizeUrl.searchParams.set("state", state);
  res.writeHead(302, { Location: authorizeUrl.toString() }).end();
}

async function handleCallback(req, res, url) {
  const cookies = parseCookies(req);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== cookies[STATE_COOKIE]) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" }).end("Requête OAuth invalide (state manquant ou incorrect).");
    return;
  }
  clearCookie(res, STATE_COOKIE);

  const token = await exchangeCodeForToken(code);
  const [discordUser, guilds] = await Promise.all([
    fetchDiscordUser(token.access_token),
    fetchDiscordGuilds(token.access_token),
  ]);

  const adminGuilds = guilds.filter(isAdminGuild).map((g) => ({ id: g.id, name: g.name }));
  const session = {
    id: discordUser.id,
    username: discordUser.global_name || discordUser.username,
    handle: discordUser.username,
    avatar: avatarUrl(discordUser),
    adminGuilds,
    adminGuildIds: adminGuilds.map((g) => g.id),
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  setCookie(res, SESSION_COOKIE, sign(session), { maxAge: SESSION_MAX_AGE });
  res.writeHead(302, { Location: "/" }).end();
}

function handleMe(req, res) {
  const cookies = parseCookies(req);
  const session = unsign(cookies[SESSION_COOKIE]);
  res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ user: session }));
}

function handleLogout(req, res) {
  clearCookie(res, SESSION_COOKIE);
  res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ success: true }));
}

function handleListServers(req, res) {
  return relayToBotApi(res, "GET", "/internal/servers");
}

function handleBotProfile(req, res) {
  return relayToBotApi(res, "GET", "/internal/bot-profile");
}

function handleGetServer(req, res, guildId) {
  const session = getSession(req);
  if (!session || !session.adminGuildIds.includes(guildId)) {
    res.writeHead(403, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "forbidden" }));
    return;
  }
  return relayToBotApi(res, "GET", `/internal/guilds/${guildId}/minecraft`);
}

async function handleUpdateServer(req, res, guildId) {
  const session = getSession(req);
  if (!session || !session.adminGuildIds.includes(guildId)) {
    res.writeHead(403, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "forbidden" }));
    return;
  }
  const body = await readJsonBody(req);
  return relayToBotApi(res, "PATCH", `/internal/guilds/${guildId}/minecraft`, body);
}

async function handleVote(req, res, guildId) {
  const session = getSession(req);
  if (!session) {
    res.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "unauthorized" }));
    return;
  }
  const body = await readJsonBody(req);
  const direction = [1, -1, 0].includes(body.direction) ? body.direction : 0;
  return relayToBotApi(res, "POST", `/internal/guilds/${guildId}/minecraft/vote`, {
    userId: session.id,
    direction,
  });
}

async function handleComment(req, res, guildId) {
  const session = getSession(req);
  if (!session) {
    res.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "unauthorized" }));
    return;
  }
  const body = await readJsonBody(req);
  return relayToBotApi(res, "POST", `/internal/guilds/${guildId}/minecraft/comments`, {
    userId: session.id,
    userName: session.username,
    body: body.body,
  });
}

const server = http.createServer((req, res) => {
  Promise.resolve()
    .then(async () => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname === "/api/auth/login") return handleLogin(req, res);
      if (url.pathname === "/api/auth/callback") return handleCallback(req, res, url);
      if (url.pathname === "/api/auth/me") return handleMe(req, res);
      if (url.pathname === "/api/auth/logout" && req.method === "POST") return handleLogout(req, res);

      if (url.pathname === "/api/bot-profile" && req.method === "GET") return handleBotProfile(req, res);

      if (url.pathname === "/api/servers" && req.method === "GET") return handleListServers(req, res);
      const detailMatch = url.pathname.match(/^\/api\/servers\/(\d+)$/);
      if (detailMatch && req.method === "GET") return handleGetServer(req, res, detailMatch[1]);
      if (detailMatch && req.method === "PATCH") return handleUpdateServer(req, res, detailMatch[1]);
      const voteMatch = url.pathname.match(/^\/api\/servers\/(\d+)\/vote$/);
      if (voteMatch && req.method === "POST") return handleVote(req, res, voteMatch[1]);
      const commentMatch = url.pathname.match(/^\/api\/servers\/(\d+)\/comments$/);
      if (commentMatch && req.method === "POST") return handleComment(req, res, commentMatch[1]);

      return serveStatic(req, res, url.pathname);
    })
    .catch((err) => {
      console.error(err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }).end("Erreur serveur.");
      }
    });
});

server.listen(PORT, () => {
  console.log(`Beep — serveur prêt sur http://localhost:${PORT}`);
});
