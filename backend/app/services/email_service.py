"""
GRAM-X Enterprise Transactional Email Service
Architecture:
1. EmailAdapter Abstract Base Class: send_email(recipient, subject, html_body, text_body)
2. SMTPEmailAdapter: Direct TLS/SSL SMTP server integration (Gmail, Amazon SES SMTP, Postfix)
3. SendGridEmailAdapter: SendGrid REST API integration
4. ConsoleLogEmailAdapter: Secure development & testing fallback (logs OTP to stdout securely)
5. EmailService: Provider router & transactional governance email dispatcher
"""

import logging
import smtplib
from abc import ABC, abstractmethod
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from app.config import (
    EMAIL_PROVIDER,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_USE_TLS,
    EMAIL_FROM,
    SENDGRID_API_KEY
)

logger = logging.getLogger("gramx.email")

class EmailAdapter(ABC):
    """Abstract base for transactional email providers."""

    @abstractmethod
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str
    ) -> bool:
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        pass


class SMTPEmailAdapter(EmailAdapter):
    """Real SMTP Email Adapter (Gmail / AWS SES / Custom Mail Server)."""

    def __init__(
        self,
        host: str,
        port: int,
        user: str,
        password: str,
        from_email: str,
        use_tls: bool = True
    ):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.from_email = from_email
        self.use_tls = use_tls

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str
    ) -> bool:
        if not self.user or not self.password:
            logger.info(f"[SMTP Not Configured] Logging message to console for {to_email}")
            return ConsoleLogEmailAdapter().send_email(to_email, subject, html_body, text_body)

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = to_email

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            server = smtplib.SMTP(self.host, self.port, timeout=10)
            if self.use_tls:
                server.starttls()
            server.login(self.user, self.password)
            server.sendmail(self.from_email, [to_email], msg.as_string())
            server.quit()

            logger.info(f"Transactional email '{subject}' sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMTP email to {to_email}: {e}")
            return False

    def health_check(self) -> Dict[str, Any]:
        return {
            "provider": "smtp",
            "host": self.host,
            "port": self.port,
            "configured": bool(self.user and self.password)
        }


class SendGridEmailAdapter(EmailAdapter):
    """SendGrid API Transactional Email Adapter."""

    def __init__(self, api_key: str, from_email: str):
        self.api_key = api_key
        self.from_email = from_email

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str
    ) -> bool:
        if not self.api_key:
            return ConsoleLogEmailAdapter().send_email(to_email, subject, html_body, text_body)

        try:
            import urllib.request
            import json

            payload = {
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": self.from_email, "name": "GRAM-X Governance Network"},
                "subject": subject,
                "content": [
                    {"type": "text/plain", "value": text_body},
                    {"type": "text/html", "value": html_body}
                ]
            }

            req = urllib.request.Request(
                "https://api.sendgrid.com/v3/mail/send",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in [200, 202]:
                    logger.info(f"SendGrid email sent successfully to {to_email}")
                    return True
        except Exception as e:
            logger.error(f"SendGrid email error: {e}")

        return False

    def health_check(self) -> Dict[str, Any]:
        return {
            "provider": "sendgrid",
            "configured": bool(self.api_key)
        }


class ConsoleLogEmailAdapter(EmailAdapter):
    """Console logging email adapter for local development and offline test environments."""

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str
    ) -> bool:
        logger.info("=" * 60)
        logger.info(f"[EMAIL DISPATCHED] To: {to_email} | Subject: {subject}")
        logger.info(f"Body:\n{text_body}")
        logger.info("=" * 60)
        return True

    def health_check(self) -> Dict[str, Any]:
        return {
            "provider": "console_log",
            "status": "operational"
        }


class EmailService:
    """Unified Transactional Email Service."""

    def __init__(self):
        self.provider_type = EMAIL_PROVIDER.lower()
        if self.provider_type == "smtp":
            self.adapter = SMTPEmailAdapter(
                host=SMTP_HOST,
                port=SMTP_PORT,
                user=SMTP_USER,
                password=SMTP_PASSWORD,
                from_email=EMAIL_FROM,
                use_tls=SMTP_USE_TLS
            )
        elif self.provider_type == "sendgrid":
            self.adapter = SendGridEmailAdapter(
                api_key=SENDGRID_API_KEY,
                from_email=EMAIL_FROM
            )
        else:
            self.adapter = ConsoleLogEmailAdapter()

        logger.info(f"EmailService initialized with provider: {self.provider_type}")

    def send_password_reset_otp(
        self,
        to_email: str,
        username: str,
        otp_code: str,
        expires_minutes: int = 15
    ) -> bool:
        """Sends branded password reset verification code email."""
        subject = f"GRAM-X Security: Password Reset Code ({otp_code})"
        
        text_body = f"""Namaste {username},

You recently requested to reset your password for the GRAM-X Digital Rural Governance Platform.

Your One-Time Password (OTP) verification code is:
{otp_code}

This code will expire in {expires_minutes} minutes.

If you did not request a password reset, please ignore this email or notify your Panchayat Administrator immediately.

GRAM-X Security Team
Panchayati Raj Digital Governance Initiative
"""

        html_body = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #0f172a;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #0c1e36; margin: 0;">🇮🇳 GRAM-X</h2>
      <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">Digital Rural Governance Platform</p>
    </div>
    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
    <p style="font-size: 15px;">Namaste <strong>{username}</strong>,</p>
    <p style="font-size: 14px; color: #475569; line-height: 1.5;">
      You recently requested to reset your password for your GRAM-X account. Use the one-time verification code below to verify your request:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <div style="display: inline-block; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #0369a1; background: #e0f2fe; padding: 12px 28px; border-radius: 8px; border: 1px solid #bae6fd;">
        {otp_code}
      </div>
    </div>
    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
      This OTP code is valid for <strong>{expires_minutes} minutes</strong> and can only be used once.
    </p>
    <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
      If you did not request this code, please ignore this email. Your password will remain unchanged.
    </p>
    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
      NIC Compliant • Ministry of Panchayati Raj • Government of India
    </p>
  </div>
</body>
</html>
"""
        return self.adapter.send_email(to_email, subject, html_body, text_body)

    def health_check(self) -> Dict[str, Any]:
        return {
            "active_provider": self.provider_type,
            "details": self.adapter.health_check()
        }


# Global singleton instance
email_service = EmailService()
