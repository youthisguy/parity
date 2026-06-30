import { NextRequest, NextResponse } from "next/server";
import { bitgetRequest, PERP_TO_RTOKEN } from "@/lib/bitget-auth";

export async function POST(req: NextRequest) {
  try {
    const { symbol, prices } = await req.json();

    const rtokenSymbol = PERP_TO_RTOKEN[symbol];
    if (!rtokenSymbol) {
      return NextResponse.json({ error: "unknown symbol mapping" }, { status: 400 });
    }

    // ── Get open spot position (rToken balance)  
    const spotBalance = await bitgetRequest("GET", `/api/v2/spot/account/assets?coin=${rtokenSymbol.replace("USDT", "")}`);
    const qty = spotBalance?.data?.[0]?.available;

    if (!qty || parseFloat(qty) <= 0) {
      return NextResponse.json({ closed: false, reason: "no open rToken position found" });
    }

    // ── Close spot leg: sell rToken  
    const closeSpot = await bitgetRequest("POST", "/api/v2/spot/trade/place-order", {
      symbol:    rtokenSymbol,
      side:      "sell",
      orderType: "limit",
      price:     prices.rtoken.toFixed(2),
      size:      qty,
      force:     "gtc",
    });

    // ── Close perp leg: buy to close short  
    const closePerp = await bitgetRequest("POST", "/api/v2/mix/order/place-order", {
      symbol,
      productType: "USDT-FUTURES",
      marginMode:  "isolated",
      marginCoin:  "USDT",
      side:        "buy",
      tradeSide:   "close",
      orderType:   "limit",
      price:       prices.perp_mark.toFixed(2),
      size:        qty,
    });

    return NextResponse.json({
      closed: true,
      symbol,
      close_spot:  closeSpot,
      close_perp:  closePerp,
    });

  } catch (err) {
    console.error("[close_trade]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}