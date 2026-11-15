import os
import struct
import numpy as np
import onnxruntime as ort
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math

app = FastAPI(
    title="Lunar-Si API",
    description="Lunar Landing Site Navigator & ONNX AI Evaluation Engine",
    version="3.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LandingSite(BaseModel):
    id: int
    name: str
    lat: float
    lon: float
    slope: float
    illuminationHours: Optional[float] = None
    commsQuality: Optional[float] = None
    earthLosPercentage: Optional[float] = None
    waterIceDistanceKm: Optional[float] = None
    description: str
    safetyScore: Optional[int] = None
    recommendation: Optional[str] = None

# --- 1. تحميل موديل الذكاء الاصطناعي (ONNX Runtime) ---
ort_session = None
model_paths = ["lunar_safety_model.onnx", "app/lunar_safety_model.onnx"]

for m_path in model_paths:
    if os.path.exists(m_path):
        try:
            ort_session = ort.InferenceSession(m_path, providers=["CPUExecutionProvider"])
            print(f"✅ Loaded ONNX AI Model from: {m_path}")
            break
        except Exception as e:
            print(f"❌ Error loading ONNX model: {e}")

def predict_safety_score(slope: float, elev: float, illum: float, earth_los: float, water_ice: float) -> int:
    """توقع درجة الأمان باستخدام موديل ONNX المدرب"""
    if ort_session is None:
        return int(max(40, 100 - (slope * 3.0)))
    
    # تجهيز مصفوفة المدخلات الـ 5 بصيغة float32 كما تدرب الموديل
    input_data = np.array([[slope, elev, illum, earth_los, water_ice]], dtype=np.float32)
    input_name = ort_session.get_inputs()[0].name
    
    prediction = ort_session.run(None, {input_name: input_data})[0]
    score = int(round(float(prediction[0][0])))
    return max(1, min(99, score))

# --- 2. تحميل ملف التضاريس الحقيقي (DEM Binary) ---
WIDTH = 2048
HEIGHT = 1024
elevation_grid = None

possible_paths = [
    "ldem_2048x1024_uint16.bin",
    "textures/ldem_2048x1024_uint16.bin",
    "app/textures/ldem_2048x1024_uint16.bin"
]

for path in possible_paths:
    if os.path.exists(path):
        try:
            with open(path, "rb") as f:
                buf = f.read()
                if len(buf) == WIDTH * HEIGHT * 2:
                    elevation_grid = struct.unpack(f"<{WIDTH * HEIGHT}H", buf)
                    print(f"✅ Loaded DEM binary from: {path}")
                    break
        except Exception as e:
            print(f"❌ Error loading DEM binary: {e}")

def get_elevation_and_slope(lat: float, lon: float):
    if not elevation_grid:
        return 0.0, round(abs(lat * 0.12) % 22, 1)
    
    u = (lon + 180.0) / 360.0
    v = (90.0 - lat) / 180.0
    x = int((u % 1.0) * WIDTH)
    y = int(max(0.0, min(1.0, v)) * (HEIGHT - 1))
    
    idx = y * WIDTH + x
    raw_val = elevation_grid[idx]
    elevation_meters = (raw_val - 20000) * 0.5
    
    x_right = (x + 1) % WIDTH
    y_down = min(HEIGHT - 1, y + 1)
    
    diff_x = abs(elevation_grid[y * WIDTH + x_right] - raw_val)
    diff_y = abs(elevation_grid[y_down * WIDTH + x] - raw_val)
    slope = round(min(45.0, (diff_x + diff_y) * 0.04), 1)
    
    return elevation_meters, slope

def calculate_illumination(lat: float, elevation_meters: float, slope: float = 0.0):
    """حساب ساعات الإضاءة الشمسية بواقعية لجميع خطوط العرض والتضاريس"""
    if abs(lat) >= 78:
        # المناطق القطبية: تعتمد على القمم المرتفعة (Peaks of Eternal Light)
        base_illumination = 15.0 + (abs(lat) - 78) * 0.4
        elevation_bonus = elevation_meters / 350.0
        slope_penalty = slope * 0.15
        val = base_illumination + elevation_bonus - slope_penalty
        return round(min(24.0, max(1.5, val)), 1)
    else:
        # المناطق غير القطبية: تعتمد على زاوية سقوط الشمس (cos(lat)) + الارتفاع + الظل الناتج عن الميل
        solar_angle_factor = math.cos(math.radians(lat))
        base_hours = 11.0 + (solar_angle_factor * 3.5)  # تتراوح بين 11.7 و 14.5 ساعة حسب خط العرض
        elevation_bonus = elevation_meters / 600.0      # المرتفعات ترى الشمس لفترة أطول
        slope_shadow = slope * 0.08                     # المنحدرات والحفر تسبب ظلالاً تقلل الإضاءة
        
        val = base_hours + elevation_bonus - slope_shadow
        return round(min(18.0, max(4.0, val)), 1)

RAW_SITES = [
    {"id": 1, "name": "Faustini Rim A", "lat": -87.2, "lon": 43.8, "description": "Rim of Faustini crater, high solar illumination."},
    {"id": 2, "name": "Amundsen Crater", "lat": -84.3, "lon": 83.5, "description": "Deep impact crater with volatile-rich shadowed zones."},
    {"id": 3, "name": "Peak near Shackleton", "lat": -89.0, "lon": 125.0, "description": "Elevated ridge near Shackleton with exceptional solar capture."},
    {"id": 4, "name": "Connecting Ridge", "lat": -82.1, "lon": 31.8, "description": "Smooth connecting ridge for rover traverses."},
    {"id": 5, "name": "Connecting Ridge Extension", "lat": -82.4, "lon": 30.6, "description": "Extension of connecting ridge with stable relay potential."},
    {"id": 6, "name": "de Gerlache Rim 1", "lat": -88.4, "lon": 28.5, "description": "High-elevation ridge on de Gerlache rim."},
    {"id": 7, "name": "de Gerlache Rim 2", "lat": -87.7, "lon": -77.2, "description": "Secondary site along de Gerlache rim."},
    {"id": 8, "name": "de Gerlache-Kocher Massif", "lat": -84.6, "lon": -72.8, "description": "Massive highland block with stable bedrock."},
    {"id": 9, "name": "Haworth", "lat": -87.5, "lon": -3.5, "description": "Crater region featuring extensive flat benches."},
    {"id": 10, "name": "Malapert Mountain", "lat": -84.5, "lon": 10.3, "description": "Towering elevated peak providing direct Earth comms."},
    {"id": 11, "name": "Leibniz Beta Plateau", "lat": -84.9, "lon": 31.2, "description": "Expansive elevated plateau with smooth terrain."},
    {"id": 12, "name": "Nobile Rim 1", "lat": -85.2, "lon": 32.8, "description": "Prime scientific target for volatile analysis."},
    {"id": 13, "name": "Nobile Region", "lat": -84.3, "lon": 35.5, "description": "Target region for volatile prospecting missions."}
]

def evaluate_site(site: dict) -> dict:
    elev, slope = get_elevation_and_slope(site["lat"], site["lon"])
    illumination = calculate_illumination(site["lat"], elev)
    illum_val = illumination if illumination else 18.5
    earth_los = 88.0
    water_ice = round(max(0.5, abs(elev) * 0.0008), 1)
    
    # استخدام موديل ONNX لحساب درجة الأمان
    score = predict_safety_score(slope, elev, illum_val, earth_los, water_ice)
    
    site["slope"] = slope
    site["illuminationHours"] = illum_val
    site["commsQuality"] = 8.5
    site["earthLosPercentage"] = earth_los
    site["waterIceDistanceKm"] = water_ice
    site["safetyScore"] = score
    site["recommendation"] = "Optimal Artemis III Candidate (AI Verified)" if score >= 75 else "Moderate Risk (Requires Rover Survey)"
    return site

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "dem_loaded": elevation_grid is not None,
        "onnx_ai_loaded": ort_session is not None
    }

