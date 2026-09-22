# Where Should Pittsburgh Open Its Next Cooling Centers?

An equity-aware facility location optimization model for heat-wave shelter access in Allegheny County, PA.

![Python](https://img.shields.io/badge/Python-3.9+-blue)
![Gurobi](https://img.shields.io/badge/Solver-Gurobi-red)
![React](https://img.shields.io/badge/Dashboard-React_19-61DAFB)

## Problem

Pittsburgh currently operates only **5 cooling centers** during heat emergencies - placed wherever public buildings happen to be, not where vulnerable residents actually live. With only **2.7%** of Allegheny County's population within a 15-minute walk of a center, the current network is severely inadequate for pedestrian access.

This project answers: **if the city had the budget to open 5-10 new cooling centers, where should they go?**

## Approach

1. **Data Collection** - 87 candidate sites (rec centers, libraries, pools, senior centers) from WPRDC and 1,050 census block groups with demographics from ACS 2022
2. **Vulnerability Index** - Composite score (0-1) from percentile ranks of: % population 65+, poverty rate, % households without a vehicle
3. **Distance Matrix** - Euclidean distances in EPSG:2272 (PA State Plane South) with a 1.3x urban detour factor; 15-minute walk threshold = 1,250 m
4. **MILP Optimization** - Gurobi solver with binary facility-open and demand-assignment variables, solved under 5 objectives:

| Objective | What It Optimizes |
|---|---|
| **Total Distance** | Minimize sum of all walking distances |
| **Pop-Weighted** | Weight by population - helps the most people |
| **Vuln-Weighted** | Weight by vulnerability - directs centers toward seniors, low-income, car-free households |
| **Worst-Case** | Minimize the maximum distance any block group must travel (minimax) |
| **Coverage** | Maximize population within a 15-minute walk |

5. **Scenario Analysis** - All 5 objectives x budgets 0-10 (55 runs) to visualize trade-offs
6. **Interactive Dashboard** - React dashboard with interactive map, scenario charts, and objective comparison

## Tech Stack

### Python Pipeline
| Tool | Purpose |
|---|---|
| **Python 3.9+** | Core language |
| **GeoPandas** | Geospatial data processing |
| **Gurobi** | MILP optimization solver |
| **NumPy / Pandas** | Numerical computation and data wrangling |
| **Requests** | API calls (WPRDC, Census) |

### React Dashboard
| Tool | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool and dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **Leaflet / react-leaflet 5** | Interactive choropleth map |
| **Recharts 3** | Line charts, bar charts, histograms |

## Key Finding

The **vulnerability-weighted** objective achieves nearly the same average distance as pure efficiency objectives while directing coverage toward the most heat-vulnerable populations. Equity does not come at a significant average cost.

---

## Project Structure

```
├── config.py                        # Central configuration (paths, API keys, parameters)
├── requirements.txt                 # Python dependencies
├── package.json                     # Node dependencies (React dashboard)
├── vite.config.js                   # Vite + React + Tailwind CSS 4
├── index.html                       # Dashboard HTML entry point
│
├── pipeline/                        # Python data pipeline
│   ├── data_collection.py           # WPRDC facilities, Census ACS, vulnerability index
│   ├── distance_matrix.py           # Block-group centroid to candidate site distances
│   └── optimization.py              # Gurobi MILP solver + scenario analysis
│
├── src/                             # React dashboard source
│   ├── App.jsx                      # Root layout component
│   ├── main.jsx                     # React 19 entry point
│   ├── index.css                    # Global styles and theme
│   ├── hooks/useData.js             # Data fetching + distance computation
│   ├── utils/constants.js           # Objectives, colors, thresholds
│   └── components/
│       ├── Sidebar.jsx              # Controls: objective dropdown, budget slider
│       ├── MapView.jsx              # Leaflet choropleth + site markers
│       ├── MetricCard.jsx           # Summary metric cards
│       ├── SiteList.jsx             # Selected sites panel
│       ├── ScenarioCharts.jsx       # Multi-line scenario analysis charts
│       ├── DistributionChart.jsx    # Distance histogram with reference lines
│       ├── ComparisonTable.jsx      # Objective comparison table
│       ├── HelpToggle.jsx           # Expandable help panel
│       └── SkeletonCard.jsx         # Loading placeholders
│
├── notebooks/
│   └── eda.ipynb                    # Exploratory data analysis
│
├── data/
│   ├── raw/                         # Raw data downloads
│   │   ├── census_acs_bg.csv        # Census ACS 2022 block group demographics
│   │   ├── facilities.geojson       # WPRDC city facilities
│   │   └── libraries.geojson        # Carnegie Library locations
│   ├── processed/                   # Pipeline intermediate outputs
│   │   ├── block_groups.geojson     # Block groups with demographics + vulnerability
│   │   ├── candidate_sites.geojson  # 87 candidate facility locations
│   │   └── distance_matrix.csv      # 1,050 x 87 walking distance matrix (meters)
│   └── output/                      # Optimization results
│       ├── scenario_results.csv     # All 55 scenarios (5 objectives x 11 budgets)
│       └── assignment_details_5new.csv  # Block group assignments at n_new=5
│
└── public/data/                     # Pre-computed JSON for the dashboard
    ├── scenario_results.json
    ├── candidate_sites.json
    ├── block_groups.json
    └── assignments.json
```

---

## Pipeline: From Raw Data to Dashboard

The project follows a three-stage pipeline, then serves results through a React dashboard:

```
Stage 1: Data Collection          Stage 2: Distance Matrix         Stage 3: Optimization
┌──────────────────────┐         ┌─────────────────────┐         ┌──────────────────────┐
│ data_collection.py   │         │ distance_matrix.py   │         │ optimization.py      │
│                      │         │                      │         │                      │
│ - WPRDC facilities   │────────>│ - Project to         │────────>│ - Gurobi MILP solver │
│ - Census ACS 2022    │         │   EPSG:2272          │         │ - 5 objectives       │
│ - Vulnerability index│         │ - Euclidean distance │         │ - Budgets 0-10       │
│                      │         │ - x1.3 detour factor │         │ - 55 scenario runs   │
└──────────────────────┘         └─────────────────────┘         └──────────────────────┘
                                                                           │
                                                                           v
                                                                  ┌────────────────┐
                                                                  │ CSV outputs     │
                                                                  │ + JSON exports  │
                                                                  └───────┬────────┘
                                                                          │
                                                                          v
                                                               ┌──────────────────┐
                                                               │ React Dashboard  │
                                                               │ (client-side)    │
                                                               │ Pre-computed JSON │
                                                               │ No server needed │
                                                               └──────────────────┘
```

### Stage 1: Data Collection (`pipeline/data_collection.py`)

- Fetches **city facility locations** from the WPRDC API (recreation centers, senior centers, pools)
- Fetches **Carnegie Library locations** from WPRDC
- Adds **5 existing cooling centers** and **13 additional candidate sites** (hardcoded in `config.py`)
- Downloads **Census ACS 2022** block-group demographics via the Census API (population, age 65+, poverty, vehicle access)
- Downloads **TIGER/Line 2022** block-group boundary shapefiles
- Computes a **composite vulnerability index** (average of percentile ranks of three indicators)
- Outputs: `data/raw/` CSV and GeoJSON files, `data/processed/` enriched GeoJSON files

### Stage 2: Distance Matrix (`pipeline/distance_matrix.py`)

- Projects block-group centroids and candidate sites to **EPSG:2272** (PA State Plane South, feet)
- Computes **Euclidean distances** between all 1,050 block groups and 87 candidate sites
- Applies a **1.3x detour factor** to approximate actual walking paths
- Converts from feet to meters
- Outputs: `data/processed/distance_matrix.csv` (1,050 x 87 matrix)

### Stage 3: Optimization (`pipeline/optimization.py`)

- Loads processed data and distance matrix
- Runs a **Gurobi MILP** model for each (objective, budget) combination:
  - Binary variables: site open/close, demand-to-site assignment
  - Constraint: existing 5 centers always open, exactly N new sites selected
  - 5 objective functions (total distance, pop-weighted, vuln-weighted, worst-case, coverage)
- Runs **55 scenarios** (5 objectives x 11 budget levels, 0-10 new centers)
- Saves detailed block-group assignments for the n_new=5 case
- Outputs: `data/output/scenario_results.csv`, `data/output/assignment_details_5new.csv`

---

## Dashboard

Client-side dashboard built with **React 19 + Vite 8 + Tailwind CSS 4**. Uses pre-computed JSON data from `public/data/` — no server or Gurobi needed.

```bash
npm install
npm run dev
```

### How to Use

**1. Choose an Optimization Objective** — Use the dropdown in the sidebar to select one of five objectives, each reflecting a different equity priority.

**2. Adjust the Budget** — Drag the slider (0 to 10) to set the number of new cooling centers. The map, metrics, site list, and all charts update instantly.

**3. Explore the Map** — Block groups are color-coded by walking distance (green = close, purple = far). Blue markers = existing centers, cranberry markers = newly recommended sites. Hover for distance, population, and assigned center details.

**4. Analyze Trade-offs** — Scenario Analysis charts show how each additional center improves access. The Distance Distribution histogram shows the walking distance spread with 15-minute walk and P90 reference lines. The Objective Comparison table displays all five objectives side by side.

Each chart section has a **?** button with in-context help.

### Architecture

```
public/data/*.json
       |
       v
  useData() hook    -->  fetches 4 JSON files on mount
       |
       v
  App.jsx           -->  holds state: objective + nNew
       |                  derives scenario via getScenario()
       |                  derives assignmentMap via getAssignmentMap()
       v
  Components        -->  receive data + scenario as props
                          some compute derived values client-side
```

**100% client-side** — all optimization was run offline (Gurobi MILP). The dashboard loads pre-computed JSON and performs only lightweight client-side computation (distance calculations for the histogram).

**Dynamic distance computation** — `assignments.json` only contains block group assignments for `n_new=5`. For the histogram to work at any slider value, distances are computed on the fly using Euclidean distance with a 1.3 detour factor.

### Components

| Component | Description |
|---|---|
| `App.jsx` | Root layout, manages `objective` and `nNew` state |
| `Sidebar.jsx` | Controls panel: objective dropdown, budget slider, methodology |
| `MapView.jsx` | Leaflet choropleth + CircleMarker overlays (custom Pane, zIndex 650) |
| `MetricCard.jsx` | Animated summary metric cards with staggered fade-in |
| `SiteList.jsx` | Scrollable selected sites list (new sites sorted first) |
| `ScenarioCharts.jsx` | Multi-line Recharts with three tabs and clickable legend |
| `DistributionChart.jsx` | Dynamic histogram with 15-min walk and P90 reference lines |
| `ComparisonTable.jsx` | Side-by-side comparison of all objectives at selected budget |
| `HelpToggle.jsx` | Reusable expandable help panel |
| `SkeletonCard.jsx` | Loading skeleton placeholders |

### Styling

Tailwind CSS 4 with custom theme tokens:

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#B33951` | Cranberry — primary accent, new site markers |
| `--color-sage` | `#91C7B1` | Sage green — map borders, chart backgrounds |
| `--color-gold` | `#E3D081` | Warm gold — metric cards, comparison table |
| `--color-warm` | `#54494B` | Warm gray — body text |

Typography: Inter (Google Fonts) with system fallbacks. Page background: cream `#f7f5f0`.

---

## Setup

### Prerequisites

- Python 3.9+
- [Gurobi](https://www.gurobi.com/) with a valid license (academic licenses are free)
- A [Census API key](https://api.census.gov/data/key_signup.html)
- Node.js 18+ (for the React dashboard)

### Installation

```bash
git clone https://github.com/diyouva/Pittsburgh-Cooling-Centers.git
cd Pittsburgh-Cooling-Centers
pip install -r requirements.txt
```

Create a `.env` file with your Census API key:

```
CENSUS_API_KEY=your_key_here
```

### Run the Pipeline

```bash
# Stage 1: Collect data from WPRDC and Census
python -c "from pipeline.data_collection import collect_all; collect_all()"

# Stage 2: Compute walking distance matrix
python -c "from pipeline.distance_matrix import compute_distance_matrix; compute_distance_matrix()"

# Stage 3: Run optimization across all scenarios
python -c "from pipeline.optimization import run_scenario_analysis; run_scenario_analysis()"
```

### Launch Dashboard

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

Outputs to `dist/`. The `base: './'` config makes the build deployable from any subdirectory (e.g., GitHub Pages).

---

## Data Files Reference

### Pipeline Data (`data/`)

| File | Location | Source | Description |
|---|---|---|---|
| `census_acs_bg.csv` | raw/ | Census ACS 2022 | Block group demographics |
| `facilities.geojson` | raw/ | WPRDC | City of Pittsburgh facilities |
| `libraries.geojson` | raw/ | WPRDC | Carnegie Library locations |
| `block_groups.geojson` | processed/ | Pipeline | 1,050 block groups with vulnerability index |
| `candidate_sites.geojson` | processed/ | Pipeline | 87 candidate facility locations |
| `distance_matrix.csv` | processed/ | Pipeline | 1,050 x 87 walking distance matrix (meters) |
| `scenario_results.csv` | output/ | Pipeline | All 55 scenarios: metrics + selected sites |
| `assignment_details_5new.csv` | output/ | Pipeline | Block group assignments at n_new=5 |

### Dashboard Data (`public/data/`)

| File | Description |
|---|---|
| `scenario_results.json` | 55 optimization results (5 objectives x 11 budgets) |
| `candidate_sites.json` | 87 candidate sites (id, name, type, lat, lon, is_existing) |
| `block_groups.json` | GeoJSON with demographics for map rendering |
| `assignments.json` | Block group to site assignments keyed by objective (n_new=5 only) |

---

## Technical Details

- **Solver**: Gurobi Mixed-Integer Linear Program (MILP) with binary variables for site selection and demand assignment
- **Projection**: EPSG:2272 (PA State Plane South, feet) for distance calculations
- **Walk model**: Euclidean distance x 1.3 detour factor; 15 min x 5 km/h = 1,250 m threshold
- **Map rendering**: GeoJSON choropleth with custom Leaflet Pane (zIndex 650) for markers above fill; 5-stop green-to-purple gradient
- **Charts**: Recharts 3 with categorical XAxis; `nearestBin()` snaps reference lines to valid bin labels

## Data Sources

- **[WPRDC](https://data.wprdc.org/)** - City of Pittsburgh facilities, Carnegie Library locations
- **[U.S. Census ACS 2022](https://www.census.gov/programs-surveys/acs)** - Block-group demographics (population, age, poverty, vehicle access)
- **[TIGER/Line 2022](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html)** - Block-group boundary shapefiles
- **[OpenStreetMap](https://www.openstreetmap.org/)** - Base map tiles

## License

MIT
