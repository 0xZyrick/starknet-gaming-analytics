/**
 * rpc-check.mjs — verify a Starknet RPC provider before using it for backfill.
 * Run:  STARKNET_RPC_URL=https://... node rpc-check.mjs
 * Tests that the provider (1) answers JSON-RPC, (2) accepts batch requests,
 * (3) returns sender addresses, and (4) shows the largest batch size it
 * accepts, so you can set STARKNET_RPC_BATCH.
 */
async function main() {
const URL_ = process.env.STARKNET_RPC_URL;
if (!URL_) { console.error("Set STARKNET_RPC_URL first."); process.exitCode = 1; return; }

const KEY = process.env.STARKSCAN_API_KEY;
const headers = { "Content-Type": "application/json", ...(/starkscan\.co\//.test(URL_) && KEY ? { "X-Starkscan-Api-Key": KEY } : {}) };
const post = async body => {
  const t0 = Date.now();
  const r = await fetch(URL_, { method: "POST", headers, body: JSON.stringify(body) });
  const rl = ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"].map(h => r.headers.get(h) ? `${h}=${r.headers.get(h)}` : "").filter(Boolean).join(" ");
  if (rl) console.log(`  [${rl}]`);
  const text = await r.text();
  let j = null; try { j = JSON.parse(text); } catch {}
  return { status: r.status, json: j, ms: Date.now() - t0, text };
};

// Hashes to test with: pass one or more as arguments (copy any from starkscan.co), or we try the latest block.
let hashes = process.argv.slice(2).filter(a => /^0x[0-9a-fA-F]+$/.test(a));
if (!hashes.length) {
  const blk = await post({ jsonrpc: "2.0", id: 1, method: "starknet_getBlockWithTxHashes", params: { block_id: "latest" } });
  hashes = blk.json?.result?.transactions || [];
  if (!hashes.length) {
    console.error("✗ could not read the latest block:", blk.status, blk.text.slice(0, 200));
    if (blk.status === 401) console.error(`  → 401 means the API key wasn't accepted. STARKSCAN_API_KEY is ${KEY ? "set (length " + KEY.length + ")" : "NOT set in this window"}.`);
    console.error("  → Some providers don't serve block methods. Retry with a transaction hash:  node rpc-check.mjs 0x<tx hash>");
    process.exitCode = 1; return;
  }
  console.log(`✓ RPC answers (latest block has ${hashes.length} txs)`);
}
const mk = n => Array.from({ length: n }, (_, i) => ({
  jsonrpc: "2.0", id: i, method: "starknet_getTransactionByHash",
  params: { transaction_hash: hashes[i % hashes.length] }
}));

for (const n of [10, 25, 50, 100, 200]) {
  const r = await post(mk(n));
  const ok = Array.isArray(r.json) ? r.json.filter(x => x.result).length : 0;
  const withSender = Array.isArray(r.json) ? r.json.filter(x => x.result?.sender_address).length : 0;
  console.log(`  batch of ${String(n).padStart(3)}: HTTP ${r.status}, ${ok}/${n} answered, ${withSender} with sender_address, ${r.ms}ms`);
  if (ok < n) { console.log(`  → stop here: use STARKNET_RPC_BATCH below ${n}`); break; }
}

}
main();
