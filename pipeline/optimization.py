"""Facility location MILP for cooling center placement using Gurobi.

Five objectives:
  1. min_total_distance     – minimize total walking distance
  2. min_pop_weighted       – minimize population-weighted distance
  3. min_vuln_weighted      – minimize vulnerability-weighted distance
  4. min_worst_case         – minimize maximum distance any block group must walk
  5. max_coverage           – maximize population within 15-min walk
"""

import numpy as np
import pandas as pd
import geopandas as gpd
import gurobipy as gp
from gurobipy import GRB
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from config import DATA_PROCESSED, DATA_OUTPUT, MAX_WALK_METERS


def load_data():
    bg = gpd.read_file(DATA_PROCESSED / "block_groups.geojson")
    sites = gpd.read_file(DATA_PROCESSED / "candidate_sites.geojson")
    dist = pd.read_csv(DATA_PROCESSED / "distance_matrix.csv", index_col="GEOID")
    dist.columns = dist.columns.astype(int)
    return bg, sites, dist


def solve_facility_location(
    dist_matrix: np.ndarray,
    existing_mask: np.ndarray,
    n_new: int,
    objective: str,
    population: np.ndarray | None = None,
    vulnerability: np.ndarray | None = None,
    max_walk: float = MAX_WALK_METERS,
) -> dict:
    n_demand, n_sites = dist_matrix.shape

    m = gp.Model("cooling_centers")
    m.setParam("OutputFlag", 0)
    m.setParam("MIPGap", 0.001)

    y = m.addVars(n_sites, vtype=GRB.BINARY, name="open")
    x = m.addVars(n_demand, n_sites, vtype=GRB.BINARY, name="assign")

    # existing centers stay open
    for j in range(n_sites):
        if existing_mask[j]:
            m.addConstr(y[j] == 1)

    # budget: open exactly n_new new sites
    n_existing = int(existing_mask.sum())
    m.addConstr(gp.quicksum(y[j] for j in range(n_sites)) == n_existing + n_new)

    # each demand point assigned to exactly one open site
    for i in range(n_demand):
        m.addConstr(gp.quicksum(x[i, j] for j in range(n_sites)) == 1)

    # can only assign to open sites
    for i in range(n_demand):
        for j in range(n_sites):
            m.addConstr(x[i, j] <= y[j])

    if population is None:
        population = np.ones(n_demand)
    if vulnerability is None:
        vulnerability = np.ones(n_demand)

    if objective == "min_total_distance":
        m.setObjective(
            gp.quicksum(dist_matrix[i, j] * x[i, j]
                        for i in range(n_demand) for j in range(n_sites)),
            GRB.MINIMIZE,
        )

    elif objective == "min_pop_weighted":
        m.setObjective(
            gp.quicksum(population[i] * dist_matrix[i, j] * x[i, j]
                        for i in range(n_demand) for j in range(n_sites)),
            GRB.MINIMIZE,
        )

    elif objective == "min_vuln_weighted":
        m.setObjective(
            gp.quicksum(vulnerability[i] * dist_matrix[i, j] * x[i, j]
                        for i in range(n_demand) for j in range(n_sites)),
            GRB.MINIMIZE,
        )

    elif objective == "min_worst_case":
        z = m.addVar(name="max_dist")
        for i in range(n_demand):
            m.addConstr(
                gp.quicksum(dist_matrix[i, j] * x[i, j] for j in range(n_sites)) <= z
            )
        m.setObjective(z, GRB.MINIMIZE)

    elif objective == "max_coverage":
        covered = {}
        for i in range(n_demand):
            for j in range(n_sites):
                if dist_matrix[i, j] <= max_walk:
                    covered[i, j] = 1
        m.setObjective(
            gp.quicksum(population[i] * x[i, j]
                        for (i, j) in covered.keys()),
            GRB.MAXIMIZE,
        )

    else:
        raise ValueError(f"Unknown objective: {objective}")

    m.optimize()

    if m.status != GRB.OPTIMAL:
        print(f"  Warning: solver status {m.status}")
        return None

    open_sites = [j for j in range(n_sites) if y[j].X > 0.5]
    assignments = {}
    for i in range(n_demand):
        for j in range(n_sites):
            if x[i, j].X > 0.5:
                assignments[i] = j
                break

    distances = np.array([dist_matrix[i, assignments[i]] for i in range(n_demand)])

    return {
        "objective": objective,
        "n_new": n_new,
        "open_sites": open_sites,
        "assignments": assignments,
        "distances": distances,
        "obj_value": m.objVal,
        "mean_distance": distances.mean(),
        "max_distance": distances.max(),
        "median_distance": np.median(distances),
        "p90_distance": np.percentile(distances, 90),
        "pop_covered_15min": population[distances <= max_walk].sum(),
        "pct_covered_15min": population[distances <= max_walk].sum() / population.sum() * 100,
    }


def run_scenario_analysis():
    DATA_OUTPUT.mkdir(parents=True, exist_ok=True)
    bg, sites, dist_df = load_data()

    dist_matrix = dist_df.values
    existing_mask = sites["is_existing_center"].values.astype(bool)
    population = bg["total_pop"].values.astype(float)
    vulnerability = bg["vulnerability_score"].values.astype(float)

    objectives = [
        "min_total_distance",
        "min_pop_weighted",
        "min_vuln_weighted",
        "min_worst_case",
        "max_coverage",
    ]
    budget_range = range(0, 11)

    all_scenarios = []
    all_assignments = {}

    for obj in objectives:
        print(f"\n--- Objective: {obj} ---")
        for n_new in budget_range:
            result = solve_facility_location(
                dist_matrix, existing_mask, n_new, obj,
                population, vulnerability,
            )
            if not result:
                print(f"  n_new={n_new:2d} | INFEASIBLE")
                continue

            open_ids = result["open_sites"]
            distances = result["distances"]

            scenario = {
                "objective": obj,
                "n_new": n_new,
                "mean_distance": float(distances.mean()),
                "max_distance": float(distances.max()),
                "median_distance": float(np.median(distances)),
                "p90_distance": float(np.percentile(distances, 90)),
                "pct_covered_15min": float(
                    population[distances <= MAX_WALK_METERS].sum()
                    / population.sum() * 100
                ),
                "open_site_ids": open_ids,
                "open_site_names": [
                    sites.iloc[j]["site_name"] for j in open_ids
                ],
            }
            all_scenarios.append(scenario)

            key = f"{obj}_{n_new}"
            arr = []
            for i, j in result["assignments"].items():
                arr.append({
                    "geoid": int(bg.iloc[i]["GEOID"]),
                    "site_id": int(sites.iloc[j]["site_id"]),
                    "site_name": sites.iloc[j]["site_name"],
                    "distance_m": round(float(distances[i]), 1),
                })
            all_assignments[key] = arr

            print(f"  n_new={n_new:2d} | mean={scenario['mean_distance']:,.0f}m "
                  f"| max={scenario['max_distance']:,.0f}m "
                  f"| coverage={scenario['pct_covered_15min']:.1f}%")

    results_df = pd.DataFrame(all_scenarios)
    results_df.to_csv(DATA_OUTPUT / "scenario_results.csv", index=False)

    print(f"\nScenario results: {len(all_scenarios)} scenarios")
    print(f"Assignments: {len(all_assignments)} scenario-assignment sets")
    return all_scenarios, all_assignments


if __name__ == "__main__":
    run_scenario_analysis()
