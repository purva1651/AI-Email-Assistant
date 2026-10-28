from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import AnalyzeRequest, AnalysisResult, DraftRequest, DraftResult, SendRequest, SendResult
from app.services.ai_service import EmailAIService, AIServiceError
from app.services.mail_service import send_email, MailConfigurationError, MailDeliveryError

app = FastAPI(title="AI Email Assistant API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins, allow_credentials=True, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["*"])
ai_service = EmailAIService()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalysisResult)
def analyze_email(payload: AnalyzeRequest):
    try:
        return ai_service.analyze(payload)
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@app.post("/api/draft", response_model=DraftResult)
def draft_reply(payload: DraftRequest):
    try:
        return ai_service.draft(payload)
    except AIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@app.post("/api/send", response_model=SendResult)
def send_reply(payload: SendRequest):
    try:
        actually_sent = send_email(str(payload.to), payload.subject, payload.body)
        if not actually_sent:
            return SendResult(status="dry_run", message="Dry run: email was not sent. Set SEND_DRY_RUN=false to enable SMTP delivery.")
        return SendResult(status="sent", message="Email accepted by the SMTP server.")
    except MailConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except MailDeliveryError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
