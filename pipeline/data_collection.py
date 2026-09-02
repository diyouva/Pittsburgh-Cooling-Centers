"""Collect facility, demographic, and vulnerability data for the cooling-center model."""

import requests
import pandas as pd
import geopandas as gpd
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from config import (
    DATA_RAW, DATA_PROCESSED, WPRDC_BASE, WPRDC_FACILITIES_ID,
    WPRDC_LIBRARIES_ID, CENSUS_BASE, CENSUS_API_KEY, PA_STATE_FIPS,
    COUNTY_FIPS, EXISTING_COOLING_CENTERS,
    ADDITIONAL_CANDIDATE_SITES, CRS_GEO,
)


def fetch_wprdc_resource(resource_id: str, limit: int = 5000) -> pd.DataFrame:
    url = f"{WPRDC_BASE}?resource_id={resource_id}&limit={limit}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return pd.DataFrame(resp.json()["result"]["records"])


# ---------------------------------------------------------------------------
# 1. Candidate Sites
# ---------------------------------------------------------------------------

def collect_candidate_sites() -> gpd.GeoDataFrame:
    # City facilities (rec centers, pools)
    fac = fetch_wprdc_resource(WPRDC_FACILITIES_ID)
    fac = fac.dropna(subset=["latitude", "longitude"])
    fac["latitude"] = pd.to_numeric(fac["latitude"], errors="coerce")
    fac["longitude"] = pd.to_numeric(fac["longitude"], errors="coerce")
    fac = fac.dropna(subset=["latitude", "longitude"])

    candidate_types = ["Recreation", "Senior", "Community", "Health", "Pool"]
    mask = fac["type"].str.contains("|".join(candidate_types), case=False, na=False)
    fac_cand = fac[mask][["name", "latitude", "longitude", "type"]].copy()
    fac_cand = fac_cand.rename(columns={"name": "site_name"})
    print(f"  City facilities matching: {len(fac_cand)}")

    # Libraries
    libs = fetch_wprdc_resource(WPRDC_LIBRARIES_ID)
    libs = libs.dropna(subset=["Lat", "Lon"])
    libs["Lat"] = pd.to_numeric(libs["Lat"], errors="coerce")
    libs["Lon"] = pd.to_numeric(libs["Lon"], errors="coerce")
    libs = libs.dropna(subset=["Lat", "Lon"])
    libs_cand = libs[["Name", "Lat", "Lon"]].copy()
    libs_cand = libs_cand.rename(columns={"Name": "site_name", "Lat": "latitude", "Lon": "longitude"})
    libs_cand["type"] = "Library"
    print(f"  Libraries: {len(libs_cand)}")

    # Existing cooling centers (geocoded)
    existing = pd.DataFrame(EXISTING_COOLING_CENTERS)
    existing = existing.rename(columns={"lat": "latitude", "lon": "longitude", "name": "site_name"})
    existing["type"] = "Senior Center (Existing)"

    # Additional candidate sites (geocoded)
    additional = pd.DataFrame(ADDITIONAL_CANDIDATE_SITES)
    additional = additional.rename(columns={"lat": "latitude", "lon": "longitude", "name": "site_name"})
    additional["type"] = "Senior/Community Center"

    all_sites = pd.concat([existing, additional, fac_cand, libs_cand], ignore_index=True)
    all_sites = all_sites.drop_duplicates(subset=["site_name"]).reset_index(drop=True)

    gdf = gpd.GeoDataFrame(
        all_sites,
        geometry=gpd.points_from_xy(all_sites.longitude, all_sites.latitude),
        crs=CRS_GEO,
    )
    gdf["is_existing_center"] = gdf["type"] == "Senior Center (Existing)"
    gdf["site_id"] = range(len(gdf))
    gdf.to_file(DATA_PROCESSED / "candidate_sites.geojson", driver="GeoJSON")

    n_exist = gdf["is_existing_center"].sum()
    n_new = len(gdf) - n_exist
    print(f"  Total candidate sites: {len(gdf)} ({n_exist} existing + {n_new} potential)")
    return gdf


# ---------------------------------------------------------------------------
# 2. Census ACS Block-Group Demographics
# ---------------------------------------------------------------------------

