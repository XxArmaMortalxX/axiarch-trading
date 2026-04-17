import { calcEMA, calcRSI, calcMACD, calcATR, calcBollingerBands } from './indicators';

// ============================================================
// GROWTH MODE — Mid-to-Long-Term Scoring Engine
// Target holding period: 1+ year
// ============================================================

// --- Fundamental Quality Score (0-100) ---
// Uses Finnhub /stock/metric data
export function calcFundamentalScore(metrics) {
  if (!metrics || !metrics.metric) return null;
  const m = metrics.metric;
  let score = 0;
  let factors = 0;

  // Revenue growth (QoQ and YoY)
  if (m.revenueGrowthQuarterlyYoy != null) {
    factors++;
    const rg = m.revenueGrowthQuarterlyYoy;
    if (rg > 50) score += 25;
    else if (rg > 30) score += 22;
    else if (rg > 20) score += 18;
    else if (rg > 10) score += 14;
    else if (rg > 0) score += 8;
    else score += 2; // negative growth
  }

  // EPS growth
  if (m.epsGrowthQuarterlyYoy != null) {
    factors++;
    const eg = m.epsGrowthQuarterlyYoy;
    if (eg > 50) score += 20;
    else if (eg > 25) score += 16;
    else if (eg > 10) score += 12;
    else if (eg > 0) score += 8;
    else score += 2;
  }

  // Gross margin
  if (m.grossMarginTTM != null) {
    factors++;
    const gm = m.grossMarginTTM * 100; // convert to %
    if (gm > 70) score += 15;
    else if (gm > 50) score += 12;
    else if (gm > 30) score += 8;
    else if (gm > 15) score += 5;
    else score += 2;
  }

  // Operating margin
  if (m.operatingMarginTTM != null) {
    factors++;
    const om = m.operatingMarginTTM * 100;
    if (om > 30) score += 15;
    else if (om > 20) score += 12;
    else if (om > 10) score += 9;
    else if (om > 0) score += 5;
    else score += 1; // unprofitable
  }

  // ROE
  if (m.roeTTM != null) {
    factors++;
    const roe = m.roeTTM * 100;
    if (roe > 30) score += 15;
    else if (roe > 20) score += 12;
    else if (roe > 15) score += 9;
    else if (roe > 5) score += 5;
    else score += 1;
  }

  // Free cash flow margin (approximated from net margin if FCF unavailable)
  if (m.fcfMarginTTM != null) {
    factors++;
    const fcf = m.fcfMarginTTM * 100;
    if (fcf > 25) score += 10;
    else if (fcf > 15) score += 8;
    else if (fcf > 5) score += 5;
    else if (fcf > 0) score += 3;
    else score += 0;
  } else if (m.netProfitMarginTTM != null) {
    factors++;
    const npm = m.netProfitMarginTTM * 100;
    if (npm > 20) score += 8;
    else if (npm > 10) score += 6;
    else if (npm > 0) score += 3;
    else score += 0;
  }

  if (factors === 0) return null;
  // Normalize to 0-100 based on max possible score for the factors we had
  const maxPossible = factors <= 3 ? factors * 25 : 100;
  return Math.min(100, Math.round((score / maxPossible) * 100));
}

