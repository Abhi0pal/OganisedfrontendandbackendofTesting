import os
import json
import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

router = APIRouter(prefix="/api/waste", tags=["Waste Classifier"])

WASTE_PROMPT = """
You are an expert waste management inspector trained under Indian CPCB (Central Pollution Control Board) guidelines.

Analyze this image and return a JSON response with EXACTLY this structure:
{
  "waste_type": "one of: Municipal Solid Waste / Biomedical Waste / Hazardous Waste / E-Waste / Plastic Waste / Construction & Demolition Waste / Unknown",
  "sub_category": "specific sub-type e.g. 'Infectious waste - Category 1' or 'Mixed household waste'",
  "risk_level": "one of: Low / Medium / High / Critical",
  "confidence": "percentage e.g. 87%",
  "applicable_rule": "relevant Indian rule e.g. 'Solid Waste Management Rules 2016' or 'Bio-Medical Waste Management Rules 2016'",
  "recommended_action": "specific action in 1-2 sentences",
  "illegal_dumping_suspected": true or false,
  "observations": "2-3 key visual observations that led to this classification"
}

Return ONLY valid JSON. No explanation outside JSON.
"""

SATELLITE_PROMPT = """
You are an expert remote sensing analyst and waste management inspector for India's CPCB.

Analyze this satellite/aerial image and return a JSON response with EXACTLY this structure:
{
  "illegal_dumping_detected": true or false,
  "confidence": "percentage e.g. 72%",
  "risk_level": "one of: Low / Medium / High / Critical",
  "detected_features": "describe what you see — waste piles, dark patches, discoloration, unusual land use",
  "affected_area_estimate": "approximate area e.g. '200 sq meters' or 'Unknown'",
  "nearby_water_body": true or false,
  "recommended_action": "specific ground-level action recommended",
  "alert_type": "one of: No Issue / Monitor / Inspect Soon / Urgent Inspection Required"
}

Return ONLY valid JSON. No explanation outside JSON.
"""


def _parse_gemini_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


@router.post("/classify")
async def classify_waste(image: UploadFile = File(...)):
    allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if image.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP images allowed")

    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Max 10MB allowed")

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_text(text=WASTE_PROMPT),
                types.Part.from_bytes(data=image_bytes, mime_type=image.content_type)
            ]
        )
    except Exception as e:
        msg = str(e)
        if "503" in msg or "UNAVAILABLE" in msg:
            raise HTTPException(status_code=503, detail="Gemini API busy — please try again in a few seconds")
        raise HTTPException(status_code=500, detail=f"AI error: {msg}")
    result = _parse_gemini_json(response.text)
    return {"status": "success", "filename": image.filename, "analysis": result}


class SatelliteRequest(BaseModel):
    lat: float
    lng: float
    zoom: int = 17


@router.post("/satellite")
async def satellite_analyze(req: SatelliteRequest):
    delta = 0.01 / (2 ** (req.zoom - 14))
    bbox = f"{req.lng - delta},{req.lat - delta},{req.lng + delta},{req.lat + delta}"
    esri_url = (
        "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export"
        f"?bbox={bbox}&bboxSR=4326&size=640,640&imageSR=4326&format=png&transparent=false&f=image"
    )

    async with httpx.AsyncClient(timeout=30) as http:
        img_resp = await http.get(esri_url)

    if img_resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Could not fetch satellite image")

    image_bytes = img_resp.content
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_text(text=SATELLITE_PROMPT),
                types.Part.from_bytes(data=image_bytes, mime_type="image/png")
            ]
        )
    except Exception as e:
        msg = str(e)
        if "503" in msg or "UNAVAILABLE" in msg:
            raise HTTPException(status_code=503, detail="Gemini API busy — please try again in a few seconds")
        raise HTTPException(status_code=500, detail=f"AI error: {msg}")
    result = _parse_gemini_json(response.text)
    return {
        "status": "success",
        "coordinates": {"lat": req.lat, "lng": req.lng},
        "satellite_image_url": esri_url,
        "analysis": result
    }


@router.get("/ui", response_class=HTMLResponse)
async def waste_classifier_ui():
    html_path = os.path.join(os.path.dirname(__file__), "waste_classifier.html")
    with open(html_path, "r", encoding="utf-8") as f:
        return f.read()







        