const BASE_URL = "https://nirdeshakai.onrender.com";
// const BASE_URL = "http://localhost:8000";

class APIService {
  constructor() {
    this.baseURL = BASE_URL;
  }

  async sendMessage(userPrompt, conversationHistory = []) {
    try {
      // Convert conversation history to the format expected by FastAPI
      const requestData = {
        conversation_history: [
          ...conversationHistory,
          {
            type: "user",
            content: userPrompt,
            timestamp: new Date().toISOString()
          }
        ]
      };

      const response = await fetch(`${this.baseURL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.text();

      // Check if the response is an error object
      try {
        const parsed = JSON.parse(result);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        return parsed;
      } catch {
        // If it's not JSON, return the text response directly
        return result;
      }
    } catch (error) {
      console.error("API Error:", error);
      throw new Error(
        error.message ||
          "Failed to get response from NirdeshakAI. Please try again."
      );
    }
  }

  // Health check to test if backend is running
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/docs`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get base URL for debugging
  getBaseURL() {
    return this.baseURL;
  }

  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");
    const response = await fetch(`${this.baseURL}/transcribe`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Transcription failed");
    return await response.json();
  }
}

export const apiService = new APIService();
export default apiService;
