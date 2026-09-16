import { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { OBJECTIVES } from '../utils/constants';
import HelpToggle from './HelpToggle';

const TABS = [
  { key: 'mean_distance', label: 'Mean Distance', yLabel: 'Distance (km)', unit: 'km', icon: '📉' },
  { key: 'max_distance', label: 'Worst-Case Distance', yLabel: 'Distance (km)', unit: 'km', icon: '📉' },
  { key: 'pct_covered_15min', label: '15-Min Coverage', yLabel: 'Coverage (%)', unit: '%', icon: '📈' },
];

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#fdfbf3] border border-[#e8ddb8] rounded-lg p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1.5">{label} new center{label !== 1 ? 's' : ''}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-[#54494B]">{p.name}:</span>
          <span className="font-semibold text-[#171717] ml-auto">
            {unit === '%' ? `${p.value.toFixed(1)}%` : `${p.value.toFixed(1)} km`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ScenarioCharts({ scenarios }) {
  const [activeTab, setActiveTab] = useState('mean_distance');
  const [highlighted, setHighlighted] = useState(null);

  const tab = TABS.find(t => t.key === activeTab);
  const isDistance = tab.unit === 'km';

  const chartData = useMemo(() => {
    const byN = {};
    for (const s of scenarios) {
      if (!byN[s.n_new]) byN[s.n_new] = { n_new: s.n_new };
      const obj = OBJECTIVES.find(o => o.key === s.objective);
      if (obj) {
        const raw = s[activeTab];
        byN[s.n_new][obj.short] = isDistance ? raw / 1000 : raw;
      }
    }
    return Object.values(byN).sort((a, b) => a.n_new - b.n_new);
  }, [scenarios, activeTab, isDistance]);

  const handleLegendClick = useCallback((e) => {
    setHighlighted(prev => prev === e.dataKey ? null : e.dataKey);
  }, []);

  const renderLegend = useCallback(({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-3">
        {payload.map((entry) => {
          const isActive = !highlighted || highlighted === entry.dataKey;
          return (
            <button
              key={entry.dataKey}
              onClick={() => setHighlighted(prev => prev === entry.dataKey ? null : entry.dataKey)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 cursor-pointer hover:bg-[#d4ebe1]/40"
              style={{ opacity: isActive ? 1 : 0.35 }}
            >
              <span
                className="w-3 h-0.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[11px]" style={{ color: isActive ? '#171717' : '#54494B' }}>
                {entry.value}
              </span>
            </button>
          );
        })}
      </div>
    );
  }, [highlighted]);

  return (
    <div className="bg-[#f5faf7] rounded-xl border border-[#c8e3d8] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div>
          <h3 className="text-lg font-semibold text-[#171717]">Scenario Analysis</h3>
          <p className="text-xs text-[#54494B]">How each additional center improves access under different equity objectives</p>
        </div>
        <HelpToggle color="#91C7B1">
          <p><span className="font-medium text-[#171717]">How to read:</span> Each line represents one optimization objective. The x axis is the number of new centers added (0 to 10). Use the three tabs to switch between Mean Distance, Worst-Case Distance, and 15-Min Coverage.</p>
          <p><span className="font-medium text-[#171717]">Diminishing returns:</span> Notice where lines begin to flatten. That point tells you the budget at which adding another center yields minimal improvement. For most objectives this occurs around 4 to 6 new centers.</p>
          <p><span className="font-medium text-[#171717]">Key trade-offs:</span> The Coverage objective (amber) achieves the highest 15 minute walk coverage but at the cost of a higher mean distance. The Vulnerability-Weighted objective (cranberry) lowers average distance for the most at-risk populations but covers fewer residents overall.</p>
          <p><span className="font-medium text-[#171717]">Tip:</span> Click a legend label below the chart to highlight one line and fade the others.</p>
        </HelpToggle>
      </div>

      <div className="flex gap-1 mb-4 bg-[#f0ead0] rounded-lg p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 text-xs py-2 px-3 rounded-md transition-all duration-200 cursor-pointer
              ${activeTab === t.key
                ? 'bg-[#fdfbf3] text-[#171717] shadow-sm border border-[#e8ddb8]'
                : 'text-[#54494B] hover:text-[#171717] hover:bg-[#f5edcf]'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d4ebe1" />
          <XAxis
            dataKey="n_new"
            tick={{ fill: '#54494B', fontSize: 12 }}
            label={{ value: 'Number of New Centers', position: 'bottom', offset: -5, fill: '#54494B', fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: '#54494B', fontSize: 11 }}
            tickFormatter={v => isDistance ? `${v.toFixed(0)} km` : `${v.toFixed(0)}%`}
            label={{ value: tab.yLabel, angle: -90, position: 'insideLeft', offset: 0, fill: '#54494B', fontSize: 11 }}
            width={70}
          />
          <Tooltip content={<CustomTooltip unit={tab.unit} />} />
          <Legend content={renderLegend} onClick={handleLegendClick} />
          {OBJECTIVES.map(o => {
            const isActive = !highlighted || highlighted === o.short;
            return (
              <Line
                key={o.short}
                type="monotone"
                dataKey={o.short}
                name={o.short}
                stroke={o.color}
                strokeWidth={isActive ? 3 : 1}
                strokeOpacity={isActive ? 1 : 0.2}
                dot={isActive ? { r: 4, fill: o.color, strokeWidth: 0 } : false}
                activeDot={isActive ? { r: 6, stroke: '#fff', strokeWidth: 2 } : false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
