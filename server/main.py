from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Union
import os
import dotenv
import logging
import requests
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

dotenv.load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

# Validate environment variables
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required")

# Gemini API endpoint
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

app = FastAPI()


# Pydantic models for request/response
class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    conversation_history: List[Dict[str, Any]]


origins = [
    "https://nirdeshak-ai.vercel.app",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/query")
async def query_service(request: ChatRequest) -> Union[str, Dict[str, str]]:
    try:
        # System prompt for the assistant
        system_prompt = """
        You are an intelligent and friendly multilingual assistant designed to help users understand and access Indian government services easily.

        Most government websites are hard to navigate, often written in complex language, and confusing for common people. Your role is to act as a guide.

        Here's what you must do when a user asks something (in any regional Indian language, Hinglish, or English):

        1. Understand the user's intent clearly — whether they want to apply for a document, check a scheme, access a service, or file something.

        2. If the user asks a question in any Indian regional language, English, or Hinglish, then always reply in the *same language or style* that the user is using to communicate. Match their tone and script to keep the conversation natural and user-friendly.

        3. Convert their request into a clear action plan using simple, non-technical language.

        4. Break down the process for the requested task or service into an easy-to-understand bullet-point summary:
        - What the process is
        - What documents are required
        - Step-by-step guide
        - Any important eligibility criteria

        5. Provide the *direct official URL* that takes the user straight to the relevant government website or service they need. Avoid homepage links — give deep, actionable URLs.

        6. At the end, give a *very short and simple summary (3-5 bullet points)* that explains the entire process in a way that even someone with limited digital literacy can understand.

        Additional Guidelines:
        • Be concise, accurate, and never assume unverified information.
        • If the request is vague or incomplete, ask polite follow-up questions to clarify.
        • If no official URL is available, state that transparently and offer the next best guidance.
        • Always act like a local, trusted guide — helpful, respectful, and practical.

        Your goal is to make government services accessible, understandable, and usable for everyone, regardless of their language or technical background.
        """

        # Build conversation context
        conversation_text = system_prompt + "\n\n"

        # Add conversation history with safe dictionary access
        for msg in request.conversation_history:
            if "type" in msg and "content" in msg:
                if msg["type"] == "user":
                    conversation_text += f"User: {msg['content']}\n"
                elif msg["type"] == "ai" and not msg.get("isError", False):
                    conversation_text += f"Assistant: {msg['content']}\n"
            else:
                logger.warning(f"Message missing required keys: {msg}")

        # Get the latest user message
        latest_user_message = ""
        for msg in reversed(request.conversation_history):
            if msg.get("type") == "user" and msg.get("content"):
                latest_user_message = msg["content"]
                break

        if not latest_user_message:
            raise HTTPException(
                status_code=400, detail="No user message found in conversation history"
            )

        # Make API request with proper error handling
        try:
            # Prepare the request payload for Gemini API
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": f"{system_prompt}\n\nUser: {latest_user_message}\nAssistant:"
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 1000,
                    "topP": 0.95,
                    "topK": 64,
                },
            }

            headers = {"Content-Type": "application/json"}

            response = requests.post(
                GEMINI_API_URL, headers=headers, json=payload, timeout=30
            )
            response.raise_for_status()

            response_data = response.json()

            # Extract the generated text from Gemini response
            if "candidates" in response_data and response_data["candidates"]:
                candidate = response_data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    reply = candidate["content"]["parts"][0]["text"]
                else:
                    logger.error(f"Invalid candidate structure: {candidate}")
                    raise HTTPException(
                        status_code=500,
                        detail="Invalid response format from Gemini API",
                    )
            else:
                logger.error(f"No candidates in response: {response_data}")
                raise HTTPException(
                    status_code=500, detail="No response from Gemini API"
                )

            logger.info("Successfully processed query with Gemini API")
            return reply

        except requests.exceptions.Timeout:
            logger.error("Request to Gemini API timed out")
            raise HTTPException(status_code=504, detail="Request timed out")

        except requests.exceptions.ConnectionError:
            logger.error("Failed to connect to Gemini API")
            raise HTTPException(
                status_code=503, detail="Service temporarily unavailable"
            )

        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error from Gemini API: {e}")
            if response.status_code == 401:
                raise HTTPException(
                    status_code=500, detail="Authentication failed with Gemini API"
                )
            elif response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Please try again later",
                )
            else:
                raise HTTPException(
                    status_code=500, detail=f"Gemini API error: {response.status_code}"
                )

        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to communicate with Gemini API"
            )

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini API response: {e}")
            raise HTTPException(
                status_code=500, detail="Invalid response from Gemini API"
            )

    except HTTPException:
        # Re-raise HTTPExceptions as they are already properly formatted
        raise

    except Exception as e:
        logger.error(f"Unexpected error in query_service: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
