# Where Should Pittsburgh Open Its Next Cooling Centers?

An equity-aware facility location optimization model for heat-wave shelter access in Pittsburgh, PA.

![Python](https://img.shields.io/badge/Python-3.9+-blue)
![Gurobi](https://img.shields.io/badge/Solver-Gurobi-red)
![React](https://img.shields.io/badge/Dashboard-React_19-61DAFB)

## Problem

Pittsburgh currently activates only **5 cooling centers** during heat emergencies - placed wherever public buildings happen to be, not where vulnerable residents actually live. With only **10%** of Pittsburgh's population within a 15-minute walk of a center, the current network is severely inadequate for pedestrian access.

This project answers: **if the city had the budget to open 5-10 new cooling centers, where should they go?**

## Approach

1. **Data Collection** - 86 candidate sites (rec centers, libraries, pools, senior centers) from WPRDC and 305 census block groups within Pittsburgh city limits, with demographics from ACS 2022
2. **Vulnerability Index** - Composite score (0-1) from percentile ranks of: % population 65+, poverty rate, % households without a vehicle
3. **Distance Matrix** - OSMnx street-network walking distances via Dijkstra shortest paths on OpenStreetMap's pedestrian network; 15-minute walk threshold = 1,250 m
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
| **OSMnx 2.x** | Street-network graph + Dijkstra walking distances |
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
├── run_pipeline.py                  # Master script: collect → distances → optimize → export
├── requirements.txt                 # Python dependencies
├── package.json                     # Node dependencies (React dashboard)
├── vite.config.js                   # Vite + React + Tailwind CSS 4
├── index.html                       # Dashboard HTML entry point
│
├── pipeline/                        # Python data pipeline
│   ├── data_collection.py           # WPRDC facilities, Census ACS, Pittsburgh filter, vulnerability
│   ├── distance_matrix.py           # OSMnx street-network walking distances (Dijkstra)
│   └── optimization.py              # Gurobi MILP solver + scenario analysis
│
├── src/                             # React dashboard source
│   ├── App.jsx                      # Root layout component
│   ├── main.jsx                     # React 19 entry point
│   ├── index.css                    # Global styles and theme
│   ├── hooks/useData.js             # Data fetching and assignment map
│   ├── utils/constants.js           # Objectives, colors, thresholds
│   └── components/
│       ├── Sidebar.jsx              # Controls: objective selector, budget slider
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
│   │   └── census_acs_bg.csv        # Census ACS 2022 block group demographics
│   ├── processed/                   # Pipeline intermediate outputs
│   │   ├── block_groups.geojson     # 305 Pittsburgh block groups with vulnerability
│   │   ├── candidate_sites.geojson  # 86 candidate facility locations
│   │   ├── distance_matrix.csv      # 305 x 86 walking distance matrix (meters)
│   │   └── allegheny_walk_graph.graphml  # Cached OSMnx walking network
│   └── output/                      # Optimization results
│       └── scenario_results.csv     # All 55 scenarios (5 objectives x 11 budgets)
│
└── public/data/                     # Pre-computed JSON for the dashboard
    ├── scenario_results.json
    ├── candidate_sites.json
    ├── block_groups.json
    └── assignments.json             # All 55 scenario assignments (305 BGs each)
```

---

## Pipeline: From Raw Data to Dashboard

The project follows a three-stage pipeline, then serves results through a React dashboard. Run end-to-end with `python run_pipeline.py`.

```
Stage 1: Data Collection          Stage 2: Distance Matrix         Stage 3: Optimization
┌──────────────────────┐         ┌─────────────────────┐         ┌──────────────────────┐
│ data_collection.py   │         │ distance_matrix.py  │         │ optimization.py      │
│                      │         │                     │         │                      │
│ - WPRDC facilities   │────────>│ - OSMnx walking     │────────>│ - Gurobi MILP solver │
│ - Census ACS 2022    │         │   network graph     │         │ - 5 objectives       │
│ - Pittsburgh filter  │         │ - Dijkstra shortest │         │ - Budgets 0-10       │
│ - Vulnerability index│         │   paths             │         │ - 55 scenario runs   │
└──────────────────────┘         └─────────────────────┘         └──────────────────────┘
                                                                           │
                                                                           v
                                                                  ┌────────────────┐
                                                                  │ CSV outputs    │
                                                                  │ + JSON exports │
                                                                  └───────┬────────┘
                                                                          │
                                                                          v
                                                               ┌──────────────────┐
                                                               │ React Dashboard  │
                                                               │ (client-side)    │
                                                               │ Pre-computed JSON│
                                                               │ No server needed │
                                                               └──────────────────┘
```

### Stage 1: Data Collection (`pipeline/data_collection.py`)

- Fetches **city facility locations** from the WPRDC API (recreation centers, senior centers, pools)
- Fetches **Carnegie Library locations** from WPRDC
- Adds **5 existing cooling centers** and **13 additional candidate sites** (hardcoded in `config.py`)
- Downloads **Census ACS 2022** block-group demographics via the Census API (population, age 65+, poverty, vehicle access)
- Downloads **TIGER/Line 2022** block-group boundary shapefiles
- Filters to **Pittsburgh city** using OSMnx geocoding (centroid-within for block groups, point-within for sites)
- Computes a **composite vulnerability index** (average of percentile ranks of three indicators)
- Outputs: `data/processed/block_groups.geojson` (305 BGs), `data/processed/candidate_sites.geojson` (86 sites)

### Stage 2: Distance Matrix (`pipeline/distance_matrix.py`)

- Downloads the **Allegheny County walking network** from OpenStreetMap via OSMnx (cached as `allegheny_walk_graph.graphml`)
- Snaps block-group centroids and candidate sites to **nearest network nodes**
- Computes **Dijkstra shortest-path distances** from each site to all block groups
- Outputs: `data/processed/distance_matrix.csv` (305 x 86 matrix, meters)

### Stage 3: Optimization (`pipeline/optimization.py`)

- Loads processed data and distance matrix
- Runs a **Gurobi MILP** model for each (objective, budget) combination:
  - Binary variables: site open/close, demand-to-site assignment
  - Constraint: existing 5 centers always open, exactly N new sites selected
  - 5 objective functions (total distance, pop-weighted, vuln-weighted, worst-case, coverage)
- Runs **55 scenarios** (5 objectives x 11 budget levels, 0-10 new centers)
- Post-solve: reassigns each block group to its **nearest open site** (Gurobi may assign arbitrarily when the objective is indifferent)
- Exports all 55 scenario assignments to `public/data/assignments.json`
- Outputs: `data/output/scenario_results.csv`

---

## Dashboard

Client-side dashboard built with **React 19 + Vite 8 + Tailwind CSS 4**. Uses pre-computed JSON data from `public/data/` — no server or Gurobi needed.

```bash
npm install
npm run dev
```

### How to Use

**1. Choose an Optimization Objective** — Use the sidebar to select one of five objectives, each reflecting a different equity priority.

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
```

**100% client-side** — all optimization was run offline (Gurobi MILP). The dashboard loads pre-computed JSON with no server-side computation. `assignments.json` contains pre-computed OSMnx walking distances for all 55 scenarios (5 objectives x 11 budget levels), so the map and histogram always display accurate street-network distances.

### Components

| Component | Description |
|---|---|
| `App.jsx` | Root layout, manages `objective` and `nNew` state |
| `Sidebar.jsx` | Controls panel: objective selector, budget slider, methodology |
| `MapView.jsx` | Leaflet choropleth + CircleMarker overlays (custom Pane, zIndex 650) |
| `MetricCard.jsx` | Animated summary metric cards with staggered fade-in |
| `SiteList.jsx` | Scrollable selected sites list (new sites sorted first) |
| `ScenarioCharts.jsx` | Multi-line Recharts with three tabs and clickable legend |
| `DistributionChart.jsx` | Distance histogram using pre-computed OSMnx distances |
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
python run_pipeline.py
```

This runs all four stages end-to-end: data collection, Pittsburgh city filter, OSMnx distance matrix, Gurobi optimization (55 scenarios), and JSON export for the dashboard.

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
| `block_groups.geojson` | processed/ | Pipeline | 305 Pittsburgh block groups with vulnerability index |
| `candidate_sites.geojson` | processed/ | Pipeline | 86 candidate facility locations |
| `distance_matrix.csv` | processed/ | Pipeline | 305 x 86 street-network walking distance matrix (meters) |
| `allegheny_walk_graph.graphml` | processed/ | OSMnx | Cached Allegheny County walking network (~180K nodes) |
| `scenario_results.csv` | output/ | Pipeline | All 55 scenarios: metrics + selected sites |

### Dashboard Data (`public/data/`)

| File | Description |
|---|---|
| `scenario_results.json` | 55 optimization results (5 objectives x 11 budgets) |
| `candidate_sites.json` | 86 candidate sites (id, name, type, lat, lon, is_existing) |
| `block_groups.json` | GeoJSON with demographics for map rendering |
| `assignments.json` | Block group to site assignments for all 55 scenarios |

---

## Technical Details

- **Solver**: Gurobi Mixed-Integer Linear Program (MILP) with binary variables for site selection and demand assignment
- **Distance model**: OSMnx street-network walking distances via Dijkstra shortest paths on OpenStreetMap's pedestrian graph; 15 min x 5 km/h = 1,250 m walk threshold
- **Geographic scope**: Pittsburgh city limits (305 block groups filtered by centroid-within using OSMnx geocoding in EPSG:2272)
- **Map rendering**: GeoJSON choropleth with custom Leaflet Pane (zIndex 650) for markers above fill; 5-stop green-to-purple gradient scaled to the 95th percentile of scenario distances
- **Charts**: Recharts 3 with categorical XAxis; `nearestBin()` snaps reference lines to valid bin labels

## Data Sources

- **[WPRDC](https://data.wprdc.org/)** - City of Pittsburgh facilities, Carnegie Library locations
- **[U.S. Census ACS 2022](https://www.census.gov/programs-surveys/acs)** - Block-group demographics (population, age, poverty, vehicle access)
- **[TIGER/Line 2022](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html)** - Block-group boundary shapefiles
- **[OpenStreetMap](https://www.openstreetmap.org/)** - Walking network graph + base map tiles

## License

MIT
