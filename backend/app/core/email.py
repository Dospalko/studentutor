# backend/app/core/email.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from pathlib import Path

from app.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates/email'
)

async def send_password_reset_email(email_to: EmailStr, name: str, token: str):
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    template_body = {
        "title": "Reset hesla pre Personalizovaný AI Tútor",
        "name": name or email_to,
        "reset_link": reset_link
    }
    
    message = MessageSchema(
        subject="Obnovenie hesla pre tvoj účet",
        recipients=[email_to],
        template_body=template_body,
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message, template_name="password_reset.html")