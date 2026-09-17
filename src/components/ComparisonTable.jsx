import { useMemo } from 'react';
import { OBJECTIVES } from '../utils/constants';
import HelpToggle from './HelpToggle';

export default function ComparisonTable({ scenarios, nNew = 5 }) {
  const rows = useMemo(() => {
    return OBJECTIVES.map(obj => {
      const s = scenarios.find(sc => sc.objective === obj.key && sc.n_new === nNew);
      return {
        ...obj,
        mean: s ? (s.mean_distance / 1000).toFixed(1) : '-',
        max: s ? (s.max_distance / 1000).toFixed(1) : '-',
        p90: s ? (s.p90_distance / 1000).toFixed(1) : '-',
        coverage: s ? s.pct_covered_15min.toFixed(1) : '-',
      };
    });
  }, [scenarios, nNew]);

  return (
    <div className="bg-[#fdfbf3] rounded-xl border border-[#e8ddb8] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#171717] mb-1">Objective Comparison</h3>
          <p className="text-xs text-[#54494B]">All objectives with {nNew} new center{nNew !== 1 ? 's' : ''}</p>
        </div>
        <HelpToggle color="#E3D081">
          <p>The table compares all five objectives side by side at the selected budget ({nNew} new center{nNew !== 1 ? 's' : ''}). The <span className="font-medium text-[#171717]">Coverage</span> column highlights which objective places the most people within walking distance, while <span className="font-medium text-[#171717]">Mean</span> and <span className="font-medium text-[#171717]">Max</span> columns reveal the distance trade-offs.</p>
          <p><span className="font-medium text-[#171717]">P90</span> shows the distance that 90% of block groups fall under. A lower P90 means fewer communities are left far from any center.</p>
        </HelpToggle>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d4ebe1]">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-[#54494B] uppercase tracking-wider">Objective</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-[#54494B] uppercase tracking-wider">Mean</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-[#54494B] uppercase tracking-wider">Max</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-[#54494B] uppercase tracking-wider">P90</th>
              <th className="text-right py-2.5 px-3 text-xs font-semibold text-[#54494B] uppercase tracking-wider">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.key}
                className={`border-b border-[#e8ddb830] hover:bg-[#f0ead0]/40 transition-colors
                  ${i % 2 === 0 ? 'bg-[#f5edcf]/30' : ''}`}
              >
                <td className="py-2.5 px-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="font-medium text-[#171717]">{r.short}</span>
                </td>
                <td className="py-2.5 px-3 text-right text-[#54494B]">{r.mean} km</td>
                <td className="py-2.5 px-3 text-right text-[#54494B]">{r.max} km</td>
                <td className="py-2.5 px-3 text-right text-[#54494B]">{r.p90} km</td>
                <td className="py-2.5 px-3 text-right font-semibold text-[#171717]">{r.coverage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
