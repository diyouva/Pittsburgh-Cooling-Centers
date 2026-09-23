import { OBJECTIVES, OBJ_MAP } from '../utils/constants';

const OBJ_FORMULAS = {
  min_total_distance: 'min Σ dᵢⱼ · xᵢⱼ',
  min_pop_weighted: 'min Σ popᵢ · dᵢⱼ · xᵢⱼ',
  min_vuln_weighted: 'min Σ vulnᵢ · dᵢⱼ · xᵢⱼ',
  min_worst_case: 'min max{dᵢⱼ · xᵢⱼ}',
  max_coverage: 'max Σ popᵢ · cᵢ  (dᵢⱼ ≤ 1250m)',
};

export default function Sidebar({ objective, setObjective, nNew, setNNew }) {
  const obj = OBJ_MAP[objective];

  return (
    <aside className="w-full lg:w-96 shrink-0 bg-[#eef6f2] border-r border-[#c8e3d8] lg:sticky lg:top-0 lg:h-screen flex flex-col">
      <div className="p-6 border-b border-[#c8e3d8]">
        <h1 className="text-2xl font-bold text-[#171717] leading-tight">Pittsburgh<br />Cooling Centers</h1>
        <p className="text-sm text-[#54494B] leading-snug mt-1">Equity-aware facility location optimization</p>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#171717] mb-3">Objective</h2>
          <div className="space-y-1">
            {OBJECTIVES.map(o => (
              <button
                key={o.key}
                onClick={() => setObjective(o.key)}
                className={`w-full flex items-center gap-2.5 text-left text-base px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  objective === o.key
                    ? 'bg-white/80 font-medium text-[#171717] shadow-sm'
                    : 'text-[#54494B] hover:bg-white/40'
                }`}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: o.color }} />
                {o.label}
              </button>
            ))}
          </div>
          <div
            className="rounded-lg p-3 border text-sm leading-relaxed text-[#54494B] mt-3"
            style={{ borderColor: obj.color + '30', backgroundColor: obj.color + '08' }}
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: obj.color }} />
            {obj.description}
            <div className="mt-2 font-mono text-xs text-[#171717]/60">{OBJ_FORMULAS[objective]}</div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#171717] mb-3">New Centers</h2>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={10}
              value={nNew}
              onChange={e => setNNew(Number(e.target.value))}
              className="flex-1 cursor-pointer"
            />
            <span className="text-3xl font-bold text-[#B33951] w-10 text-center">{nNew}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-1 px-0.5">
            <span>0</span><span>5</span><span>10</span>
          </div>
        </div>

        <hr className="border-[#c8e3d8]" />

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#171717] mb-3">Methodology</h2>
          <div className="text-sm leading-relaxed text-[#54494B] space-y-2">
            <p><span className="font-medium text-[#171717]">Vulnerability Index:</span> percentile ranks of % aged 65+, poverty rate, and % no-vehicle households, averaged per block group.</p>
            <p><span className="font-medium text-[#171717]">Distance:</span> Euclidean in EPSG:2272 × 1.3 detour factor. 15-min walk = 1,250 m.</p>
            <p><span className="font-medium text-[#171717]">Solver:</span> Gurobi MILP with binary site-open and demand-assignment variables.</p>
          </div>
        </div>

        <hr className="border-[#c8e3d8]" />

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#171717] mb-3">Data Sources</h2>
          <div className="text-sm leading-relaxed text-[#54494B] space-y-2">
            <p><span className="font-medium text-[#171717]">1,050 block groups:</span> Census TIGER/Line + ACS 2022 demographics.</p>
            <p><span className="font-medium text-[#171717]">87 candidate sites:</span> WPRDC facilities (rec centers, libraries, pools, senior centers).</p>
            <p><span className="font-medium text-[#171717]">5 existing centers:</span> currently designated City of Pittsburgh cooling centers.</p>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-[#c8e3d8] text-xs text-[#54494B] leading-relaxed">
        WPRDC · Census ACS 2022 · OpenStreetMap<br />
        Gurobi MILP · 55 scenarios
      </div>
    </aside>
  );
}
