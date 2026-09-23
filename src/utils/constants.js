export const MAX_WALK_METERS = 1250;

export const OBJECTIVES = [
  { key: 'min_total_distance', label: 'Minimize Total Distance', short: 'Total Dist.', color: '#2563eb', description: 'Places new centers where they reduce the sum of all walking distances - treats every block group equally.' },
  { key: 'min_pop_weighted', label: 'Minimize Pop-Weighted Distance', short: 'Pop-Weighted', color: '#059669', description: 'Weights by population so denser neighborhoods pull centers toward them.' },
  { key: 'min_vuln_weighted', label: 'Minimize Vulnerability-Weighted Distance', short: 'Vuln-Weighted', color: '#B33951', description: 'Weights by vulnerability (age 65+, poverty, no vehicle) - directs centers toward the most heat-vulnerable.' },
  { key: 'min_worst_case', label: 'Minimize Worst-Case Distance', short: 'Worst-Case', color: '#7c3aed', description: 'Minimizes the longest distance any block group must travel - focuses on the absolute worst-served area.' },
  { key: 'max_coverage', label: 'Maximize 15-Min Walk Coverage', short: 'Coverage', color: '#d97706', description: 'Maximizes population within a 15-minute walk (1,250 m) of a cooling center.' },
];

export const OBJ_MAP = Object.fromEntries(OBJECTIVES.map(o => [o.key, o]));
export const OBJ_COLOR_MAP = Object.fromEntries(OBJECTIVES.map(o => [o.short, o.color]));

export const PGH_CENTER = [40.4406, -79.9959];
export const MAP_BOUNDS = [[40.36, -80.10], [40.50, -79.86]];

export const DISTANCE_COLORS = ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#8e44ad'];
