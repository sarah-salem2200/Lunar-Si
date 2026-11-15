from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="Lunar-Si API",
    description="Lunar Landing Site Navigator & AI Evaluation Engine",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# تفعيل الـ CORS للسماح للريأكت بالاتصال بالسيرفر
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # يمكن تحديثها لاحقاً لعنوان الفرونت إند فقط
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# نموذج البيانات (Pydantic Model)
class LandingSite(BaseModel):
    id: int
    name: str
    lat: float
    lon: float
    slope: float
    illuminationHours: float
    commsQuality: float
    earthLosPercentage: float
    waterIceDistanceKm: float
    description: str
    safetyScore: Optional[int] = None
    recommendation: Optional[str] = None

# قائمة الـ 13 موقعاً الرسمية لـ Artemis III
RAW_SITES = [
    {
        "id": 1, "name": "Faustini Rim A", "lat": -87.2, "lon": 43.8,
        "slope": 12.0, "illuminationHours": 19.2, "commsQuality": 8.0,
        "earthLosPercentage": 88.0, "waterIceDistanceKm": 2.1,
        "description": "Located on the rim of Faustini crater, offering high solar illumination and proximity to volatile-rich permanently shadowed regions."
    },
    {
        "id": 2, "name": "Amundsen Crater", "lat": -84.3, "lon": 83.5,
        "slope": 14.5, "illuminationHours": 16.8, "commsQuality": 7.5,
        "earthLosPercentage": 82.0, "waterIceDistanceKm": 5.0,
        "description": "Deep impact crater region with ancient rugged terrain and massive permanently shadowed zones holding pristine water ice."
    },
    {
        "id": 3, "name": "Peak near Shackleton", "lat": -89.0, "lon": 125.0,
        "slope": 7.0, "illuminationHours": 22.1, "commsQuality": 9.2,
        "earthLosPercentage": 93.0, "waterIceDistanceKm": 0.8,
        "description": "An elevated ridge near the rim of Shackleton crater providing exceptional solar energy capture and direct access to polar resources."
    },
    {
        "id": 4, "name": "Connecting Ridge", "lat": -82.1, "lon": 31.8,
        "slope": 9.5, "illuminationHours": 17.5, "commsQuality": 8.2,
        "earthLosPercentage": 85.0, "waterIceDistanceKm": 6.2,
        "description": "A smooth connecting ridge between major highlands, offering favorable traverse conditions for crewed rovers."
    },
    {
        "id": 5, "name": "Connecting Ridge Extension", "lat": -82.4, "lon": 30.6,
        "slope": 10.0, "illuminationHours": 17.8, "commsQuality": 8.3,
        "earthLosPercentage": 85.5, "waterIceDistanceKm": 5.8,
        "description": "An extension of the connecting ridge providing alternate paths and stable high-ground communication relay potential."
    },
    {
        "id": 6, "name": "de Gerlache Rim 1", "lat": -88.4, "lon": 28.5,
        "slope": 9.2, "illuminationHours": 20.5, "commsQuality": 8.1,
        "earthLosPercentage": 87.0, "waterIceDistanceKm": 3.1,
        "description": "High-elevation ridge on the rim of de Gerlache crater, ensuring sustained solar power and stable thermal conditions."
    },
    {
        "id": 7, "name": "de Gerlache Rim 2", "lat": -87.7, "lon": -77.2,
        "slope": 10.8, "illuminationHours": 19.0, "commsQuality": 7.9,
        "earthLosPercentage": 86.0, "waterIceDistanceKm": 3.8,
        "description": "Secondary candidate site along the de Gerlache rim with excellent geological diversity and access points."
    },
    {
        "id": 8, "name": "de Gerlache-Kocher Massif", "lat": -84.6, "lon": -72.8,
        "slope": 13.2, "illuminationHours": 18.2, "commsQuality": 8.0,
        "earthLosPercentage": 84.0, "waterIceDistanceKm": 7.5,
        "description": "A massive highland block situated between de Gerlache and Kocher craters, offering stable bedrock foundation."
    },
    {
        "id": 9, "name": "Haworth", "lat": -87.5, "lon": -3.5,
        "slope": 11.5, "illuminationHours": 18.8, "commsQuality": 8.2,
        "earthLosPercentage": 86.5, "waterIceDistanceKm": 4.0,
        "description": "Haworth crater region featuring extensive flat benches suitable for safe lunar module touchdown."
    },
    {
        "id": 10, "name": "Malapert Mountain", "lat": -84.5, "lon": 10.3,
        "slope": 12.5, "illuminationHours": 22.0, "commsQuality": 9.5,
        "earthLosPercentage": 98.5, "waterIceDistanceKm": 12.4,
        "description": "A towering elevated peak providing direct line-of-sight communication with Earth, making it ideal for a relay communication hub."
    },
    {
        "id": 11, "name": "Leibniz Beta Plateau", "lat": -84.9, "lon": 31.2,
        "slope": 10.4, "illuminationHours": 19.5, "commsQuality": 8.6,
        "earthLosPercentage": 89.0, "waterIceDistanceKm": 8.0,
        "description": "An expansive elevated plateau offering smooth terrain, high solar incidence, and broad exploration reach."
    },
    {
        "id": 12, "name": "Nobile Rim 1", "lat": -85.2, "lon": 32.8,
        "slope": 11.0, "illuminationHours": 18.5, "commsQuality": 8.4,
        "earthLosPercentage": 85.0, "waterIceDistanceKm": 3.2,
        "description": "Rim structure of Nobile crater, a prime scientific target for volatile analysis and in-situ resource utilization (ISRU)."
    },
    {
        "id": 13, "name": "Nobile Region", "lat": -84.3, "lon": 35.5,
        "slope": 11.2, "illuminationHours": 18.0, "commsQuality": 8.5,
        "earthLosPercentage": 84.5, "waterIceDistanceKm": 4.2,
        "description": "Target region for volatile prospecting missions, offering an exceptional balance between solar power potential and traversable terrain."
    }
]

def evaluate_site(site: dict) -> dict:
    slope_score = 100 if site["slope"] <= 15 else max(0, 100 - (site["slope"] - 15) * 5)
    illumination_score = (site["illuminationHours"] / 24) * 100
    comms_score = (site["commsQuality"] / 10) * 100

    final_score = (slope_score * 0.45) + (illumination_score * 0.25) + (comms_score * 0.30)
    score_rounded = round(final_score)

    site["safetyScore"] = score_rounded
    site["recommendation"] = "Optimal Landing Site (Recommended)" if score_rounded >= 80 else "Standard Site (Requires Extra Caution)"
    return site

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "project": "Lunar-Si",
        "message": "Backend is running"
    }

@app.get("/api/sites", response_model=List[LandingSite])
async def get_landing_sites():
    evaluated = [evaluate_site(site.copy()) for site in RAW_SITES]
    return evaluated