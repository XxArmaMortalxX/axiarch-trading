export function calcSMA(data, period) {
  if (data.length < period) return null;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function calcEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calcRSI(closes, period) {
  period = period || 14;
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return +(100 - (100 / (1 + avgGain / avgLoss))).toFixed(1);
}

export function calcMACD(closes) {
  if (closes.length < 26) return null;
  let e12 = closes.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
  let e26 = closes.slice(0, 26).reduce((a, b) => a + b, 0) / 26;
  const k12 = 2 / 13, k26 = 2 / 27;
  const ema12Series = [], ema26Series = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < 12) { ema12Series.push(null); }
    else if (i === 12) { ema12Series.push(e12); }
    else { e12 = closes[i] * k12 + e12 * (1 - k12); ema12Series.push(e12); }
    if (i < 26) { ema26Series.push(null); }
    else if (i === 26) { ema26Series.push(e26); }
    else { e26 = closes[i] * k26 + e26 * (1 - k26); ema26Series.push(e26); }
  }
  const macdLine = [];
  for (let i = 26; i < closes.length; i++) {
    macdLine.push(ema12Series[i] - ema26Series[i]);
  }
  if (macdLine.length < 9) return { macd: macdLine[macdLine.length - 1] || 0, signal: 0, histogram: 0 };
  const k9 = 2 / 10;
  let sig = macdLine.slice(0, 9).reduce((a, b) => a + b, 0) / 9;
  for (let i = 9; i < macdLine.length; i++) {
    sig = macdLine[i] * k9 + sig * (1 - k9);
  }
  const latest = macdLine[macdLine.length - 1];
  return { macd: +latest.toFixed(4), signal: +sig.toFixed(4), histogram: +(latest - sig).toFixed(4) };
}

export function calcBollingerBands(closes, period, mult) {
  period = period || 20;
  mult = mult || 2;
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: +(sma + mult * stdDev).toFixed(4),
    middle: +sma.toFixed(4),
    lower: +(sma - mult * stdDev).toFixed(4),
    bandwidth: +((mult * 2 * stdDev) / sma * 100).toFixed(2)
  };
}

export function calcATR(highs, lows, closes, period) {
  period = period || 14;
  if (highs.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < highs.length; i++) {
    trs.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ));
  }
  if (trs.length < period) return null;
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return +atr.toFixed(4);
}

export function calcVWAP(highs, lows, closes, volumes) {
  let cumTPV = 0, cumVol = 0;
  for (let i = 0; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    cumTPV += tp * (volumes[i] || 0);
    cumVol += (volumes[i] || 0);
  }
  return cumVol > 0 ? +(cumTPV / cumVol).toFixed(4) : null;
}

export function calcRelativeVolume(volumes, period) {
  period = period || 20;
  if (volumes.length < period + 1) return null;
  const avg = volumes.slice(-(period + 1), -1).reduce((a, b) => a + b, 0) / period;
  return avg > 0 ? +(volumes[volumes.length - 1] / avg).toFixed(2) : null;
}

