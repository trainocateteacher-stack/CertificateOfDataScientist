// Cloudflare Pages Function: /api/records
// Stores student records in memory (and optionally Cloudflare KV if bound as DS_KV)
const memoryStore = globalThis.__DS_CLASS_STORE__ || (globalThis.__DS_CLASS_STORE__ = {});

export async function onRequestGet(context) {
  try {
    if (context.env && context.env.DS_KV) {
      const saved = await context.env.DS_KV.get("class_records", { type: "json" });
      if (saved) Object.assign(memoryStore, saved);
    }
  } catch (e) {}
  return new Response(JSON.stringify(memoryStore), {
    headers: { "Content-Type": "application/json;charset=utf-8", "Cache-Control": "no-store" }
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    if (body && body.name) {
      memoryStore[body.name] = body;
      if (context.env && context.env.DS_KV) {
        await context.env.DS_KV.put("class_records", JSON.stringify(memoryStore));
      }
    }
    return new Response(JSON.stringify({ ok: true, count: Object.keys(memoryStore).length }), {
      headers: { "Content-Type": "application/json;charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 400 });
  }
}
