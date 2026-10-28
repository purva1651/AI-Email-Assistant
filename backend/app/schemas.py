from typing import Literal
from pydantic import BaseModel, EmailStr, Field, StringConstraints
from typing_extensions import Annotated

Category = Literal["Business", "Personal", "Support", "Finance", "Marketing", "Other"]
Priority = Literal["High", "Medium", "Low"]
Tone = Literal["Professional", "Formal", "Friendly"]
NonEmpty = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20000)]


class AnalyzeRequest(BaseModel):
    sender: str = Field(min_length=1, max_length=200)
    sender_email: str = Field(default="", max_length=320)
    subject: str = Field(min_length=1, max_length=500)
    body: NonEmpty


class ActionItem(BaseModel):
    task: str = Field(min_length=1, max_length=1000)
    deadline: str | None = Field(default=None, max_length=300)


class AnalysisResult(BaseModel):
    category: Category
    priority: Priority
    reasons: list[str] = Field(min_length=2, max_length=3)
    summary: str = Field(min_length=1, max_length=500)
    action_items: list[ActionItem] = Field(default_factory=list, max_length=15)


class DraftRequest(AnalyzeRequest):
    tone: Tone = "Professional"
    analysis: AnalysisResult | None = None

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "sender": "Alex",
                "sender_email": "alex@example.com",
                "subject": "Contract sign-off",
                "body": "Please review and sign by Friday.",
                "tone": "Professional",
                "analysis": None,
            }]
        }
    }


class DraftResult(BaseModel):
    draft: str = Field(min_length=1, max_length=12000)


class SendRequest(BaseModel):
    to: EmailStr
    subject: str = Field(min_length=1, max_length=500)
    body: NonEmpty


class SendResult(BaseModel):
    status: Literal["sent", "dry_run"]
    message: str
