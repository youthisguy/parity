import { NextRequest, NextResponse } from "next/server";
import { bitgetRequest } from "@/lib/bitget-auth";
import { Z_THRESHOLD, SPOT_FEE, PERP_TAKER_FEE, SLIPPAGE_RTOKEN, SLIPPAGE_PERP } from "@/lib/constants";

const MIN_EDGE = 0.003; // only execute if expected net edge > 0.3%
const POSITION_USDT = 20; 

export async function POST(req: NextRequest) {
  try {
    const { symbol, spreads, prices } = await req.json();

    const z = Math.max(
      Math.abs(spreads.rtoken_vs_mark?.z ?? 0),
      Math.abs(spreads.rtoken_vs_index?.z ?? 0)
    );

    if (z > 100) {
      return NextResponse.json({ 
        executed: false, 
        reason: "implausible z-score — data feed error, refusing to execute" 
      });
    }

    const grossEdge = Math.abs(spreads.rtoken_vs_mark?.spread ?? 0);
    const costs     = (SPOT_FEE + SLIPPAGE_RTOKEN) * 2 + (PERP_TAKER_FEE + SLIPPAGE_PERP) * 2;
    const netEdge   = grossEdge - costs;

    if (z < Z_THRESHOLD || netEdge < MIN_EDGE) {
      return NextResponse.json({
        executed: false,
        reason: `edge too small (z=${z.toFixed(2)}, net=${(netEdge*100).toFixed(3)}%)`,
      });
    }

    const rtokenSymbol = symbol.replace("USDT", "") === "TSLA"
      ? "RTSLAUSDT" : `R${symbol}`; // map perp → rToken spot symbol

    const qty = (POSITION_USDT / prices.rtoken).toFixed(4);

    // Long rToken spot
    const spotOrder = await bitgetRequest("POST", "/api/v2/spot/trade/place-order", {
      symbol:    rtokenSymbol,
      side:      "buy",
      orderType: "limit",
      price:     prices.rtoken.toFixed(2),
      size:      qty,
      force:     "gtc",
    });

    // Short perp
    const perpOrder = await bitgetRequest("POST", "/api/v2/mix/order/place-order", {
      symbol,
      productType: "USDT-FUTURES",
      marginMode:  "isolated",
      marginCoin:  "USDT",
      side:        "sell",    
      orderType:   "limit",
      price:       prices.perp_mark.toFixed(2),
      size:        qty,
      tradeSide:   "open",
    });

    return NextResponse.json({
      executed: true,
      symbol,
      z,
      net_edge: netEdge,
      spot_order:  spotOrder,
      perp_order:  perpOrder,
    });

  } catch (err) {
    console.error("[execute_trade]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}