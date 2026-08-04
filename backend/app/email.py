import os

try:
    import resend
except ImportError:  # pragma: no cover - exercised in local/test environments
    resend = None

resend_api_key = os.getenv("RESEND_API_KEY")
if resend is not None and resend_api_key:
    resend.api_key = resend_api_key
EMAIL_FROM = os.getenv("EMAIL_FROM", "onboarding@resend.dev")


def send_email(to: str, subject: str, body: str) -> None:
    if resend is None:
        return
    resend.Emails.send({
        "from": EMAIL_FROM,
        "to": [to],
        "subject": subject,
        "text": body,
    })