export function generateSignal(quote, candles, socialData) {
  const price = quote.c;
  if (!candles || !candles.c || candles.c.length < 15) {
    return { signal: 'HOLD', entry: null, stop: null, target: null, rr: null };
  }
  const closes = candles.c, highs = candles.h, lows = candles.l, volumes = candles.v;
  const rsi = calcRSI(closes) || 50;
  const ema9 = calcEMA(closes, 9);
  const ema21 = calcEMA(closes, 21);
  const atr = calcATR(highs, lows, closes) || (price * 0.03);
  const rvol = calcRelativeVolume(volumes) || 1;
  const vwap = calcVWAP(highs, lows, closes, volumes);
  const macd = calcMACD(closes);
  const changePct = quote.dp || 0;
  let bull = 0, bear = 0;

  // RSI — more granular scoring
  if (rsi < 25) bull += 3;        // deeply oversold = strong buy signal
  else if (rsi < 30) bull += 2;
  else if (rsi < 40) bull += 1;
  else if (rsi > 80) bear += 3;   // deeply overbought = strong sell
  else if (rsi > 70) bear += 2;
  else if (rsi > 60) bear += 1;

  // EMA alignment
  if (ema9 && ema21) {
    if (price > ema9 && ema9 > ema21) bull += 2;   // full bullish alignment
    else if (price > ema9) bull += 1;                // price above short EMA
    else if (price > ema21) bull += 0.5;             // price above long EMA at least
    else if (price < ema9 && ema9 < ema21) bear += 2; // full bearish alignment
    else if (price < ema9) bear += 1;
    else if (price < ema21) bear += 0.5;
  }

  // VWAP position
  if (vwap) {
    if (price > vwap * 1.02) bull += 1;    // clearly above VWAP
    else if (price > vwap) bull += 0.5;     // slightly above
    else if (price < vwap * 0.98) bear += 1; // clearly below
    else bear += 0.5;
  }

  // Volume confirmation
  if (rvol > 2 && changePct > 0) bull += 1.5;   // high volume + green = strong
  else if (rvol > 1.5 && changePct > 0) bull += 1;
  else if (rvol > 2 && changePct < 0) bear += 1.5;
  else if (rvol > 1.5 && changePct < 0) bear += 1;

  // MACD
  if (macd) {
    if (macd.histogram > 0 && macd.macd > macd.signal) bull += 1.5; // MACD expanding bullish
    else if (macd.histogram > 0) bull += 0.5;  // MACD positive but fading
    else if (macd.histogram < 0 && macd.macd < macd.signal) bear += 1.5;
    else if (macd.histogram < 0) bear += 0.5;
  }

  // Daily momentum
  if (changePct > 5) bull += 1.5;
  else if (changePct > 2) bull += 1;
  else if (changePct > 0) bull += 0.5;
  else if (changePct < -5) bear += 1.5;
  else if (changePct < -2) bear += 1;
  else if (changePct < 0) bear += 0.5;

  // Social sentiment tiebreaker
  if (socialData) {
    const sentiment = socialData.sentiment;
    const score = socialData.socialScore || 0;
    if (score > 40 && sentiment > 65) bull += 1;       // high buzz + bullish
    else if (score > 40 && sentiment < 35) bear += 1;  // high buzz + bearish
    else if (score > 20) {
      if (sentiment > 55) bull += 0.5;
      else if (sentiment < 45) bear += 0.5;
    }
  }

  // Signal thresholds — slightly more aggressive
  let signal, entry, stop, target, rr;
  if (bull >= bear + 3) {
    signal = 'STRONG BUY'; entry = +price.toFixed(2); stop = +(price - 1.5 * atr).toFixed(2); target = +(price + 3 * atr).toFixed(2); rr = '3.0:1';
  } else if (bull >= bear + 1.5) {
    signal = 'BUY'; entry = +price.toFixed(2); stop = +(price - 1.5 * atr).toFixed(2); target = +(price + 2 * atr).toFixed(2); rr = '2.0:1';
  } else if (bear >= bull + 3) {
    signal = 'STRONG SELL'; entry = +price.toFixed(2); stop = +(price + 1.5 * atr).toFixed(2); target = +(price - 3 * atr).toFixed(2); rr = '3.0:1';
  } else if (bear >= bull + 1.5) {
    signal = 'SELL'; entry = +price.toFixed(2); stop = +(price + 1.5 * atr).toFixed(2); target = +(price - 2 * atr).toFixed(2); rr = '2.0:1';
  } else {
    signal = 'HOLD'; entry = null; stop = null; target = null; rr = null;
  }

  return { signal, entry, stop, target, rr };
}

export function determineBias(quote, candles) {
  if (!candles || !candles.c || candles.c.length < 15) {
    const changePct = quote.dp || 0;
    const price = quote.c || 0, open = quote.o || price;
    let b = 0, s = 0;
    if (changePct > 2) b += 2;
    else if (changePct < -2) s += 2;
    if (price > open) b += 1;
    else if (price < open) s += 1;
    return b > s + 1 ? 'LONG' : s > b + 1 ? 'SHORT' : 'NEUTRAL';
  }
  const closes = candles.c;
  const ema9 = calcEMA(closes, 9);
  const ema21 = calcEMA(closes, 21);
  const price = quote.c;
  const rsi = calcRSI(closes) || 50;
  const macd = calcMACD(closes);
  let b = 0, s = 0;

  if (ema9 && ema21) { if (ema9 > ema21) b += 2; else s += 2; }
  if (price > (ema9 || price)) b += 1; else s += 1;
  if (rsi > 55) b += 1; else if (rsi < 45) s += 1;
  if (macd && macd.histogram > 0) b += 1; else s += 1;
  if ((quote.dp || 0) > 1) b += 1; else if ((quote.dp || 0) < -1) s += 1;

  return b > s + 1 ? 'LONG' : s > b + 1 ? 'SHORT' : 'NEUTRAL';
}