// --- Valuation Score (0-100) ---
// Lower valuation relative to growth = higher score
export function calcValuationScore(metrics, earningsData) {
  if (!metrics || !metrics.metric) return null;
  const m = metrics.metric;
  let score = 0;
  let factors = 0;

  // P/E ratio — favor reasonable P/E
  if (m.peTTM != null && m.peTTM > 0) {
    factors++;
    const pe = m.peTTM;
    if (pe < 15) score += 25;        // deep value
    else if (pe < 25) score += 20;    // reasonable
    else if (pe < 40) score += 14;    // growth premium
    else if (pe < 60) score += 8;     // expensive
    else if (pe < 100) score += 4;    // very expensive
    else score += 1;                  // speculative
  }

  // P/S ratio
  if (m.psTTM != null && m.psTTM > 0) {
    factors++;
    const ps = m.psTTM;
    if (ps < 2) score += 25;
    else if (ps < 5) score += 20;
    else if (ps < 10) score += 14;
    else if (ps < 20) score += 8;
    else score += 2;
  }

  // PEG ratio — the holy grail for growth investors
  if (m.pegRatio != null && m.pegRatio > 0) {
    factors++;
    const peg = m.pegRatio;
    if (peg < 0.5) score += 25;       // extremely undervalued for growth
    else if (peg < 1.0) score += 22;   // undervalued (PEG < 1 = Peter Lynch territory)
    else if (peg < 1.5) score += 16;   // fair
    else if (peg < 2.0) score += 10;   // slightly overvalued
    else if (peg < 3.0) score += 5;
    else score += 1;
  }

  // Price to Book
  if (m.pbTTM != null && m.pbTTM > 0) {
    factors++;
    const pb = m.pbTTM;
    if (pb < 2) score += 20;
    else if (pb < 5) score += 15;
    else if (pb < 10) score += 10;
    else if (pb < 20) score += 5;
    else score += 1;
  }

  // Earnings surprise history — consistent beats = quality
  if (earningsData && earningsData.length >= 4) {
    factors++;
    const beats = earningsData.filter(e => e.actual > e.estimate).length;
    const beatRate = beats / earningsData.length;
    if (beatRate >= 0.875) score += 15;      // 7/8 or 8/8 beats
    else if (beatRate >= 0.75) score += 12;   // 6/8
    else if (beatRate >= 0.5) score += 8;
    else score += 2;
  }

  if (factors === 0) return null;
  const maxPossible = factors <= 3 ? factors * 25 : 100;
  return Math.min(100, Math.round((score / maxPossible) * 100));
}

// --- Long-Term Trend Score (0-100) ---
// Uses 50/200 EMA, weekly RSI, long-term MACD
export function calcTrendScore(quote, candles) {
  if (!candles || !candles.c || candles.c.length < 50) return null;
  const closes = candles.c;
  const price = quote.c || closes[closes.length - 1];
  let score = 0;

  // 50/200 EMA alignment (golden cross vs death cross)
  const ema50 = calcEMA(closes, 50);
  const ema200 = closes.length >= 200 ? calcEMA(closes, 200) : null;

  if (ema50 && ema200) {
    if (price > ema50 && ema50 > ema200) score += 30;       // full bullish: price > 50 > 200
    else if (price > ema200 && ema50 > ema200) score += 25;  // above 200, golden cross
    else if (price > ema200) score += 18;                     // above 200 at least
    else if (ema50 > ema200) score += 12;                     // golden cross but price dipping
    else if (price > ema50) score += 8;                       // above 50 but death cross
    else score += 3;                                          // full bearish
  } else if (ema50) {
    // Less than 200 days of data, use 50 EMA only
    if (price > ema50 * 1.05) score += 25;
    else if (price > ema50) score += 18;
    else if (price > ema50 * 0.95) score += 10;
    else score += 4;
  }

  // Distance from 52-week high (approximated from available data)
  const high52 = Math.max(...closes);
  const distFromHigh = ((price - high52) / high52) * 100;
  if (distFromHigh > -5) score += 20;         // within 5% of high — strength
  else if (distFromHigh > -15) score += 16;    // minor pullback
  else if (distFromHigh > -25) score += 12;    // correction territory
  else if (distFromHigh > -40) score += 6;     // bear territory
  else score += 2;                              // deep drawdown

  // RSI — for growth, 45-65 is healthy uptrend, not overbought
  const rsi = calcRSI(closes) || 50;
  if (rsi >= 45 && rsi <= 65) score += 20;       // ideal trending range
  else if (rsi >= 35 && rsi < 45) score += 16;   // pullback in uptrend = opportunity
  else if (rsi > 65 && rsi <= 75) score += 14;   // strong but getting hot
  else if (rsi < 35) score += 10;                 // oversold = potential opportunity
  else score += 5;                                 // overbought > 75

  // MACD trend direction on longer timeframe
  const macd = calcMACD(closes);
  if (macd) {
    if (macd.histogram > 0 && macd.macd > 0) score += 15;       // strong bullish momentum
    else if (macd.histogram > 0) score += 12;                     // momentum turning up
    else if (macd.macd > 0 && macd.histogram < 0) score += 8;    // still positive but fading
    else score += 3;
  }

  // Long-term price trend (3-month and 6-month returns)
  if (closes.length >= 63) { // ~3 months
    const ret3m = ((price - closes[closes.length - 63]) / closes[closes.length - 63]) * 100;
    if (ret3m > 20) score += 15;
    else if (ret3m > 10) score += 12;
    else if (ret3m > 0) score += 8;
    else if (ret3m > -10) score += 4;
    else score += 1;
  }

  return Math.min(100, score);
}