def collect_census_block_groups() -> gpd.GeoDataFrame:
    variables = {
        "B01003_001E": "total_pop",
        "B01001_020E": "male_65_66",
        "B01001_021E": "male_67_69",
        "B01001_022E": "male_70_74",
        "B01001_023E": "male_75_79",
        "B01001_024E": "male_80_84",
        "B01001_025E": "male_85_plus",
        "B01001_044E": "female_65_66",
        "B01001_045E": "female_67_69",
        "B01001_046E": "female_70_74",
        "B01001_047E": "female_75_79",
        "B01001_048E": "female_80_84",
        "B01001_049E": "female_85_plus",
        "B17001_002E": "pop_below_poverty",
        "B25044_003E": "owner_no_vehicle",
        "B25044_010E": "renter_no_vehicle",
        "B25001_001E": "total_housing_units",
    }

    var_str = ",".join(variables.keys())
    url = (
        f"{CENSUS_BASE}?get=NAME,{var_str}"
        f"&for=block%20group:*"
        f"&in=state:{PA_STATE_FIPS}%20county:{COUNTY_FIPS}"
        f"&key={CENSUS_API_KEY}"
    )

    print("  Fetching Census ACS data...")
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    df = pd.DataFrame(data[1:], columns=data[0])
    for col in variables:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    df = df.rename(columns=variables)

    age_cols = [c for c in df.columns if c.startswith(("male_6", "male_7", "male_8", "female_6", "female_7", "female_8"))]
    df["pop_65_plus"] = df[age_cols].sum(axis=1)
    df["no_vehicle_hh"] = df["owner_no_vehicle"] + df["renter_no_vehicle"]

    safe_pop = df["total_pop"].replace(0, 1)
    safe_hu = df["total_housing_units"].replace(0, 1)
    df["pct_65_plus"] = (df["pop_65_plus"] / safe_pop) * 100
    df["poverty_rate"] = (df["pop_below_poverty"] / safe_pop) * 100
    df["pct_no_vehicle"] = (df["no_vehicle_hh"] / safe_hu) * 100

    df["GEOID"] = df["state"] + df["county"] + df["tract"] + df["block group"]

    keep = ["GEOID", "NAME", "total_pop", "pop_65_plus", "pct_65_plus",
            "pop_below_poverty", "poverty_rate", "no_vehicle_hh", "pct_no_vehicle"]
    df = df[keep]
    df.to_csv(DATA_RAW / "census_acs_bg.csv", index=False)
    print(f"  Census block groups: {len(df)}")

    print("  Downloading TIGER block-group boundaries...")
    bg_url = f"https://www2.census.gov/geo/tiger/TIGER2022/BG/tl_2022_{PA_STATE_FIPS}_bg.zip"
    bg_gdf = gpd.read_file(bg_url)
    bg_gdf = bg_gdf[bg_gdf["COUNTYFP"] == COUNTY_FIPS].copy().to_crs(CRS_GEO)

    merged = bg_gdf.merge(df, on="GEOID", how="inner")
    merged = gpd.GeoDataFrame(merged, geometry="geometry", crs=CRS_GEO)
    merged.to_file(DATA_PROCESSED / "block_groups.geojson", driver="GeoJSON")
    print(f"  Block groups with demographics: {len(merged)}")
    return merged


# ---------------------------------------------------------------------------
# 3. CDC SVI
# ---------------------------------------------------------------------------

def compute_vulnerability_index(block_groups: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Build a composite vulnerability index from ACS indicators (0-1 percentile rank)."""
    print("  Computing vulnerability index from ACS indicators...")
    bg = block_groups.copy()
    bg = bg[bg["total_pop"] > 0]

    indicators = ["pct_65_plus", "poverty_rate", "pct_no_vehicle"]
    for col in indicators:
        bg[f"{col}_rank"] = bg[col].rank(pct=True)

    bg["vulnerability_score"] = bg[[f"{c}_rank" for c in indicators]].mean(axis=1)

    bg.to_file(DATA_PROCESSED / "block_groups.geojson", driver="GeoJSON")
    print(f"  Vulnerability scores assigned to {len(bg)} block groups")
    print(f"  Score range: {bg['vulnerability_score'].min():.3f} – {bg['vulnerability_score'].max():.3f}")
    return bg


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def collect_all():
    DATA_RAW.mkdir(parents=True, exist_ok=True)
    DATA_PROCESSED.mkdir(parents=True, exist_ok=True)

    print("=== 1/3 Candidate sites ===")
    candidates = collect_candidate_sites()

    print("\n=== 2/3 Census ACS demographics ===")
    block_groups = collect_census_block_groups()

    print("\n=== 3/3 Vulnerability index ===")
    block_groups = compute_vulnerability_index(block_groups)

    print("\nData collection complete.")
    return candidates, block_groups


if __name__ == "__main__":
    collect_all()
