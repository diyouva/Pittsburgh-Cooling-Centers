import { OBJECTIVES, OBJ_MAP } from '../utils/constants';

export default function Sidebar({ objective, setObjective, nNew, setNNew }) {
  const obj = OBJ_MAP[objective];

  return (
    <aside className="w-full lg:w-96 shrink-0 bg-[#eef6f2] border-r border-[#c8e3d8] p-6 flex flex-col gap-5">

      {/* 1. How to Use */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717] mb-2">How to Use</h3>
        <div className="text-xs leading-relaxed text-[#54494B] space-y-2">
          <p>
            <span className="font-medium text-[#171717]">Step 1.</span> Choose an optimization objective from the dropdown below. Each objective reflects a different equity priority for placing new cooling centers.
          </p>
          <p>
            <span className="font-medium text-[#171717]">Step 2.</span> Adjust the slider to set the number of new centers (0 to 10). The map, metrics, and site list update instantly to show the optimal placement for that budget.
          </p>
          <p>
            <span className="font-medium text-[#171717]">Step 3.</span> Hover over block groups on the map to see walking distance, population, and the assigned nearest center. Blue markers are existing centers; red markers are newly recommended sites.
          </p>
          <p>
            <span className="font-medium text-[#171717]">Step 4.</span> Scroll down to compare how all five objectives perform across budget levels in the Scenario Analysis charts, and review the Objective Comparison table for a side by side summary at five new centers.
          </p>
        </div>
      </div>

      <hr className="border-[#c8e3d8]" />

      {/* 2. Model Controls */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[#B33951] animate-pulse" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#171717]">Model Controls</h2>
        </div>
        <p className="text-xs text-[#54494B] mb-3">Configure the optimization parameters</p>

        <label className="block text-xs font-medium text-[#54494B] uppercase tracking-wider mb-2">
          Optimization Objective
        </label>
        <select
          value={objective}
          onChange={e => setObjective(e.target.value)}
          className="w-full bg-[#fdfbf3] border border-[#d9cc9e] rounded-lg px-3 py-2.5 text-sm text-[#171717]
            focus:outline-none focus:ring-2 focus:ring-[#B33951]/30 focus:border-[#B33951]
            cursor-pointer appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2354494B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '1.25em',
          }}
        >
          {OBJECTIVES.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>

        <div
          className="rounded-lg p-3 border text-xs leading-relaxed text-[#54494B] mt-3"
          style={{ borderColor: obj.color + '30', backgroundColor: obj.color + '08' }}
        >
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: obj.color }} />
          {obj.description}
        </div>

        <label className="block text-xs font-medium text-[#54494B] uppercase tracking-wider mb-2 mt-4">
          New Centers to Add
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={10}
            value={nNew}
            onChange={e => setNNew(Number(e.target.value))}
            className="flex-1 cursor-pointer"
          />
          <span className="text-2xl font-bold text-[#B33951] w-8 text-center">{nNew}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      <hr className="border-[#c8e3d8]" />

      {/* 3. Methodology */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717] mb-2">Methodology</h3>
        <div className="text-xs leading-relaxed text-[#54494B] space-y-2">
          <p>
            <span className="font-medium text-[#171717]">1. Vulnerability Index</span><br />
            Three Census ACS 2022 indicators (population aged 65+, poverty rate, and households without a vehicle) are converted to percentile ranks, then averaged into a single composite score per block group.
          </p>
          <p>
            <span className="font-medium text-[#171717]">2. Distance Computation</span><br />
            Walking distance from each block group centroid to every candidate site is estimated as Euclidean distance multiplied by a 1.3 urban detour factor. A 15 minute walk equals approximately 1,250 meters.
          </p>
          <p>
            <span className="font-medium text-[#171717]">3. MILP Optimization</span><br />
            A Mixed Integer Linear Program (solved with Gurobi) selects exactly N new sites from the candidate pool. The solver runs under five different objective functions, each reflecting a distinct equity lens.
          </p>
        </div>
      </div>

      <hr className="border-[#c8e3d8]" />

      {/* 4. Data Sources */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717] mb-2">Data Sources</h3>
        <div className="text-xs leading-relaxed text-[#54494B] space-y-2">
          <p>
            <span className="font-medium text-[#171717]">Census Block Groups</span><br />
            1,050 block groups in Allegheny County from the U.S. Census TIGER/Line shapefiles with demographic variables drawn from the American Community Survey (ACS) 2022 five year estimates.
          </p>
          <p>
            <span className="font-medium text-[#171717]">Candidate Sites</span><br />
            87 public facility locations sourced from the Western Pennsylvania Regional Data Center (WPRDC), including community centers, senior centers, pools, recreation facilities, and libraries.
          </p>
          <p>
            <span className="font-medium text-[#171717]">Existing Cooling Centers</span><br />
            5 currently designated cooling centers in the City of Pittsburgh, used as fixed sites in every optimization scenario.
          </p>
        </div>
      </div>

      <hr className="border-[#c8e3d8]" />

      {/* 5. Fixed Cooling Centers */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717] mb-2">Fixed Cooling Centers</h3>
        <p className="text-xs text-[#54494B] mb-2">These 5 centers are always active in every scenario</p>
        <div className="space-y-1.5">
          {['Greenfield Senior Center', 'Homewood Senior Center', 'Sheraden Senior Center', 'South Side Senior Center', 'Mount Washington Senior Center'].map(name => (
            <div key={name} className="flex items-center gap-2 text-xs text-[#54494B]">
              <span className="w-2 h-2 rounded-full shrink-0 bg-[#2563eb]" />
              {name}
            </div>
          ))}
        </div>
      </div>

      <hr className="border-[#c8e3d8]" />

      {/* 6. Objectives at a Glance */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717] mb-2">Objectives at a Glance</h3>
        <div className="space-y-2">
          {OBJECTIVES.map(o => (
            <div key={o.key} className="flex items-start gap-2 text-xs">
              <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: o.color }} />
              <div>
                <span className="font-medium text-[#171717]">{o.short}</span>
                <p className="text-[#54494B] leading-relaxed">{o.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
}
