from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Union
import os
import dotenv
import logging
import requests

# -----------------------------
# Logging
# -----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# Load Environment Variables
# -----------------------------
dotenv.load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required")

# -----------------------------
# Gemini API Endpoint (Correct Model)
# -----------------------------
GEMINI_API_URL = (
    f"https://generativelanguage.googleapis.com/v1/"
    f"models/gemini-2.5-flash:generateContent?key={api_key}"
)

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI()

# Root route (prevents 404 spam on Render)
@app.get("/")
def root():
    return {"status": "Nirdeshak AI backend is running"}

# -----------------------------
# CORS Configuration
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Request Model
# -----------------------------
class ChatRequest(BaseModel):
    conversation_history: List[Dict[str, Any]]

# -----------------------------
# Main Query Endpoint
# -----------------------------
@app.post("/query")
async def query_service(request: ChatRequest) -> Union[str, Dict[str, str]]:
    try:
        system_prompt = """
You are an intelligent and friendly multilingual assistant designed to help users understand and access Indian government services easily.

Always reply in the same language or style used by the user.

Provide:
• Clear explanation
• Required documents
• Step-by-step guide
• Eligibility criteria
• Direct official actionable URL (not homepage)
• Short 3-5 bullet summary at end

Be concise, accurate, and practical.
"""

        # Extract latest user message
        latest_user_message = ""
        for msg in reversed(request.conversation_history):
            if msg.get("type") == "user" and msg.get("content"):
                latest_user_message = msg["content"]
                break

        if not latest_user_message:
            raise HTTPException(
                status_code=400,
                detail="No user message found in conversation history"
            )

        # Gemini API payload
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": f"{system_prompt}\n\nUser: {latest_user_message}"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1000,
                "topP": 0.95,
                "topK": 40
            }
        }

        headers = {"Content-Type": "application/json"}

        response = requests.post(
            GEMINI_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )

        response.raise_for_status()
        response_data = response.json()

        # Extract model reply safely
        try:
            reply = response_data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            logger.error(f"Unexpected Gemini response format: {response_data}")
            raise HTTPException(
                status_code=500,
                detail="Invalid response format from Gemini API"
            )

        logger.info("Gemini response generated successfully")
        return reply

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Gemini API timeout")

    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Failed to connect to Gemini API")

    except requests.exceptions.HTTPError as e:
        logger.error(f"Gemini HTTP error: {e}")

        if response.status_code == 401:
            raise HTTPException(status_code=500, detail="Invalid Gemini API key")
        elif response.status_code == 429:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        elif response.status_code == 404:
            raise HTTPException(status_code=500, detail="Invalid Gemini model or endpoint")
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Gemini API error: {response.status_code}"
            )

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
