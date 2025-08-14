# app/security.py
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import os

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME")
SALT       = "email-confirm-salt"
EXPIRE_SEC = int(os.getenv("VERIFY_EXPIRE_SECONDS", 3600))

serializer = URLSafeTimedSerializer(SECRET_KEY)

def make_verification_token(email: str) -> str:
    return serializer.dumps(email, salt=SALT)

def verify_token(token: str) -> str:
    try:
        email = serializer.loads(token, salt=SALT, max_age=EXPIRE_SEC)
    except SignatureExpired:
        raise ValueError("Token expired")
    except BadSignature:
        raise ValueError("Invalid token")
    return email
