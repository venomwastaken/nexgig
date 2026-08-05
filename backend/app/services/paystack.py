import os
from typing import Any, Optional

import requests

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")
PAYSTACK_PUBLIC_KEY = os.getenv("PAYSTACK_PUBLIC_KEY")
PAYSTACK_BASE_URL = "https://api.paystack.co"


class PaystackError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _headers() -> dict:
    if not PAYSTACK_SECRET_KEY:
        raise PaystackError("Payments aren't configured on this server yet.", status_code=503)
    return {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def _request(method: str, path: str, **kwargs) -> dict:
    try:
        response = requests.request(method, f"{PAYSTACK_BASE_URL}{path}", headers=_headers(), timeout=15, **kwargs)
    except requests.RequestException as exc:
        raise PaystackError(f"Couldn't reach Paystack: {exc}") from exc

    try:
        payload = response.json()
    except ValueError:
        raise PaystackError("Paystack returned an unreadable response.")

    if not response.ok or not payload.get("status", True):
        raise PaystackError(payload.get("message", "Paystack request failed."), status_code=502)

    return payload


def initialize_transaction(*, email: str, amount_pesewas: int, reference: str) -> dict[str, Any]:
    payload = _request(
        "POST",
        "/transaction/initialize",
        json={
            "email": email,
            "amount": amount_pesewas,
            "reference": reference,
            "currency": "GHS",
        },
    )
    return payload["data"]


def verify_transaction(reference: str) -> dict[str, Any]:
    payload = _request("GET", f"/transaction/verify/{reference}")
    return payload["data"]


def list_banks(*, currency: str = "GHS") -> list[dict[str, str]]:
    payload = _request("GET", "/bank", params={"currency": currency, "country": "ghana"})
    return [{"name": b["name"], "code": b["code"]} for b in payload["data"]]


def resolve_account(*, account_number: str, bank_code: str) -> dict[str, Any]:
    payload = _request(
        "GET",
        "/bank/resolve",
        params={"account_number": account_number, "bank_code": bank_code},
    )
    return payload["data"]


def create_transfer_recipient(*, name: str, account_number: str, bank_code: str) -> str:
    payload = _request(
        "POST",
        "/transferrecipient",
        json={
            "type": "ghipss",
            "name": name,
            "account_number": account_number,
            "bank_code": bank_code,
            "currency": "GHS",
        },
    )
    return payload["data"]["recipient_code"]


def initiate_transfer(*, amount_pesewas: int, recipient_code: str, reason: str, reference: Optional[str] = None) -> dict[str, Any]:
    body = {
        "source": "balance",
        "amount": amount_pesewas,
        "recipient": recipient_code,
        "reason": reason,
    }
    if reference:
        body["reference"] = reference
    payload = _request("POST", "/transfer", json=body)
    return payload["data"]
