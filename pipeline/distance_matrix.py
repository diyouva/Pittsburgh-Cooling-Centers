"""Compute distance matrix using OSMnx street-network walking distances."""

import numpy as np
import pandas as pd
import geopandas as gpd
import osmnx as ox
import networkx as nx
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from config import DATA_PROCESSED, CRS_GEO

GRAPH_CACHE = DATA_PROCESSED / "allegheny_walk_graph.graphml"


def get_walking_graph():
    if GRAPH_CACHE.exists():
        print("Loading cached walking graph...")
        return ox.load_graphml(GRAPH_CACHE)

    print("Downloading Allegheny County walking network (this may take a few minutes)...")
    G = ox.graph_from_place("Allegheny County, Pennsylvania, USA", network_type="walk")
    ox.save_graphml(G, GRAPH_CACHE)
    print(f"Graph saved: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    return G


def compute_distance_matrix() -> np.ndarray:
    bg = gpd.read_file(DATA_PROCESSED / "block_groups.geojson")
    sites = gpd.read_file(DATA_PROCESSED / "candidate_sites.geojson")

    G = get_walking_graph()

    bg_centroids = bg.geometry.centroid
    bg_lats = bg_centroids.y.values
    bg_lons = bg_centroids.x.values

    site_lats = sites.geometry.y.values
    site_lons = sites.geometry.x.values

    print("Snapping sites to nearest network nodes...")
    site_nodes = ox.nearest_nodes(G, site_lons, site_lats)

    print("Snapping block group centroids to nearest network nodes...")
    bg_nodes = ox.nearest_nodes(G, bg_lons, bg_lats)

    n_bg = len(bg)
    n_sites = len(sites)
    dist_matrix = np.full((n_bg, n_sites), np.inf)

    print(f"Computing shortest paths from {n_sites} sites to {n_bg} block groups...")
    for j, site_node in enumerate(site_nodes):
        site_name = sites.iloc[j]["site_name"]
        print(f"  [{j+1:2d}/{n_sites}] {site_name}...", end="", flush=True)

        try:
            lengths = nx.single_source_dijkstra_path_length(G, site_node, weight="length")
        except nx.NetworkXError:
            print(" UNREACHABLE")
            continue

        reachable = 0
        for i, bg_node in enumerate(bg_nodes):
            if bg_node in lengths:
                dist_matrix[i, j] = lengths[bg_node]
                reachable += 1

        print(f" {reachable}/{n_bg} reachable")

    unreachable = np.isinf(dist_matrix)
    if unreachable.any():
        n_inf = unreachable.sum()
        print(f"\nWarning: {n_inf} unreachable pairs ({n_inf / dist_matrix.size * 100:.1f}%)")
        max_finite = np.nanmax(dist_matrix[~unreachable])
        dist_matrix[unreachable] = max_finite * 1.5
        print(f"  Filled with {max_finite * 1.5:.0f} m (1.5x max reachable distance)")

    dist_df = pd.DataFrame(
        dist_matrix,
        index=bg["GEOID"].values,
        columns=sites["site_id"].values.astype(int),
    )
    dist_df.index.name = "GEOID"
    dist_df.to_csv(DATA_PROCESSED / "distance_matrix.csv")

    print(f"\nDistance matrix: {dist_df.shape}")
    print(f"  Min distance: {dist_matrix.min():.0f} m")
    print(f"  Max distance: {dist_matrix.max():.0f} m")
    print(f"  Mean distance: {dist_matrix.mean():.0f} m")
    return dist_matrix


if __name__ == "__main__":
    compute_distance_matrix()
