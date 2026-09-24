import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MAX_WALK_METERS } from '../utils/constants';
import { computeHistogramBins, getP90 } from '../hooks/useData';
import HelpToggle from './HelpToggle';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#fdf6f7] border border-[#e8b8bf] rounded-lg p-2.5 shadow-lg text-xs">
      <p className="text-[#54494B]">{d.rangeStart} - {d.rangeEnd} km</p>
      <p className="text-[#171717] font-semibold">{d.count} block groups</p>
    </div>
  );
}

export default function DistributionChart({ blockGroups, sites, scenario, assignmentMap }) {
  const distancesKm = useMemo(() => {
    if (!assignmentMap || Object.keys(assignmentMap).length === 0) return [];
    return Object.values(assignmentMap).map(a => a.distance_m / 1000);
  }, [assignmentMap]);

  const bins = useMemo(() => computeHistogramBins(distancesKm), [distancesKm]);
  const p90 = useMemo(() => getP90(distancesKm), [distancesKm]);

  const nearestBin = (target) => bins.reduce((best, b) =>
    Math.abs(b.x - target) < Math.abs(best - target) ? b.x : best, bins[0].x);

  if (!bins.length) return null;

  const nNew = scenario ? scenario.n_new : 0;
  const walkBinX = nearestBin(MAX_WALK_METERS / 1000);
  const p90BinX = nearestBin(p90);

  return (
    <div className="bg-[#fdf6f7] rounded-xl border border-[#e8b8bf] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#171717] mb-1">Distance Distribution</h3>
          <p className="text-xs text-[#54494B]">Walking distance to nearest center with {nNew} new center{nNew !== 1 ? 's' : ''}</p>
        </div>
        <HelpToggle color="#B33951">
          <p>The histogram shows how many block groups fall into each distance bin. The <span className="font-medium text-[#059669]">green dashed line</span> marks the 15 minute walk threshold (1.25 km) and the <span className="font-medium text-[#d97706]">amber dashed line</span> marks the P90, meaning 10% of block groups are farther than that value.</p>
          <p>A left-skewed distribution (most bars on the left) indicates most areas are well served. Bars beyond the P90 line represent the worst-off communities that vulnerability-weighted objectives target.</p>
        </HelpToggle>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={bins} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8b8bf50" vertical={false} />
          <XAxis
            dataKey="x"
            tick={{ fill: '#54494B', fontSize: 11 }}
            label={{ value: 'Walking Distance (km)', position: 'bottom', offset: 0, fill: '#54494B', fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: '#54494B', fontSize: 11 }}
            label={{ value: 'Block Groups', angle: -90, position: 'insideLeft', offset: 0, fill: '#54494B', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <ReferenceLine
            x={walkBinX}
            stroke="#059669"
            strokeDasharray="6 3"
            strokeWidth={2}
            label={{ value: '15-min walk', fill: '#059669', fontSize: 11, position: 'top' }}
          />
          <ReferenceLine
            x={p90BinX}
            stroke="#d97706"
            strokeDasharray="3 3"
            strokeWidth={2}
            label={{ value: `P90 (${p90.toFixed(1)} km)`, fill: '#d97706', fontSize: 11, position: 'top' }}
          />
          <Bar
            dataKey="count"
            fill="#B33951"
            fillOpacity={0.8}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-400 mt-2 text-center">
        Worst-off 10%: block groups beyond {p90.toFixed(1)} km.
        Vulnerability-weighted objectives shift new sites toward these areas.
      </p>
    </div>
  );
}
