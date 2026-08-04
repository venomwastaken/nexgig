from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
headers = {
    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImNhdCI6ImNhY2hlQ2lyY3VsZSJ9.eyJzdWIiOiJ0ZXN0In0.KlZ4',
    'Content-Type': 'application/json',
}
resp = client.post('/api/v1/verification/email/request', headers=headers, json={'email':'afbuaful@st.knust.edu.gh'})
print('status', resp.status_code)
print('body', resp.text)
print('headers', resp.headers)
