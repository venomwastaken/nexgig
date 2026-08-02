import os
import uuid
from functools import lru_cache

import boto3
from botocore.config import Config

ALLOWED_IMAGE_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}


@lru_cache
def _get_s3_client():
    # Deliberately lazy: reading these at import time would crash the whole
    # backend (this module is imported by app.main via the router tree) for
    # anyone who hasn't set up R2 yet, even though only attachment uploads
    # need it. Failing here instead means everything else keeps working.
    account_id = os.environ["R2_ACCOUNT_ID"]
    access_key_id = os.environ["R2_ACCESS_KEY_ID"]
    secret_access_key = os.environ["R2_SECRET_ACCESS_KEY"]
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def build_chat_object_key(conversation_id: uuid.UUID, filename: str) -> str:
    safe_name = filename.replace("/", "_")
    return f"chat/{conversation_id}/{uuid.uuid4()}-{safe_name}"


def generate_presigned_put(object_key: str, content_type: str, expires_in: int = 300) -> str:
    bucket = os.environ["R2_BUCKET"]
    return _get_s3_client().generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": object_key, "ContentType": content_type},
        ExpiresIn=expires_in,
    )


def public_url_for_key(object_key: str) -> str:
    base_url = os.environ["R2_PUBLIC_BASE_URL"]
    return f"{base_url.rstrip('/')}/{object_key}"
