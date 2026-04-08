import { useRef, useEffect, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { calcRSI, calcEMA, calcBollingerBands } from '../lib/indicators';

const TIMEFRAMES = [
  { key: '1W', label: '1W', days: 7 },
  { key: '1M', label: '1M', days: 30 },
  { key: '3M', label: '3M', days: 90 },
  { key: '6M', label: '6M', days: 180 },
  { key: '1Y', label: '1Y', days: 365 },
];

const CHART_TYPES = [
  { key: 'candle', label: 'Candles' },
  { key: 'line', label: 'Line' },
];

const OVERLAYS = [
  { key: 'ema9', label: 'EMA 9' },
  { key: 'ema21', label: 'EMA 21' },
  { key: 'bb', label: 'Bollinger' },
];

export default function StockChart({ candles, symbol }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [timeframe, setTimeframe] = useState('3M');
  const [chartType, setChartType] = useState('candle');
  const [overlays, setOverlays] = useState([]);
  const [showVolume, setShowVolume] = useState(true);
  const [showRSI, setShowRSI] = useState(false);

  const toggleOverlay = (key) => {
    setOverlays(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  useEffect(() => {
    if (!chartContainerRef.current || !candles?.c?.length) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const tf = TIMEFRAMES.find(t => t.key === timeframe) || TIMEFRAMES[2];
    const totalBars = candles.c.length;
    const barsToShow = Math.min(totalBars, tf.days);
    const startIdx = Math.max(0, totalBars - barsToShow);

    // Slice data to timeframe
    const slicedData = {
      t: candles.t.slice(startIdx),
      o: candles.o.slice(startIdx),
      h: candles.h.slice(startIdx),
      l: candles.l.slice(startIdx),
      c: candles.c.slice(startIdx),
      v: candles.v.slice(startIdx),
    };

    // Calculate chart height
    const mainHeight = showRSI ? 300 : 380;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: mainHeight + (showVolume ? 80 : 0) + (showRSI ? 120 : 0),
      layout: {
        background: { color: 'transparent' },
        textColor: '#7fa893',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(22, 51, 34, 0.3)' },
        horzLines: { color: 'rgba(22, 51, 34, 0.3)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(0, 230, 118, 0.3)', labelBackgroundColor: '#0b1a14' },
        horzLine: { color: 'rgba(0, 230, 118, 0.3)', labelBackgroundColor: '#0b1a14' },
      },
      rightPriceScale: {
        borderColor: '#163322',
        scaleMargins: { top: 0.05, bottom: showVolume ? 0.25 : 0.05 },
      },
      timeScale: {
        borderColor: '#163322',
        timeVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    // Format timestamps
    const formatTime = (ts) => {
      const d = new Date(ts * 1000);
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    };

    // Main price series
    if (chartType === 'candle') {
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#00e676',
        downColor: '#ff3b3b',
        borderUpColor: '#00e676',
        borderDownColor: '#ff3b3b',
        wickUpColor: '#00e676',
        wickDownColor: '#ff3b3b',
      });
      candleSeries.setData(slicedData.t.map((ts, i) => ({
        time: formatTime(ts),
        open: slicedData.o[i],
        high: slicedData.h[i],
        low: slicedData.l[i],
        close: slicedData.c[i],
      })));
    } else {
      const lineSeries = chart.addLineSeries({
        color: '#00e676',
        lineWidth: 2,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: '#00e676',
        lastValueVisible: true,
        priceLineVisible: false,
      });
      const areaSeries = chart.addAreaSeries({
        topColor: 'rgba(0, 230, 118, 0.15)',
        bottomColor: 'rgba(0, 230, 118, 0.02)',
        lineColor: '#00e676',
        lineWidth: 2,
      });
      areaSeries.setData(slicedData.t.map((ts, i) => ({
        time: formatTime(ts),
        value: slicedData.c[i],
      })));
    }

    // EMA overlays
    if (overlays.includes('ema9')) {
      const ema9Data = [];
      const closes = slicedData.c;
      for (let i = 8; i < closes.length; i++) {
        const slice = closes.slice(0, i + 1);
        const ema = calcEMA(slice, 9);
        if (ema) ema9Data.push({ time: formatTime(slicedData.t[i]), value: ema });
      }
      const ema9Series = chart.addLineSeries({ color: '#38bdf8', lineWidth: 1, lineStyle: 0, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
      ema9Series.setData(ema9Data);
    }

    if (overlays.includes('ema21')) {
      const ema21Data = [];
      const closes = slicedData.c;
      for (let i = 20; i < closes.length; i++) {
        const slice = closes.slice(0, i + 1);
        const ema = calcEMA(slice, 21);
        if (ema) ema21Data.push({ time: formatTime(slicedData.t[i]), value: ema });
      }
      const ema21Series = chart.addLineSeries({ color: '#c8963e', lineWidth: 1, lineStyle: 0, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
      ema21Series.setData(ema21Data);
    }

    // Bollinger Bands overlay
    if (overlays.includes('bb')) {
      const upperData = [], lowerData = [], midData = [];
      const closes = slicedData.c;
      for (let i = 19; i < closes.length; i++) {
        const slice = closes.slice(0, i + 1);
        const bb = calcBollingerBands(slice);
        if (bb) {
          const time = formatTime(slicedData.t[i]);
          upperData.push({ time, value: bb.upper });
          lowerData.push({ time, value: bb.lower });
          midData.push({ time, value: bb.middle });
        }
      }
      chart.addLineSeries({ color: 'rgba(200, 150, 62, 0.5)', lineWidth: 1, lineStyle: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false }).setData(upperData);
      chart.addLineSeries({ color: 'rgba(200, 150, 62, 0.5)', lineWidth: 1, lineStyle: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false }).setData(lowerData);
      chart.addLineSeries({ color: 'rgba(200, 150, 62, 0.3)', lineWidth: 1, lineStyle: 1, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false }).setData(midData);
    }

    // Volume
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
        drawTicks: false,
      });
      volumeSeries.setData(slicedData.t.map((ts, i) => ({
        time: formatTime(ts),
        value: slicedData.v[i],
        color: slicedData.c[i] >= slicedData.o[i] ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 59, 59, 0.3)',
      })));
    }

    // Fit content
    chart.timeScale().fitContent();

    // Resize handler
    const handleResize = () => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, timeframe, chartType, overlays, showVolume, showRSI]);

  if (!candles?.c?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Loading chart data...
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.5rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {/* Timeframes */}
        <div style={{ display: 'flex', gap: '0.2rem' }}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.key}
              onClick={() => setTimeframe(tf.key)}
              className={`watchlist-sort-btn ${timeframe === tf.key ? 'active' : ''}`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Chart type + overlays */}
        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
          {CHART_TYPES.map(ct => (
            <button
              key={ct.key}
              onClick={() => setChartType(ct.key)}
              className={`watchlist-sort-btn ${chartType === ct.key ? 'active' : ''}`}
            >
              {ct.label}
            </button>
          ))}
          <span style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 0.3rem' }} />
          {OVERLAYS.map(ov => (
            <button
              key={ov.key}
              onClick={() => toggleOverlay(ov.key)}
              className={`watchlist-sort-btn ${overlays.includes(ov.key) ? 'active' : ''}`}
            >
              {ov.label}
            </button>
          ))}
          <button
            onClick={() => setShowVolume(v => !v)}
            className={`watchlist-sort-btn ${showVolume ? 'active' : ''}`}
          >
            Vol
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div ref={chartContainerRef} style={{ width: '100%' }} />

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        {overlays.includes('ema9') && <span><span style={{ color: '#38bdf8' }}>{'\u2501'}</span> EMA 9</span>}
        {overlays.includes('ema21') && <span><span style={{ color: '#c8963e' }}>{'\u2501'}</span> EMA 21</span>}
        {overlays.includes('bb') && <span><span style={{ color: 'rgba(200, 150, 62, 0.5)' }}>{'\u2501'}</span> Bollinger Bands</span>}
        {showVolume && <span><span style={{ color: 'rgba(0, 230, 118, 0.3)' }}>{'\u2588'}</span> Volume</span>}
      </div>
    </div>
  );
}
