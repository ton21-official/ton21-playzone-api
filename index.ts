export interface Env {
    T21_STATE: KVNamespace; // KV хранилище
}

function json(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

export default {
    async fetch(req: Request, env: Env): Promise<Response> {
        const url = new URL(req.url);

        // === GET /state — получить баланс игрока ===
        if (url.pathname === "/state") {
            const wallet = url.searchParams.get("wallet");
            if (!wallet) return json({ error: "wallet missing" }, 400);

            const key = `user:${wallet}`;
            const data = await env.T21_STATE.get(key, { type: "json" });

            return json(data || { t21: 0, last: 0 });
        }

        // === POST /win — сохранить выигрыш ===
        if (url.pathname === "/win" && req.method === "POST") {
            const body = await req.json();
            const wallet = body.wallet;
            const amount = Number(body.amount || 0);

            if (!wallet || amount <= 0)
                return json({ error: "bad request" }, 400);

            const key = `user:${wallet}`;
            const old = (await env.T21_STATE.get(key, { type: "json" })) || {
                t21: 0,
                last: 0
            };

            const updated = {
                t21: old.t21 + amount,
                last: Date.now()
            };

            await env.T21_STATE.put(key, JSON.stringify(updated));

            return json({ ok: true, new_balance: updated.t21 });
        }

        // === POST /reset — сбросить баланс после payout ===
        if (url.pathname === "/reset" && req.method === "POST") {
            const body = await req.json();
            const wallet = body.wallet;

            if (!wallet) return json({ error: "wallet missing" }, 400);

            const key = `user:${wallet}`;
            await env.T21_STATE.put(
                key,
                JSON.stringify({ t21: 0, last: Date.now() })
            );

            return json({ ok: true });
        }

        return json({ error: "Not found" }, 404);
    }
};
