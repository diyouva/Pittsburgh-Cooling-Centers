import { useState, useEffect } from 'react';

export function useData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('./data/scenario_results.json').then(r => r.json()),
      fetch('./data/candidate_sites.json').then(r => r.json()),
      fetch('./data/block_groups.json').then(r => r.json()),
      fetch('./data/assignments.json').then(r => r.json()),
    ]).then(([scenarios, sites, blockGroups, assignments]) => {
      setData({ scenarios, sites, blockGroups, assignments });
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

export function getScenario(scenarios, objective, nNew) {
  return scenarios.find(s => s.objective === objective && s.n_new === nNew);
}

export function getAssignmentMap(assignments, objective, nNew) {
  const key = `${objective}_${nNew}`;
  const arr = assignments[key];
  if (!arr) return {};
  const map = {};
  for (const a of arr) {
    map[a.geoid] = a;
  }
  return map;
}

export function computeHistogramBins(distancesKm, binCount = 40) {
  if (!distancesKm.length) return [];
  const max = Math.max(...distancesKm);
  const binWidth = max / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    x: Math.round((i * binWidth + binWidth / 2) * 10) / 10,
    count: 0,
    rangeStart: Math.round(i * binWidth * 10) / 10,
    rangeEnd: Math.round((i + 1) * binWidth * 10) / 10,
  }));
  for (const d of distancesKm) {
    const idx = Math.min(Math.floor(d / binWidth), binCount - 1);
    bins[idx].count++;
  }
  return bins;
}

export function getP90(distancesKm) {
  if (!distancesKm.length) return 0;
  const sorted = [...distancesKm].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.9)];
}
