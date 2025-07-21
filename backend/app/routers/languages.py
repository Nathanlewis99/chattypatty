from fastapi import APIRouter, HTTPException, Body, Query
import os
import httpx

router = APIRouter(
    prefix="/languages",
    tags=["languages"],
)

GOOGLE_API_KEY = os.getenv("GOOGLE_TRANSLATE_API_KEY")


@router.get("", summary="List supported languages")
async def get_languages(
    target: str = Query("en", description="Locale to translate languages into"),
):
    """
    Returns a list of languages supported by Google Translate.
    Data is returned as a JSON payload, for example:
    [{ language: 'es', name: 'Spanish' }, …]
    """
    url = "https://translation.googleapis.com/language/translate/v2/languages"
    params = {"key": GOOGLE_API_KEY, "target": target}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, timeout=10.0)
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, detail=resp.text)
    return resp.json().get("data", {}).get("languages", [])


@router.post(
    "/translate",
    summary="Translate arbitrary text",
    response_model=dict,
)
async def translate_text(
    text: str = Body(..., description="Text to translate"),
    source: str = Body(..., description="Source language code"),
    target: str = Body(..., description="Target language code"),
):
    """
    Translate arbitrary text via Google Translate API.
    Returns: { "translation": "…translated text…" }
    """
    url = "https://translation.googleapis.com/language/translate/v2"
    params = {
        "key": GOOGLE_API_KEY,
        "q": text,
        "source": source,
        "target": target,
        "format": "text",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, params=params, timeout=10.0)
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, detail=resp.text)
    translated = resp.json()["data"]["translations"][0]["translatedText"]
    return {"translation": translated}
