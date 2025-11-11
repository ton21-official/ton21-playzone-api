export default {
  async fetch(request, env) {
    const { pathname, searchParams } = new URL(request.url);

    // === 0. Получаем адрес кошелька ===
    const wallet = searchParams.get("wallet");

    if (!wallet || wallet.trim() === "") {
      return new Response(JSON.stringify({ error: "wallet required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // === 1. Загружаем state по кошельку ===
    let stateRaw = await env.T21_STATE.get(wallet);
    let state = stateRaw
      ? JSON.parse(stateRaw)
      : {
          balance: 0,
          plays: 0,
          limit: 100
        };

    // === 2. /state ===
    if (pathname === "/state") {
      return new Response(JSON.stringify(state), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // === 3. /ad/amount-X ===
    if (pathname.startsWith("/ad/amount-")) {
      let amount = parseInt(pathname.split("-")[1] || "0");

      if (!Number.isFinite(amount)) amount = 0;

      state.balance += amount;

      await env.T21_STATE.put(wallet, JSON.stringify(state));

      return new Response(JSON.stringify({
        balance: state.balance,
        plays: state.plays,
        limit: state.limit
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // === 4. /play/number-X ===
    if (pathname.startsWith("/play/number-")) {
      let guess = parseInt(pathname.split("-")[1] || "0");

      // проверка лимита
      if (state.plays >= state.limit) {
        return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // увеличиваем количество игр
      state.plays++;

      // рандомное число от 1 до 9
      const winning = Math.floor(Math.random() * 9) + 1;

      // шанс на выигрыш
      const win = guess === winning;
      const reward = win ? 100 : 0;

      if (win) {
        state.balance += reward;
      }

      // сохранить
      await env.T21_STATE.put(wallet, JSON.stringify(state));

      return new Response(JSON.stringify({
        win,
        reward,
        guess,
        winning,
        balance: state.balance,
        plays: state.plays,
        limit: state.limit
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // === 5. Корень "/" — показать описание API ===
    if (pathname === "/") {
      return new Response(
        JSON.stringify({
          api: "T21 Playzone API",
          version: "1.0",
          endpoints: [
            "/state?wallet=YOUR_WALLET",
            "/ad/amount-100?wallet=YOUR_WALLET",
            "/play/number-5?wallet=YOUR_WALLET"
          ]
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // === 6. 404 ===
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
