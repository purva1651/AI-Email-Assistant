import smtplib
from email.message import EmailMessage
from app.config import settings


class MailConfigurationError(RuntimeError):
    pass


class MailDeliveryError(RuntimeError):
    pass


def send_email(to: str, subject: str, body: str) -> bool:
    """Send a message. Returns False in dry-run mode, True after SMTP accepts it."""
    if settings.send_dry_run:
        return False
    required = [settings.smtp_host, settings.smtp_username, settings.smtp_password, settings.smtp_from_email]
    if not all(required):
        raise MailConfigurationError("SMTP settings are incomplete. Configure SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD and SMTP_FROM_EMAIL.")
    message = EmailMessage()
    message["From"] = settings.smtp_from_email
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            if settings.smtp_use_tls:
                server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
        return True
    except Exception as exc:
        raise MailDeliveryError("The SMTP server could not send the email.") from exc
