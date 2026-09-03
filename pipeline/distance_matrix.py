"""Compute distance matrix from block-group centroids to candidate sites."""

import numpy as np
import pandas as pd
import geopandas as gpd
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from config import DATA_PROCESSED, CRS_PROJECTED, CRS_GEO

DETOUR_FACTOR = 1.3  # typical urban pedestrian detour  # typical urban pedestrian detour ratio


def compute_distance_matrix() -> np.ndarray:
    print("Loading data...")
    bg = gpd.read_file(DATA_PROCESSED / "block_groups.geojson")
    sites = gpd.read_file(DATA_PROCESSED / "candidate_sites.geojson")

    bg_proj = bg.to_crs(CRS_PROJECTED)
    sites_proj = sites.to_crs(CRS_PROJECTED)

    centroids = bg_proj.geometry.centroid
    cx = centroids.x.values
    cy = centroids.y.values

    sx = sites_proj.geometry.x.values
    sy = sites_proj.geometry.y.values

    print(f"Computing {len(bg)} x {len(sites)} distance matrix...")
    # CRS_PROJECTED is EPSG:2272 (PA State Plane South, feet)
    dx = cx[:, np.newaxis] - sx[np.newaxis, :]
    dy = cy[:, np.newaxis] - sy[np.newaxis, :]
    euclidean_ft = np.sqrt(dx ** 2 + dy ** 2)
    walking_meters = euclidean_ft * 0.3048 * DETOUR_FACTOR

    dist_df = pd.DataFrame(
        walking_meters,
        index=bg["GEOID"].values,
        columns=sites["site_id"].values.astype(int),
    )
    dist_df.index.name = "GEOID"
    dist_df.to_csv(DATA_PROCESSED / "distance_matrix.csv")
    print(f"Distance matrix: {dist_df.shape}")
    print(f"  Min distance: {walking_meters.min():.0f} m")
    print(f"  Max distance: {walking_meters.max():.0f} m")
    print(f"  Mean distance: {walking_meters.mean():.0f} m")
    return walking_meters


if __name__ == "__main__":
    compute_distance_matrix()