// --- Institutional/Analyst Score (0-100) ---
// Uses Finnhub recommendation data
export function calcAnalystScore(recommendations) {
  if (!recommendations || recommendations.length === 0) return null;

  // Use most recent recommendation summary
  const latest = recommendations[0];
  const total = (latest.buy || 0) + (latest.hold || 0) + (latest.sell || 0) +
                (latest.strongBuy || 0) + (latest.strongSell || 0);
  if (total === 0) return null;

  const bullish = (latest.strongBuy || 0) * 2 + (latest.buy || 0) * 1.5;
  const neutral = (latest.hold || 0) * 1;
  const bearish = (latest.sell || 0) * 0.5 + (latest.strongSell || 0) * 0;

  const weightedScore = (bullish + neutral + bearish) / total;
  // weightedScore ranges roughly 0.0 to 2.0 — normalize to 0-100
  const normalized = Math.round((weightedScore / 2) * 100);

  // Bonus for consensus strength
  const buyPct = ((latest.strongBuy || 0) + (latest.buy || 0)) / total;
  let consensusBonus = 0;
  if (buyPct > 0.8) consensusBonus = 10;
  else if (buyPct > 0.6) consensusBonus = 5;

  return Math.min(100, normalized + consensusBonus);
}

// --- Earnings Quality Score (0-100) ---
export function calcEarningsScore(earningsData) {
  if (!earningsData || earningsData.length < 2) return null;
  let score = 0;

  // Consistent beats
  const beats = earningsData.filter(e => e.actual != null && e.estimate != null && e.actual > e.estimate);
  const beatRate = beats.length / earningsData.length;
  if (beatRate >= 0.875) score += 35;
  else if (beatRate >= 0.75) score += 28;
  else if (beatRate >= 0.5) score += 18;
  else score += 5;

  // Average surprise magnitude
  const surprises = earningsData
    .filter(e => e.actual != null && e.estimate != null && e.estimate !== 0)
    .map(e => ((e.actual - e.estimate) / Math.abs(e.estimate)) * 100);
  if (surprises.length > 0) {
    const avgSurprise = surprises.reduce((a, b) => a + b, 0) / surprises.length;
    if (avgSurprise > 20) score += 30;
    else if (avgSurprise > 10) score += 25;
    else if (avgSurprise > 5) score += 18;
    else if (avgSurprise > 0) score += 12;
    else score += 3;
  }

  // EPS trend — is earnings growing quarter over quarter?
  const actuals = earningsData.filter(e => e.actual != null).map(e => e.actual).reverse(); // oldest first
  if (actuals.length >= 3) {
    let growingQuarters = 0;
    for (let i = 1; i < actuals.length; i++) {
      if (actuals[i] > actuals[i - 1]) growingQuarters++;
    }
    const growthRate = growingQuarters / (actuals.length - 1);
    if (growthRate >= 0.8) score += 35;
    else if (growthRate >= 0.6) score += 25;
    else if (growthRate >= 0.4) score += 15;
    else score += 5;
  }

  return Math.min(100, score);
}

