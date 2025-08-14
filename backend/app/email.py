# app/email.py
from fastapi_mail import FastMail, ConnectionConfig, MessageSchema
import os

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("SMTP_USER"),
    MAIL_PASSWORD = os.getenv("SMTP_PASS"),
    MAIL_FROM     = os.getenv("EMAIL_FROM"),
    MAIL_PORT     = int(os.getenv("SMTP_PORT", 587)),
    MAIL_SERVER   = os.getenv("SMTP_HOST", "smtp.gmail.com"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS  = False,
    USE_CREDENTIALS = True,
)

fm = FastMail(conf)