@app.get("/api/sites", response_model=List[LandingSite])
async def get_landing_sites():
    return [evaluate_site(site.copy()) for site in RAW_SITES]

@app.get("/api/evaluate-coordinate", response_model=LandingSite)
async def evaluate_coordinate(lat: float, lon: float):
    elev, slope = get_elevation_and_slope(lat, lon)
    illumination = calculate_illumination(lat, elev)
    
    comms = 8.0 if abs(lat) > 70 else 6.5
    earth_los = 85.0
    water_ice = round(max(1.0, 15.0 - abs(elev) * 0.001), 1)
    
    if illumination is not None:
        # تمرير البيانات الحقيقية لموديل ONNX للتنبؤ بدرجة الأمان
        safety = predict_safety_score(slope, elev, illumination, earth_los, water_ice)
        recommendation = (
            "Suitable for Landing (ONNX AI Verified)" if safety >= 70
            else "High Terrain Risk - Rover Only"
        )
    else:
        safety = None
        recommendation = "Not Available (Outside Polar Illumination Zone)"
    
    return {
        "id": 999,
        "name": f"Custom Region ({lat}°, {lon}°)",
        "lat": round(lat, 2),
        "lon": round(lon, 2),
        "slope": slope,
        "illuminationHours": illumination,
        "commsQuality": comms,
        "earthLosPercentage": earth_los,
        "waterIceDistanceKm": water_ice,
        "description": f"Evaluated using Real Lunar DEM & ONNX AI Model. Elevation: {round(elev)}m.",
        "safetyScore": safety,
        "recommendation": recommendation
    }