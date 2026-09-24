import { useState, useMemo } from 'react';
import { useData, getScenario, getAssignmentMap } from './hooks/useData';
import Sidebar from './components/Sidebar';
import MetricCard from './components/MetricCard';
import MapView from './components/MapView';
import ScenarioCharts from './components/ScenarioCharts';
import DistributionChart from './components/DistributionChart';
import ComparisonTable from './components/ComparisonTable';
import SiteList from './components/SiteList';
import SkeletonCard, { SkeletonMap, SkeletonChart } from './components/SkeletonCard';

export default function App() {
  const { data, loading } = useData();
  const [objective, setObjective] = useState('min_vuln_weighted');
  const [nNew, setNNew] = useState(5);

  const scenario = useMemo(
    () => data ? getScenario(data.scenarios, objective, nNew) : null,
    [data, objective, nNew]
  );

  const assignmentMap = useMemo(
    () => data ? getAssignmentMap(data.assignments, objective, nNew) : {},
    [data, objective, nNew]
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f7f5f0]">
      <Sidebar
        objective={objective}
        setObjective={setObjective}
        nNew={nNew}
        setNNew={setNNew}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading || !scenario ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <MetricCard label="Mean Distance" value={(scenario.mean_distance / 1000).toFixed(1)} unit="km" icon="📏" color="#2563eb" delay={0} />
                <MetricCard label="Max Distance" value={(scenario.max_distance / 1000).toFixed(1)} unit="km" icon="📐" color="#B33951" delay={100} />
                <MetricCard label="Median Distance" value={(scenario.median_distance / 1000).toFixed(1)} unit="km" icon="📊" color="#d97706" delay={200} />
                <MetricCard label="15-Min Coverage" value={scenario.pct_covered_15min.toFixed(1)} unit="%" icon="🎯" color="#059669" delay={300} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              {loading ? <SkeletonMap /> : (
                <MapView
                  blockGroups={data.blockGroups}
                  sites={data.sites}
                  scenario={scenario}
                  assignmentMap={assignmentMap}
                />
              )}
            </div>
            <div className="xl:h-[520px]">
              {loading ? <SkeletonChart /> : <SiteList sites={data.sites} scenario={scenario} />}
            </div>
          </div>

          {loading ? <SkeletonChart /> : <ScenarioCharts scenarios={data.scenarios} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <><SkeletonChart /><SkeletonChart /></>
            ) : (
              <>
                <DistributionChart scenario={scenario} assignmentMap={assignmentMap} />
                <ComparisonTable scenarios={data.scenarios} nNew={nNew} />
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
