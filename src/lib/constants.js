export const WATCHLIST = [
  'FFIE','MULN','NKLA','ATER','CLOV','WKHS','LCID','NIO','RIVN',
  'SOFI','PLTR','AMC','GME','MARA','RIOT','SNDL','TLRY','PLUG',
  'FCEL','QS','GOEV','DNA','IONQ','RGTI','QUBT','SMCI','KULR',
  'GSAT','OPEN','RDFN','WISH','BYND','SPCE','LAZR','VUZI',
  'AFRM','UPST','HOOD','DKNG','PENN','RKLB','LUNR','APLD',
  'CLSK','CORZ','SOUN','BKKT','ASTS','TSLA','NVDA','AAPL',
  'MSFT','META','GOOGL','AMD','INTC','MU','SNAP','COIN',
  'SQ','PYPL','ROKU','ABNB','UBER','DASH','NET','CRWD',
];

// No fallback data — all data comes from the server-side Finnhub proxy

export const FRAMEWORK_STEPS = [
  {num:1, name:'Pre-Pump', tag:'The Quiet Accumulation', desc:'The stock is unknown. Insiders accumulate at rock-bottom prices. Volume is low, price is flat. Smart money is positioning while retail has no idea. The float is being quietly absorbed.', psych:'Insider Greed', vol:'Very Low', action:'Watch & Wait', risk:'Low', indicators:['Low RSI (20-35)', 'Flat EMA lines', 'RVOL < 0.5x', 'Tight Bollinger Bands'], details:'This is the accumulation phase. The stock trades in a tight range with minimal volume. Insiders and early-stage investors are building positions. The key tell is unusually tight Bollinger Bands combined with slowly rising OBV (On-Balance Volume). Most screeners will not flag these stocks because nothing is happening on the surface.'},
  {num:2, name:'Ramp', tag:'The Slow Build', desc:'Price creeps upward on increasing volume. Promotion kicks in — newsletters, social media, paid articles. The stock starts appearing on scanners.', psych:'Early FOMO', vol:'Rising', action:'Small Position', risk:'Medium', indicators:['RSI rising (40-60)', 'EMA9 crossing above EMA21', 'RVOL 1.5-2.5x', 'BB expanding'], details:'The ramp phase is where the stock transitions from accumulation to markup. Volume increases 2-3x from the quiet phase. EMA(9) crosses above EMA(21) — the golden cross for day traders. This is the optimal entry point for momentum traders. Risk is moderate because the move is still early.'},
  {num:3, name:'Supernova', tag:'Parabolic Explosion', desc:'The stock goes parabolic. Everyone talks about it. Volume explodes. Most traders get trapped buying at the top. This is where FOMO is strongest.', psych:'Mass Euphoria', vol:'Extreme', action:'SELL / Short', risk:'Extreme', indicators:['RSI > 80 (overbought)', 'Price far above EMA21', 'RVOL > 5x', 'BB at maximum width'], details:'The supernova is the climax. Volume can hit 10-50x normal levels. RSI screams overbought above 80. The stock is trading far above all moving averages. This is NOT the time to buy — this is the time to sell or prepare to short. The key signal is a red candle after consecutive green days with massive volume.'},
  {num:4, name:'Cliff Dive', tag:'The Crash', desc:'Reality sets in. Violent crash. Bagholders in denial. Panic sellers dump shares. The stock can lose 50-80% in days.', psych:'Panic & Denial', vol:'High', action:'Avoid', risk:'Extreme', indicators:['RSI dropping fast (70→30)', 'EMA9 crosses below EMA21', 'RVOL still elevated', 'Price breaks below BB middle'], details:'The crash is violent and fast. Dead cat bounces create false hope. EMA(9) crosses below EMA(21) — the death cross. Each bounce gets weaker. Volume remains elevated as trapped longs exit. Do not try to catch the falling knife.'},
  {num:5, name:'Dip Buy', tag:'Dead Cat Bounce', desc:'Bottom fishers move in. Stock stabilizes briefly, may bounce 20-50%. This bounce traps more buyers who think the bottom is in.', psych:'False Hope', vol:'Moderate', action:'Quick Scalp Only', risk:'High', indicators:['RSI bouncing from oversold', 'Price touches lower BB', 'RVOL declining', 'MACD histogram improving'], details:'The dead cat bounce is a trap for anyone thinking the stock has bottomed. It bounces because shorts cover and optimists buy. The bounce typically retraces 20-50% of the crash. The key is that volume is lower on the bounce than on the crash — this tells you the move lacks conviction. Scalp only, never hold.'},
  {num:6, name:'Dead Pump', tag:'The Zombie Rally', desc:'Second, weaker promotion. Never reaches previous highs. Fueled by hopium and residual hype. Each subsequent pump gets weaker.', psych:'Desperation', vol:'Declining', action:'Short on Spike', risk:'Medium', indicators:['RSI fails to break 60', 'EMA lines trending down', 'RVOL < 1x', 'Lower highs on chart'], details:'The zombie rally is the last gasp. A promoter or bag-holder community tries to pump the stock again. It might rally 30-50% intraday, but it always fades. The tell is lower highs — each rally peaks lower than the last. This is a shorting opportunity for experienced traders.'},
  {num:7, name:'Goodnight', tag:'The Long Kiss Goodnight', desc:'Slow bleed to nothing. Volume dries up. No promoters, no hype. The lifecycle is complete. Move on to the next play.', psych:'Capitulation', vol:'Dead', action:'Move On', risk:'N/A', indicators:['RSI flatlines near 50', 'EMAs converging flat', 'RVOL < 0.3x', 'No BB expansion'], details:'The goodnight phase is the end of the cycle. Volume is dead. The stock trades sideways or slowly bleeds. There is no edge here — no volatility means no opportunity. The smart play is to move on and find the next stock entering Phase 1 or Phase 2.'},
];

export const COLORS = {
  bgVoid: '#060a12',
  bgPrimary: '#0a0f18',
  bgCard: '#0e1520',
  bgCardHover: '#131c2a',
  bgElevated: '#172234',
  border: '#1a2640',
  borderBright: '#243352',
  textPrimary: '#dfe6f0',
  textSecondary: '#7a8ba8',
  textMuted: '#4a5b74',
  accentGreen: '#00c853',
  accentRed: '#ef4444',
  accentAmber: '#c8963e',
  accentBlue: '#0ea5e9',
  accentCyan: '#38bdf8',
  accentGold: '#c8963e',
};

export const PRICING_PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with basic scanning',
    features: [
      'Demo data screener',
      'Basic TA indicators (RSI, EMA)',
      'Position sizing calculator',
      '7-step framework reference',
      'Up to 10 watchlist tickers',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Full real-time analysis suite',
    features: [
      'Live Finnhub data integration',
      'All 6 TA indicators + VWAP',
      'Multi-factor scoring engine',
      'Signal generation (BUY/SELL)',
      'ATR-based entry/stop/target',
      'Unlimited watchlist tickers',
      'Signal alerts & notifications',
      'RSI distribution analytics',
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Institutional',
    price: '$99',
    period: '/month',
    description: 'For serious traders & teams',
    features: [
      'Everything in Pro',
      'Custom watchlists & sectors',
      'API access for automation',
      'Multi-timeframe analysis',
      'Backtesting engine (beta)',
      'Priority data feeds',
      'Dedicated support channel',
      'Team collaboration tools',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];
