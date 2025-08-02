from fastapi import FastAPI, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from sarvamai import SarvamAI
from sarvamai.play import play, save

import requests
import os
import dotenv
import tempfile

dotenv.load_dotenv()

api_key = os.getenv("AZURE_OPENAI_API_KEY")
url = os.getenv("AZURE_OPENAI_ENDPOINT")
sarvam_api_key = os.getenv("SARVAM_API_KEY")
sarvam_client = SarvamAI(api_subscription_key=sarvam_api_key)

app = FastAPI()

origins = [
    # "https://nirdeshak-ai.vercel.app",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],  
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)    

headers = {
    "api-key": api_key,
    "Content-Type": "application/json"
}

@app.post("/query")
async def query_service(user_prompt: str = Form(...)):    
    print(f"Received user prompt: {user_prompt}")
    data = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": """

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
            """},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7
    }

    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        reply = response.json()['choices'][0]['message']['content']
        return reply
    else:
        return "I am not able to process this request at the moment. Please try again later."

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as audio_file:
            result = sarvam_client.speech_to_text.transcribe(
                file=audio_file,
                model="saarika:v2.5",
                language_code="en-IN"
            )
        return {"transcript": result.transcript}
    except Exception as e:

        return JSONResponse(status_code=500, content={"error": str(e)})    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/tts")
async def tts_service(text: str = Form(...)):
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp_path = tmp.name
            result = sarvam_client.text_to_speech.synthesize(
                text=text,
                model="samvad:v1.0",  # Use the correct model for TTS
                language_code="en-IN",  # Change as needed
                output_file=tmp_path
            )
        return FileResponse(tmp_path, media_type="audio/mpeg", filename="speech.mp3")
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})