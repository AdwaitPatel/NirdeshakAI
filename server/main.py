from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Union
import requests
import os
import dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

dotenv.load_dotenv()

api_key = os.getenv("AZURE_OPENAI_API_KEY")
url = os.getenv("AZURE_OPENAI_ENDPOINT")

# Validate environment variables
if not api_key:
    raise ValueError("AZURE_OPENAI_API_KEY environment variable is required")
if not url:
    raise ValueError("AZURE_OPENAI_ENDPOINT environment variable is required")

app = FastAPI()

# Pydantic models for request/response
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    conversation_history: List[Dict[str, Any]]

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,  
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

headers = {
    "api-key": api_key,
    "Content-Type": "application/json"
}

@app.get("/", response_class=HTMLResponse)
async def health_check():
    """Health check endpoint that serves a professional HTML page."""
    try:
        # Read the HTML file
        html_file_path = os.path.join(os.path.dirname(__file__), "health_check.html")
        with open(html_file_path, "r", encoding="utf-8") as file:
            html_content = file.read()
        return html_content
    except FileNotFoundError:
        logger.error("Health check HTML file not found")
        # Fallback HTML if file is not found
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>NirdeshakAI - Health Check</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }
                .container { max-width: 600px; margin: 0 auto; padding: 2rem; border: 2px solid #4CAF50; border-radius: 10px; }
                h1 { color: #4CAF50; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>NirdeshakAI Backend API</h1>
                <p><strong>Status:</strong> Healthy & Running</p>
                <p><strong>Service:</strong> Indian Government Services Assistant</p>
                <p><strong>Version:</strong> 1.0.0</p>
                <p>All systems operational and ready to serve!</p>
            </div>
        </body>
        </html>
        """
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail="Health check service unavailable")

@app.post("/query")
async def query_service(request: ChatRequest) -> Union[str, Dict[str, str]]:
    try:
        # Convert frontend message format to OpenAI format
        openai_messages = [
            {
                "role": "system", 
                "content": """
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
            }
        ]
        
        # Add conversation history with safe dictionary access
        for msg in request.conversation_history:
            if "type" in msg and "content" in msg:
                if msg["type"] == "user":
                    openai_messages.append({"role": "user", "content": msg["content"]})
                elif msg["type"] == "ai" and not msg.get("isError", False):
                    openai_messages.append({"role": "assistant", "content": msg["content"]})
            else:
                logger.warning(f"Message missing required keys: {msg}")
        
        data = {
            "model": "gpt-4",
            "messages": openai_messages,
            "temperature": 0.7
        }

        # Make API request with proper error handling
        try:
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()  # Raises an HTTPError for bad responses
            
            # Safe JSON parsing and response extraction
            response_json = response.json()
            
            # Check if response has expected structure
            if "choices" not in response_json:
                logger.error(f"Unexpected API response structure: {response_json}")
                raise HTTPException(status_code=500, detail="Invalid API response structure")
            
            if not response_json["choices"] or len(response_json["choices"]) == 0:
                logger.error("API response has no choices")
                raise HTTPException(status_code=500, detail="No response from AI model")
            
            choice = response_json["choices"][0]
            if "message" not in choice or "content" not in choice["message"]:
                logger.error(f"Invalid choice structure: {choice}")
                raise HTTPException(status_code=500, detail="Invalid response format from AI model")
            
            reply = choice["message"]["content"]
            logger.info("Successfully processed query")
            return reply
            
        except requests.exceptions.Timeout:
            logger.error("Request to OpenAI API timed out")
            raise HTTPException(status_code=504, detail="Request timed out")
            
        except requests.exceptions.ConnectionError:
            logger.error("Failed to connect to OpenAI API")
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error from OpenAI API: {e}")
            if response.status_code == 401:
                raise HTTPException(status_code=500, detail="Authentication failed with AI service")
            elif response.status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later")
            else:
                raise HTTPException(status_code=500, detail=f"AI service error: {response.status_code}")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {e}")
            raise HTTPException(status_code=500, detail="Failed to communicate with AI service")
            
    except HTTPException:
        # Re-raise HTTPExceptions as they are already properly formatted
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error in query_service: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

