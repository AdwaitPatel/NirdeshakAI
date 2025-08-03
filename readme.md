# NirdeshakAI => https://nirdeshak-ai.vercel.app/

An intelligent multilingual assistant designed to help users understand and access Indian government services easily. Built with FastAPI backend and React frontend with voice capabilities.

## Features

- Multilingual support for Indian regional languages, Hindi, and English
- Voice input/output using speech recognition and text-to-speech
- Clean, responsive UI with real-time chat interface
- Markdown formatting for structured responses
- Direct links to official government websites

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn package manager

## Environment Setup

Create a `.env` file in the `server` directory with the following variables:

```bash
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
SARVAM_API_KEY=your_sarvam_api_key
```

## Installation & Setup

### Backend (FastAPI)

1. Navigate to the server directory:

```bash
cd server
```

2. Create and activate a virtual environment:

```bash
python -m venv myenv
source myenv/bin/activate  # On Windows: myenv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend (React)

1. Navigate to the client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Update API configuration (if using local backend):

   - Open `src/api.jsx`
   - Change `BASE_URL` to `"http://localhost:8000"`

4. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Production Build

### Frontend

```bash
cd client
npm run build
```

### Backend

```bash
cd server
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

- `POST /query` - Submit user queries and get AI responses
- `POST /transcribe` - Convert audio to text
- `POST /tts` - Convert text to speech
- `GET /docs` - API documentation (FastAPI auto-generated)

## Technology Stack

- **Backend**: FastAPI, Python, Uvicorn, Azure OpenAI, SarvamAI
- **Frontend**: React, Vite, TailwindCSS, Framer Motion
- **Speech**: Web Speech API, SarvamAI Speech Services

## Development

The application supports hot reloading in development mode. Make changes to the code and see them reflected immediately.

## License

This project is developed for hackathon submission.
