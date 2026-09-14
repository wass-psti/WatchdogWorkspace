import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);
export interface FuelTrackAnalyticsPoint {
  readonly label?: string;
  readonly value?: number;
}

export interface FuelTrackAnalyticsRenderOptions {
  readonly light?: boolean;
}

const instances = new WeakMap<HTMLElement, { readonly dispose: () => void }>();

export const FUELTRACK_ANALYTICS_ENGINE = Object.freeze({
  library: 'Apache ECharts',
  version: '6.1.0',
  loading: 'analytics-route-lazy',
} as const);

export function renderFuelTrackAnalyticsTrend(
  element: HTMLElement,
  series: readonly FuelTrackAnalyticsPoint[],
  { light = false }: FuelTrackAnalyticsRenderOptions = {},
): () => void {
  if (!(element instanceof HTMLElement)) throw new TypeError('FuelTrack+ analytics requires a chart host element.');
  const rows = Array.isArray(series) ? series : [];
  instances.get(element)?.dispose();

  const chart = echarts.init(element, light ? undefined : 'dark', { renderer: 'canvas' });
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  chart.setOption({
    animation: !reducedMotion,
    animationDuration: reducedMotion ? 0 : 280,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' },
    grid: { left: 42, right: 18, top: 24, bottom: 38, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: rows.map((row) => String(row?.label || '')),
      axisTick: { show: false },
      axisLabel: { hideOverlap: true },
    },
    yAxis: { type: 'value', minInterval: 1, name: 'Requests' },
    series: [{
      name: 'Requests',
      type: 'bar',
      data: rows.map((row) => Number(row?.value) || 0),
      barMaxWidth: 38,
      itemStyle: { borderRadius: [6, 6, 2, 2] },
      emphasis: { focus: 'series' },
    }],
  }, { notMerge: true });

  const resize = () => chart.resize();
  window.addEventListener('resize', resize, { passive: true });

  const dispose = () => {
    window.removeEventListener('resize', resize);
    if (!chart.isDisposed()) chart.dispose();
    instances.delete(element);
  };

  instances.set(element, { dispose });
  return dispose;
}
