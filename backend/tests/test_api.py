from fastapi.testclient import TestClient
from app.main import app
from app.schemas import AnalysisResult, ActionItem, DraftResult
from app.services.ai_service import EmailAIService
import app.main as main_module

client = TestClient(app)


class FakeAnalyzer:
    def analyze(self, payload):
        return AnalysisResult(category="Business", priority="High", reasons=["Deadline is explicit", "Requires a reply"], summary="A contract needs sign-off by Friday.", action_items=[ActionItem(task="Review and sign the contract", deadline="by Friday")])

    def draft(self, payload):
        return DraftResult(draft="Thanks for sending this. I will review the details and get back to you.")


def setup_function():
    main_module.ai_service = FakeAnalyzer()


def email_payload():
    return {"sender": "Alex", "sender_email": "alex@example.com", "subject": "Contract sign-off", "body": "Please review and sign by Friday."}


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_analyze_route():
    response = client.post("/api/analyze", json=email_payload())
    assert response.status_code == 200
    assert response.json()["category"] == "Business"
    assert response.json()["action_items"][0]["deadline"] == "by Friday"


def test_analyze_validates_input():
    response = client.post("/api/analyze", json={"subject": "", "body": "x", "sender": "A"})
    assert response.status_code == 422


def test_draft_route():
    response = client.post("/api/draft", json={**email_payload(), "tone": "Friendly"})
    assert response.status_code == 200
    assert "review" in response.json()["draft"]


def test_draft_schema_has_example():
    schema = client.get("/openapi.json").json()
    request_schema = schema["paths"]["/api/draft"]["post"]["requestBody"]["content"]["application/json"]["schema"]
    draft_schema = schema["components"]["schemas"]["DraftRequest"]
    assert request_schema["$ref"].endswith("/DraftRequest")
    assert draft_schema["examples"][0]["tone"] == "Professional"
    assert {"sender", "subject", "body"}.issubset(draft_schema["examples"][0])


def test_draft_rejects_invalid_body():
    response = client.post("/api/draft", json={"sender": "Alex", "subject": "Hello", "body": " ", "tone": "Casual"})
    assert response.status_code == 422


def test_draft_missing_api_key_returns_safe_503(monkeypatch):
    monkeypatch.setattr(main_module, "ai_service", EmailAIService(api_key=""))
    response = client.post("/api/draft", json={**email_payload(), "tone": "Friendly"})
    assert response.status_code == 503
    assert "GROQ_API_KEY" in response.json()["detail"]
    assert "configured credentials" not in response.text


def test_draft_rate_limit_is_not_reported_as_generic_502(monkeypatch):
    class RateLimitError(Exception):
        status_code = 429

    service = EmailAIService(api_key="test")
    monkeypatch.setattr(service, "_llm", lambda: (_ for _ in ()).throw(RateLimitError()))
    monkeypatch.setattr(main_module, "ai_service", service)
    response = client.post("/api/draft", json={**email_payload(), "tone": "Friendly"})
    assert response.status_code == 429
    assert "rate limited" in response.json()["detail"]


def test_send_dry_run(monkeypatch):
    monkeypatch.setattr(main_module, "send_email", lambda to, subject, body: False)
    response = client.post("/api/send", json={"to": "person@example.com", "subject": "Re: Hello", "body": "Thanks"})
    assert response.status_code == 200
    assert response.json()["status"] == "dry_run"


def test_send_configuration_error(monkeypatch):
    from app.services.mail_service import MailConfigurationError
    def fail(*args):
        raise MailConfigurationError("SMTP settings are incomplete")
    monkeypatch.setattr(main_module, "send_email", fail)
    response = client.post("/api/send", json={"to": "person@example.com", "subject": "Re: Hello", "body": "Thanks"})
    assert response.status_code == 503


def test_send_server_error(monkeypatch):
    from app.services.mail_service import MailDeliveryError
    def fail(*args):
        raise MailDeliveryError("SMTP unavailable")
    monkeypatch.setattr(main_module, "send_email", fail)
    response = client.post("/api/send", json={"to": "person@example.com", "subject": "Re: Hello", "body": "Thanks"})
    assert response.status_code == 502
