from fastapi import APIRouter, HTTPException, Query
import os, httpx

router = APIRouter()

GOOGLE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY")

@router.get("/languages")
async def get_languages(target: str = Query("en", description="Locale to translate languages into")):
    """
    Returns a list of languages supported by Google Translate.
    Data is returned as a json payload, for example:
    { language: 'es', name: 'Spanish' }
    """
    url = "https://translation.googleapis.com/language/translate/v2/languages"
    params = {"key": GOOGLE_API_KEY, "target": target}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, timeout=10.0)
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, detail=resp.text)
    data = resp.json().get("data", {}).get("languages", [])
    return data