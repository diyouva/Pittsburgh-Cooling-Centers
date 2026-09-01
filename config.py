import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).parent
DATA_RAW = PROJECT_ROOT / "data" / "raw"
DATA_PROCESSED = PROJECT_ROOT / "data" / "processed"
DATA_OUTPUT = PROJECT_ROOT / "data" / "output"

ALLEGHENY_COUNTY_FIPS = "42003"
PA_STATE_FIPS = "42"
COUNTY_FIPS = "003"

WPRDC_BASE = "https://data.wprdc.org/api/3/action/datastore_search"
WPRDC_FACILITIES_ID = "fbb50b02-2879-47cd-abea-ae697ec05170"
WPRDC_LIBRARIES_ID = "14babf3f-4932-4828-8b49-3c9a03bae6d0"
WPRDC_COUNTY_BUILDINGS_ID = "2affd0cc-3a0f-4dd2-8298-216c26520bbd"

CENSUS_API_KEY = os.getenv("CENSUS_API_KEY", "")
CENSUS_BASE = "https://api.census.gov/data/2022/acs/acs5"

EXISTING_COOLING_CENTERS = [
    {"name": "Greenfield Senior Center", "lat": 40.424295, "lon": -79.93623},
    {"name": "Homewood Senior Center", "lat": 40.4568575, "lon": -79.8935651},
    {"name": "Sheraden Senior Center", "lat": 40.4551497, "lon": -80.0566851},
    {"name": "South Side Senior Center", "lat": 40.4235543, "lon": -79.966615},
    {"name": "Mount Washington Senior Center", "lat": 40.429882, "lon": -80.008315},
]

ADDITIONAL_CANDIDATE_SITES = [
    {"name": "Allegheny Senior Center", "lat": 40.4311588, "lon": -80.0689405},
    {"name": "Lawrenceville Senior Center", "lat": 40.4676651, "lon": -79.9585976},
    {"name": "Hazelwood Senior Center", "lat": 40.412428, "lon": -79.9443368},
    {"name": "Hill House Senior Center", "lat": 40.442733, "lon": -79.9822265},
    {"name": "Northview Heights Community Center", "lat": 40.4779316, "lon": -79.9998276},
    {"name": "Arlington Community Center", "lat": 40.4192352, "lon": -79.9750104},
    {"name": "Brookline Community Center", "lat": 40.3960505, "lon": -80.0226609},
    {"name": "East Liberty Community Center", "lat": 40.4621005, "lon": -79.9264941},
    {"name": "Beechview Community Center", "lat": 40.4106798, "lon": -80.0243862},
    {"name": "Carrick Community Center", "lat": 40.3994596, "lon": -79.9889174},
    {"name": "Manchester Community Center", "lat": 40.455313, "lon": -80.025247},
    {"name": "Morningside Community Center", "lat": 40.4817581, "lon": -79.9299973},
    {"name": "Wilkinsburg Community Center", "lat": 40.4432677, "lon": -79.8860979},
]

MAX_WALK_MINUTES = 15
WALK_SPEED_KMH = 5.0  # ~3.1 mph, typical walking speed
MAX_WALK_METERS = MAX_WALK_MINUTES / 60 * WALK_SPEED_KMH * 1000  # = 1250 m

CRS_PROJECTED = "EPSG:2272"  # PA State Plane South (feet)
CRS_GEO = "EPSG:4326"