// ============================================================
// COMPOSITE GROWTH SCORE (0-100)
// Weights: Fundamentals 30%, Valuation 20%, Trend 25%,
//          Analyst 10%, Earnings Quality 15%
// ============================================================
export function growthScore(quote, candles, fundamentalData) {
  const {
    metrics = null,
    earnings = null,
    recommendations = null,
  } = fundamentalData || {};

  const fundScore = calcFundamentalScore(metrics);
  const valScore = calcValuationScore(metrics, earnings);
  const trendSc = calcTrendScore(quote, candles);
  const analystSc = calcAnalystScore(recommendations);
  const earnSc = calcEarningsScore(earnings);

  // If we have no data at all, fall back to a basic trend-only score
  const scores = [
    { val: fundScore, weight: 0.30 },
    { val: valScore, weight: 0.20 },
    { val: trendSc, weight: 0.25 },
    { val: analystSc, weight: 0.10 },
    { val: earnSc, weight: 0.15 },
  ];

  // Redistribute weight from null scores proportionally
  const available = scores.filter(s => s.val !== null);
  if (available.length === 0) return 50; // no data = neutral

  const totalWeight = available.reduce((sum, s) => sum + s.weight, 0);
  const composite = available.reduce((sum, s) => sum + s.val * (s.weight / totalWeight), 0);

  return Math.max(10, Math.min(99, Math.round(composite)));
}

// ============================================================
// GROWTH SIGNAL GENERATION
// Instead of BUY/SELL scalp signals, generates:
// STRONG ACCUMULATE / ACCUMULATE / HOLD / TRIM / AVOID
// ============================================================
export function generateGrowthSignal(quote, candles, fundamentalData) {
  const score = growthScore(quote, candles, fundamentalData);
  const { metrics = null, earnings = null } = fundamentalData || {};

  const fundScore = calcFundamentalScore(metrics);
  const valScore = calcValuationScore(metrics, earnings);
  const trendSc = calcTrendScore(quote, candles);

  // ATR for position sizing context (use longer period for growth)
  const price = quote.c;
  let atr = null;
  if (candles && candles.h && candles.c) {
    atr = calcATR(candles.h, candles.l, candles.c) || (price * 0.03);
  } else {
    atr = price * 0.03;
  }

  let signal, reasoning;

  if (score >= 80) {
    signal = 'STRONG ACCUMULATE';
    reasoning = 'High-quality growth with favorable valuation and strong trend';
  } else if (score >= 65) {
    signal = 'ACCUMULATE';
    reasoning = 'Solid growth characteristics — good candidate for building a position';
  } else if (score >= 45) {
    signal = 'HOLD';
    reasoning = 'Mixed signals — hold existing positions, wait for better entry on new';
  } else if (score >= 30) {
    signal = 'TRIM';
    reasoning = 'Weakening fundamentals or stretched valuation — consider reducing exposure';
  } else {
    signal = 'AVOID';
    reasoning = 'Poor growth profile or significant overvaluation';
  }

  // For growth mode, targets are based on 1-year expected move
  // Use a simple framework: ATR * sqrt(252) for annualized volatility estimate
  const annualizedVol = atr * Math.sqrt(252);
  const upside = +(price + annualizedVol * 0.8).toFixed(2);  // ~80% of 1-sigma move up
  const downside = +(price - annualizedVol * 0.5).toFixed(2); // risk management level

  return {
    signal,
    score,
    reasoning,
    entry: signal.includes('ACCUMULATE') ? +price.toFixed(2) : null,
    target1y: signal.includes('ACCUMULATE') ? upside : null,
    stopLoss: signal.includes('ACCUMULATE') ? downside : null,
    components: {
      fundamental: fundScore,
      valuation: valScore,
      trend: trendSc,
      earnings: calcEarningsScore(earnings),
      analyst: calcAnalystScore(fundamentalData?.recommendations),
    },
  };
}

// ============================================================
// GROWTH BIAS — BULLISH / NEUTRAL / BEARISH
// ============================================================
export function determineGrowthBias(quote, candles, fundamentalData) {
  const score = growthScore(quote, candles, fundamentalData);
  if (score >= 65) return 'BULLISH';
  if (score >= 40) return 'NEUTRAL';
  return 'BEARISH';
}

// ============================================================
// GROWTH SIGNAL CSS CLASS
// ============================================================
export function getGrowthSignalClass(sig) {
  const map = {
    'STRONG ACCUMULATE': 'signal-strong-buy',
    'ACCUMULATE': 'signal-buy',
    'HOLD': 'signal-hold',
    'TRIM': 'signal-sell',
    'AVOID': 'signal-strong-sell',
  };
  return map[sig] || 'signal-hold';
}
