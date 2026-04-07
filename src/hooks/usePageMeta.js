import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const META = {
  '/': { title: 'Axiarch — Algorithmic Day Trading Intelligence', description: 'Real-time technical analysis engine scanning 65+ stocks with RSI, EMA, MACD, Bollinger Bands, ATR, and VWAP. BUY/SELL signals with entry, stop-loss, and profit targets.' },
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

export default function usePageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = META[pathname] || META['/'];
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
    if (ogUrl) ogUrl.setAttribute('content', 'https://axiarch.netlify.app' + pathname);

    // Update Twitter tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', meta.title);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', meta.description);
  }, [pathname]);
}