export function axiarchScore(quote, candles, socialData) {
  if (!candles || !candles.c || candles.c.length < 15) return basicScore(quote, socialData);
  const closes = candles.c, highs = candles.h, lows = candles.l, volumes = candles.v;
  const price = quote.c || closes[closes.length - 1];
  const rsi = calcRSI(closes) || 50;
  const ema9 = calcEMA(closes, 9);
  const ema21 = calcEMA(closes, 21);
  const bb = calcBollingerBands(closes);
  const macd = calcMACD(closes);
  const rvol = calcRelativeVolume(volumes) || 1;
  const vwap = calcVWAP(highs, lows, closes, volumes);

  let tech = 0;
  if (rsi >= 30 && rsi <= 40) tech += 30;
  else if (rsi >= 40 && rsi <= 60) tech += 20;
  else if (rsi >= 20 && rsi < 30) tech += 25;
  else if (rsi > 60 && rsi <= 70) tech += 15;
  else if (rsi > 70) tech += 5;
  else tech += 10;
  if (ema9 && ema21) {
    if (price > ema9 && ema9 > ema21) tech += 30;
    else if (price > ema9) tech += 22;
    else if (price > ema21) tech += 15;
    else if (ema9 > ema21) tech += 10;
    else tech += 5;
  } else tech += 15;
  if (bb) {
    const bbPos = (price - bb.lower) / (bb.upper - bb.lower);
    if (bbPos <= 0.2) tech += 25;
    else if (bbPos <= 0.4) tech += 20;
    else if (bbPos <= 0.6) tech += 15;
    else if (bbPos <= 0.8) tech += 10;
    else tech += 5;
  } else tech += 15;
  if (macd) {
    if (macd.histogram > 0 && macd.macd > macd.signal) tech += 15;
    else if (macd.histogram > 0) tech += 10;
    else tech += 5;
  } else tech += 10;
  tech = Math.min(100, tech);

  let mom = 0;
  const changePct = quote.dp || 0;
  const absChange = Math.abs(changePct);
  if (absChange > 20) mom += 40;
  else if (absChange > 10) mom += 35;
  else if (absChange > 5) mom += 25;
  else if (absChange > 2) mom += 15;
  else mom += 5;
  let streak = 0;
  for (let i = closes.length - 1; i > 0 && i > closes.length - 6; i--) {
    if (closes[i] > closes[i - 1]) streak++;
    else break;
  }
  mom += streak * 8;
  if (vwap && price > vwap) mom += 20;
  else if (vwap) mom += 5;
  else mom += 10;
  mom = Math.min(100, mom);

  let vol = 20;
  const atr = calcATR(highs, lows, closes);
  if (atr) {
    const atrPct = (atr / price) * 100;
    if (atrPct > 10) vol = 90;
    else if (atrPct > 6) vol = 75;
    else if (atrPct > 3) vol = 55;
    else if (atrPct > 1.5) vol = 35;
    else vol = 15;
  }

  let volSc = 30;
  if (rvol > 3) volSc = 95;
  else if (rvol > 2) volSc = 80;
  else if (rvol > 1.5) volSc = 65;
  else if (rvol > 1) volSc = 45;
  else if (rvol > 0.5) volSc = 25;
  else volSc = 10;

  // Social factor (0-100)
  const social = socialData?.socialScore || 0;

  // Weights: Technical 35%, Momentum 20%, Volatility 15%, Volume 15%, Social 15%
  const composite = (tech * 0.35) + (mom * 0.20) + (vol * 0.15) + (volSc * 0.15) + (social * 0.15);
  return Math.max(10, Math.min(99, Math.round(composite)));
}

function basicScore(q, socialData) {
  let score = 50;
  const price = q.c || 0, absChange = Math.abs(q.dp || 0);
  if (price >= 0.50 && price <= 5) score += 12;
  else if (price > 5 && price <= 20) score += 8;
  else if (price > 20 && price <= 50) score += 3;
  if (absChange > 20) score += 18;
  else if (absChange > 10) score += 14;
  else if (absChange > 5) score += 8;
  else if (absChange > 2) score += 4;
  const range = ((q.h || price) - (q.l || price));
  const rangePct = price > 0 ? (range / price) * 100 : 0;
  if (rangePct > 10) score += 8;
  else if (rangePct > 5) score += 5;
  // Social boost
  if (socialData?.socialScore) score += Math.round(socialData.socialScore * 0.15);
  return Math.max(10, Math.min(99, Math.round(score)));
}

export function fmtPrice(p) {
  if (p === null || p === undefined) return '\u2014';
  return '$' + (p < 1 ? p.toFixed(4) : p.toFixed(2));
}

export function getSignalClass(sig) {
  const map = {
    'STRONG BUY': 'signal-strong-buy',
    'BUY': 'signal-buy',
    'HOLD': 'signal-hold',
    'SELL': 'signal-sell',
    'STRONG SELL': 'signal-strong-sell'
  };
  return map[sig] || 'signal-hold';
}
