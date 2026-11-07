/*!
 * sg-track.js — Starknet Gaming off-chain reach counter
 * ─────────────────────────────────────────────────────────────────────
 * Counts one anonymous visit when someone opens your game page, so your
 * off-chain reach can be shown next to your onchain wallets.
 *
 * Install:
 *   <script async src="https://starknet-gaming.com/sg-track.js"
 *           data-game="your-game-slug"></script>
 *
 * SENDS:  game slug · random session id (new every visit) · hour-rounded
 *         timestamp · referrer DOMAIN only
 * NEVER:  cookies · localStorage · IP retention · wallet addresses ·
 *         full URLs · query strings · user agent strings · fingerprinting
 *
 * Read it before you ship it. ~1.2 KB minified.
 */
(function () {
  "use strict";

  var s = document.currentScript;
  if (!s) return;
  var game = s.getAttribute("data-game");
  if (!game) return console.warn("[sg-track] missing data-game");

  var ENDPOINT = s.getAttribute("data-endpoint") ||
                 "https://starknet-gaming.com/api/track";

  // Respect the browser's opt-out signal.
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;

  /* Session id: random per page load, held in memory only.
     Not persisted anywhere, so it cannot follow anyone between visits. */
  var sid = (crypto.randomUUID ? crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).slice(2, 12));

  /* Referrer: domain only. Never the path or query string. */
  var ref = "";
  try { if (document.referrer) ref = new URL(document.referrer).hostname; } catch (e) {}

  /* Timestamp rounded down to the hour — enough for weekly rollups,
     too coarse to single anyone out. */
  var hour = new Date(); hour.setMinutes(0, 0, 0);

  function post(path, payload) {
    var body = JSON.stringify(payload);
    var url = ENDPOINT + path;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", body: body, keepalive: true,
                   headers: { "Content-Type": "application/json" } }).catch(function () {});
    }
  }

  // one event per page load
  post("/visit", { game: game, session: sid, hour: hour.toISOString(), referrer: ref });

  /* Optional conversion linking.
     Call ONLY after the player has agreed to it in your own UI.
     Without consent:true the server drops the request. */
  window.sgTrack = {
    sessionId: sid,
    linkWallet: function (opts) {
      opts = opts || {};
      if (opts.consent !== true) {
        console.warn("[sg-track] linkWallet ignored: consent must be explicitly true");
        return false;
      }
      if (!opts.address) return false;
      post("/link", { game: game, session: sid, address: opts.address, consent: true });
      return true;
    }
  };
})();


/* ═══════════════════════════════════════════════════════════════════
   RECEIVING ENDPOINT — deploy as a Supabase Edge Function,
   Cloudflare Worker, or any serverless handler at /api/track/*
   ═══════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";
const db = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_KEY"));
const PEPPER = Deno.env.get("ADDRESS_PEPPER");   // rotate this, never commit it

const CORS = { "access-control-allow-origin": "*",
               "access-control-allow-headers": "content-type",
               "access-control-allow-methods": "POST,OPTIONS" };

async function sha256(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const path = new URL(req.url).pathname;
  const body = await req.json().catch(() => null);
  if (!body?.game || !body?.session) return json({ error: "bad request" }, 400);

  // Rate limit on a HASHED ip, which is discarded immediately after the check.
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "";
  const ipKey = await sha256(ip + PEPPER);
  if (await overLimit(ipKey)) return json({ ok: true }, 200);   // silently drop

  const { data: game } = await db.from("games")
    .select("id").eq("slug", body.game).eq("active", true).single();
  if (!game) return json({ error: "unknown game" }, 404);

  if (path.endsWith("/visit")) {
    const hour = new Date(body.hour ?? Date.now());
    hour.setMinutes(0, 0, 0);
    await db.from("session_events").insert({
      game_id: game.id,
      session_id: String(body.session).slice(0, 64),
      referrer_domain: typeof body.referrer === "string" ? body.referrer.slice(0, 120) : null,
      occurred_hour: hour.toISOString()
    });
    return json({ ok: true });
  }

  if (path.endsWith("/link")) {
    // Hard gate: no consent flag, no row. Ever.
    if (body.consent !== true) return json({ error: "consent required" }, 403);
    if (!/^0x[0-9a-fA-F]{10,66}$/.test(body.address ?? "")) return json({ error: "bad address" }, 400);
    await db.from("session_wallet_links").upsert({
      session_id: String(body.session).slice(0, 64),
      game_id: game.id,
      address_hash: await sha256(body.address.toLowerCase() + PEPPER),  // raw address never stored
      consent: true
    });
    return json({ ok: true });
  }
  return json({ error: "not found" }, 404);
});

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "content-type": "application/json" } });

═══════════════════════════════════════════════════════════════════ */
