import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://axiarchtrading.netlify.app';

const META = {
  '/': { title: 'Axiarch — Algorithmic Day Trading Intelligence', description: 'Real-time technical analysis of 65+ stocks. RSI, EMA, MACD, Bollinger Bands, ATR, VWAP indicators with BUY/SELL signals and trade targets.' },
  '/screener': { title: 'Live Stock Screener — Axiarch', description: 'Scan 65+ stocks in real-time with 6 technical indicators. Multi-factor scoring, signal generation, and ATR-based trade plans.' },
  '/dashboard': { title: 'Signals Dashboard — Axiarch', description: 'Top-ranked trade signals, market-wide signal distribution, RSI breakdown, and active alerts from indicator confluence.' },
  '/calculator': { title: 'Risk Calculator — Axiarch', description: 'Position sizing and risk management calculator. Entry, stop-loss, and multi-target profit levels with precise risk-reward ratios.' },
  '/framework': { title: 'Price Cycle Framework — Axiarch', description: 'The 7-stage pennystocking lifecycle. Understand where a stock is in its psychological cycle to time entries and exits.' },
  '/methodology': { title: 'How It Works — Axiarch', description: 'Deep dive into the 4-stage algorithm pipeline: data collection, indicator calculation, multi-factor scoring, and signal generation.' },
  '/pricing': { title: 'Pricing — Axiarch', description: 'Free demo scanning, Pro real-time analysis, and Institutional plans. All plans include the complete technical analysis indicator suite.' },
  '/watchlist': { title: 'My Watchlist — Axiarch', description: 'Track your favorite stocks with real-time data, technical indicators, and trade signals. Add any ticker to your personal watchlist.' },
  '/go': { title: 'Start Your Free Trial — Axiarch Pro', description: 'Get real-time BUY/SELL signals with exact entry, stop-loss, and profit targets for 65+ stocks. Try Axiarch Pro free for 7 days.' },
  '/blog': { title: 'Trading Education — Axiarch', description: 'Learn how to read RSI, EMA crossovers, MACD signals, and more. Understand the indicators behind every Axiarch signal.' },
  '/performance': { title: 'Verified Performance — Axiarch', description: 'Transparent performance tracking. Every pick tracked from flag time to close with real entry and exit prices.' },
};

function getStockMeta(symbol) {
  const sym = symbol.toUpperCase();
  return {
    title: `${sym} Technical Analysis — Axiarch Trading Signals`,
    description: `Real-time technical analysis for ${sym}. RSI, EMA, MACD, Bollinger Bands, ATR signals with entry, stop-loss, and profit targets.`,
  };
}

export default function usePageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Handle dynamic /stock/:symbol routes
    let meta;
    const stockMatch = pathname.match(/^\/stock\/([A-Za-z]+)$/);
    if (stockMatch) {
      meta = getStockMeta(stockMatch[1]);
    } else {
      meta = META[pathname] || META['/'];
    }

    document.title = meta.title;

    // Update meta description
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', meta.description);

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.description);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', SITE_URL + pathname);

    // Update Twitter tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', meta.title);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', meta.description);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = SITE_URL + pathname;
  }, [pathname]);
}
