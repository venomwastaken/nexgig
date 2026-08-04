import os

# Every test file imports something from `app.*`, and `app.main` transitively
# imports `app.core.storage` (R2 client) and `app.core.database` (DB engine),
# both of which read required env vars eagerly at import time. Setting dummy
# values here — before pytest imports any test module — keeps that working
# without every test file needing to know about R2.
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("R2_ACCOUNT_ID", "test-account")
os.environ.setdefault("R2_ACCESS_KEY_ID", "test-key")
os.environ.setdefault("R2_SECRET_ACCESS_KEY", "test-secret")
os.environ.setdefault("R2_BUCKET", "test-bucket")
os.environ.setdefault("R2_PUBLIC_BASE_URL", "https://example.test")
