"""Run the full pipeline: collect → filter → distances → optimize → export."""

import json
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
PUBLIC_DATA = PROJECT_ROOT / "public" / "data"

from pipeline.data_collection import collect_all
from pipeline.distance_matrix import compute_distance_matrix
from pipeline.optimization import run_scenario_analysis, load_data

import geopandas as gpd


def export_dashboard_json(scenarios, assignments):
    """Export JSON files consumed by the React dashboard."""
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)

    from config import DATA_PROCESSED

    bg = gpd.read_file(DATA_PROCESSED / "block_groups.geojson")
    sites = gpd.read_file(DATA_PROCESSED / "candidate_sites.geojson")

    with open(PUBLIC_DATA / "scenario_results.json", "w") as f:
        json.dump(scenarios, f)

    with open(PUBLIC_DATA / "assignments.json", "w") as f:
        json.dump(assignments, f)

    sites_json = []
    for _, s in sites.iterrows():
        sites_json.append({
            "site_id": int(s["site_id"]),
            "site_name": s["site_name"],
            "type": s["type"],
            "lat": float(s["latitude"]),
            "lon": float(s["longitude"]),
            "is_existing": bool(s["is_existing_center"]),
        })
    with open(PUBLIC_DATA / "candidate_sites.json", "w") as f:
        json.dump(sites_json, f)

    cols = [c for c in ["GEOID", "total_pop", "pop_65_plus", "pct_65_plus",
                        "poverty_rate", "pct_no_vehicle", "vulnerability_score",
                        "geometry"]
            if c in bg.columns]
    bg[cols].to_file(PUBLIC_DATA / "block_groups.json", driver="GeoJSON")

    print(f"  scenario_results.json: {len(scenarios)} scenarios")
    print(f"  assignments.json: {len(assignments)} sets")
    print(f"  candidate_sites.json: {len(sites_json)} sites")
    print(f"  block_groups.json: {len(bg)} block groups")


if __name__ == "__main__":
    t0 = time.time()

    print("=" * 60)
    print("STEP 1: Collect & filter data (Pittsburgh only)")
    print("=" * 60)
    candidates, block_groups = collect_all()

    print("\n" + "=" * 60)
    print("STEP 2: Compute street-network distance matrix")
    print("=" * 60)
    compute_distance_matrix()

    print("\n" + "=" * 60)
    print("STEP 3: Solve all 55 Gurobi MILP scenarios")
    print("=" * 60)
    scenarios, assignments = run_scenario_analysis()

    print("\n" + "=" * 60)
    print("STEP 4: Export JSON for dashboard")
    print("=" * 60)
    export_dashboard_json(scenarios, assignments)

    elapsed = time.time() - t0
    print(f"\n{'=' * 60}")
    print(f"PIPELINE COMPLETE in {elapsed:.0f}s")
    print(f"  {len(block_groups)} block groups | {len(candidates)} sites")
    print(f"  Population: {block_groups['total_pop'].sum():,.0f}")
    print(f"  {len(scenarios)} scenarios solved")
    print(f"{'=' * 60}")
