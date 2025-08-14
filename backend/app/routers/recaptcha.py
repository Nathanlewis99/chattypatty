# backend/app/routers/recaptcha.py
from fastapi import HTTPException, Request, Depends
import httpx, os
from dotenv import load_dotenv
load_dotenv()


RECAPTCHA_SECRET = os.getenv("RECAPTCHA_SECRET_KEY")
if not RECAPTCHA_SECRET:
    raise RuntimeError("RECAPTCHA_SECRET_KEY must be set")

async def verify_recaptcha(request: Request):
    """
    Extracts a reCAPTCHA token from either JSON body (key: 'recaptcha_token')
    or form-encoded body (key: 'token'), then calls Google's verify API.
    """
    # 1) grab the token from JSON or Form
    content_type = request.headers.get("content-type", "")
    token = None

    if "application/json" in content_type:
        body = await request.json()
        token = body.get("recaptcha_token")
    else:
        form = await request.form()
        token = form.get("token")

    if not token:
        raise HTTPException(status_code=400, detail="reCAPTCHA token missing")

    # 2) verify with Google
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": RECAPTCHA_SECRET, "response": token},
            timeout=5.0,
        )
    data = resp.json()
    if not data.get("success"):
        raise HTTPException(status_code=400, detail="Invalid reCAPTCHA")

    return True
