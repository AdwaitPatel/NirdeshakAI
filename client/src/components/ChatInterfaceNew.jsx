import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  Settings,
  User,
  Bot,
  Plus,
  Menu,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechRecognition, useTextToSpeech } from "../hooks/useSpeech";
import { generateMessageId, validateInput } from "../utils/helpers";
import VoiceVisualizer from "./VoiceVisualizer";
import apiService from "../api";

const ChatInterface = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [speechProcessing, setSpeechProcessing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [ttsState, setTtsState] = useState({
    isSpeaking: false,
    lastCharIndex: 0,
    lastText: "",
  });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const utteranceRef = useRef(null);

  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    clearError,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const { speak, isSpeaking } = useTextToSpeech();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to parse markdown-style content
  const parseMarkdownContent = (content) => {
    // Split content by lines to handle headings and different formatting
    const lines = content.split("\n");
    const parsedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for headings (### text)
      if (line.startsWith("### ")) {
        const headingText = line.substring(4).trim();
        parsedLines.push({
          type: "heading",
          content: headingText,
          key: `heading-${i}`,
        });
      }
      // Check for subheadings (## text)
      else if (line.startsWith("## ")) {
        const headingText = line.substring(3).trim();
        parsedLines.push({
          type: "subheading",
          content: headingText,
          key: `subheading-${i}`,
        });
      }
      // Check for bullet points (- text or * text)
      else if (line.match(/^[\s]*[-*]\s+/)) {
        const bulletText = line.replace(/^[\s]*[-*]\s+/, "").trim();
        parsedLines.push({
          type: "bullet",
          content: bulletText,
          key: `bullet-${i}`,
        });
      }
      // Check for numbered lists (1. text, 2. text, etc.)
      else if (line.match(/^[\s]*\d+\.\s+/)) {
        const numberedText = line.replace(/^[\s]*\d+\.\s+/, "").trim();
        parsedLines.push({
          type: "numbered",
          content: numberedText,
          key: `numbered-${i}`,
        });
      }
      // Check for bold text within lines or other formatting
      else if (line.includes("**") || line.includes("`")) {
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        const formattedParts = parts.map((part, partIndex) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return {
              type: "bold",
              content: part.slice(2, -2),
              key: `bold-${i}-${partIndex}`,
            };
          } else if (part.startsWith("`") && part.endsWith("`")) {
            return {
              type: "code",
              content: part.slice(1, -1),
              key: `code-${i}-${partIndex}`,
            };
          }
          return {
            type: "text",
            content: part,
            key: `text-${i}-${partIndex}`,
          };
        });
        parsedLines.push({
          type: "paragraph",
          parts: formattedParts,
          key: `paragraph-${i}`,
        });
      }
      // Regular text line
      else if (line.trim()) {
        parsedLines.push({
          type: "text",
          content: line,
          key: `text-${i}`,
        });
      }
      // Empty line for spacing
      else {
        parsedLines.push({
          type: "space",
          key: `space-${i}`,
        });
      }
    }

    return parsedLines;
  };

  // Function to render parsed content
  const renderParsedContent = (parsedContent) => {
    return parsedContent.map((element) => {
      switch (element.type) {
        case "heading":
          return (
            <div
              key={element.key}
              className="text-lg font-bold text-gray-900 dark:text-white mb-3 mt-4 first:mt-0 border-b border-gray-200 dark:border-gray-600 pb-1"
            >
              {element.content}
            </div>
          );
        case "subheading":
          return (
            <div
              key={element.key}
              className="text-base font-semibold text-gray-900 dark:text-white mb-2 mt-3 first:mt-0"
            >
              {element.content}
            </div>
          );
        case "bullet":
          return (
            <div key={element.key} className="flex items-start mb-1 ml-4">
              <span className="text-blue-600 dark:text-blue-400 mr-2 mt-1">
                •
              </span>
              <span>{element.content}</span>
            </div>
          );
        case "numbered":
          return (
            <div key={element.key} className="mb-1 ml-4">
              {element.content}
            </div>
          );
        case "paragraph":
          return (
            <div key={element.key} className="mb-2">
              {element.parts.map((part) => {
                if (part.type === "bold") {
                  return (
                    <span
                      key={part.key}
                      className="font-bold text-gray-900 dark:text-white"
                    >
                      {part.content}
                    </span>
                  );
                } else if (part.type === "code") {
                  return (
                    <span
                      key={part.key}
                      className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono"
                    >
                      {part.content}
                    </span>
                  );
                }
                return <span key={part.key}>{part.content}</span>;
              })}
            </div>
          );
        case "text":
          return (
            <div key={element.key} className="mb-1">
              {element.content}
            </div>
          );
        case "space":
          return <div key={element.key} className="mb-2"></div>;
        default:
          return null;
      }
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Refresh suggested questions on page load
  useEffect(() => {
    setSuggestedQuestions(getRandomQuestions());
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check backend connection on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isConnected = await apiService.healthCheck();
        setIsBackendConnected(isConnected);
        if (!isConnected) {
          setApiError(
            "Backend server is not responding. Please ensure the FastAPI server is running on http://localhost:8000"
          );
        }
      } catch {
        setIsBackendConnected(false);
        setApiError("Failed to connect to backend server");
      }
    };

    checkBackend();
  }, []);

  useEffect(() => {
    if (transcript) {
      setSpeechProcessing(true);
      setMessage(transcript);
      resetTranscript();
      // Clear any speech errors when we successfully get transcript
      clearError();

      // Show processing feedback briefly
      setTimeout(() => {
        setSpeechProcessing(false);
      }, 500);
    }
  }, [transcript, resetTranscript, clearError]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

  const handleVoiceInput = async () => {
    if (!browserSupportsSpeechRecognition) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome, Safari, or Edge."
      );
      return;
    }

    if (!isOnline) {
      alert(
        "Speech recognition requires an internet connection. Please check your network and try again."
      );
      return;
    }

    try {
      if (isListening) {
        console.log("Stopping voice input...");
        stopListening();
      } else {
        console.log("Starting voice input...");
        clearError();
        await startListening();
      }
    } catch (error) {
      console.error("Voice input error:", error);
      clearError();
    }
  };

  const handleSarvamVoiceInput = async () => {
    if (!navigator.mediaDevices) {
      alert("Audio recording not supported in this browser.");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new window.MediaRecorder(stream);
    let chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: "audio/wav" });
      try {
        const { transcript } = await apiService.transcribeAudio(audioBlob);
        setMessage(transcript);
      } catch (err) {
        alert("Transcription failed: " + err.message);
      }
    };
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000); // Record for 5 seconds
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new window.MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = async () => {
      setIsRecording(false);
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");
      // Send to backend
      const response = await fetch("http://127.0.0.1:8000/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.transcript) {
        setMessage(data.transcript); // or handle as needed
      } else {
        alert(data.error || "Transcription failed");
      }
    };
    mediaRecorderRef.current.start();
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSendMessage = async () => {
    if (!validateInput(message) || isLoading) return;

    const userMessage = {
      id: generateMessageId(),
      type: "user",
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = message.trim();
    setMessage("");
    setIsLoading(true);
    setIsFirstVisit(false);
    setApiError(null);

    try {
      // Convert messages to conversation history format for API
      const conversationHistory = messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        isError: msg.isError || false
      }));
      
      // Call the real API with conversation history
      const aiResponse = await apiService.sendMessage(currentMessage, conversationHistory);

      const responseMessage = {
        id: generateMessageId(),
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, responseMessage]);
      setIsBackendConnected(true);
    } catch (error) {
      console.error("API Error:", error);
      setIsBackendConnected(false);
      setApiError(error.message);

      // Add error message to chat
      const errorMessage = {
        id: generateMessageId(),
        type: "ai",
        content: `I'm sorry, I'm having trouble connecting to the server right now. Please check if the backend is running on http://localhost:8000 or try again later.\n\nError: ${error.message}`,
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const allSuggestedQuestions = [
    "How do I apply for a passport?",
    "What documents are needed for driving license?",
    "How to get PAN card online?",
    "Aadhar card update process",
    "How to register for GST?",
    "Income tax return filing process",
    "How to get birth certificate?",
    "Marriage certificate application",
    "How to apply for voter ID?",
    "Property registration process",
    "How to get caste certificate?",
    "Business license application",
    "How to apply for ration card?",
    "Death certificate process",
    "How to get domicile certificate?",
    "Electricity connection process",
    "How to apply for gas connection?",
    "Water connection application",
    "How to get police verification?",
    "Bank account opening process",
  ];

  // Get random questions
  const getRandomQuestions = () => {
    const shuffled = [...allSuggestedQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  // Get questions for mobile (only 2)
  const getMobileQuestions = () => {
    const shuffled = [...allSuggestedQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  };

  const [suggestedQuestions, setSuggestedQuestions] = useState(
    getRandomQuestions()
  );

  const handleSuggestionClick = async (suggestion) => {
    setIsFirstVisit(false);

    // Create the user message
    const userMessage = {
      id: generateMessageId(),
      type: "user",
      content: suggestion.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setApiError(null);

    // Clear the search box immediately after starting the search
    setMessage("");

    try {
      // Convert messages to conversation history format for API
      const conversationHistory = messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        isError: msg.isError || false
      }));
      
      // Call the real API with conversation history
      const aiResponse = await apiService.sendMessage(suggestion.trim(), conversationHistory);

      const responseMessage = {
        id: generateMessageId(),
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, responseMessage]);
      setIsBackendConnected(true);
    } catch (error) {
      console.error("API Error:", error);
      setIsBackendConnected(false);
      setApiError(error.message);

      // Add error message to chat
      const errorMessage = {
        id: generateMessageId(),
        type: "ai",
        content: `I'm sorry, I'm having trouble connecting to the server right now. Please check if the backend is running on http://localhost:8000 or try again later.\n\nError: ${error.message}`,
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    // Save current chat to recent chats if there are messages
    if (messages.length > 0) {
      const userMessages = messages.filter((msg) => msg.type === "user");
      if (userMessages.length > 0) {
        // Only save the first chat from this session
        const firstUserMessage = userMessages[0];
        addToRecentChats(firstUserMessage.content);
      }
    }

    setMessages([]);
    setMessage("");
    setIsFirstVisit(true);
  };

  const addToRecentChats = (question) => {
    setRecentChats((prev) => {
      // Remove the question if it already exists
      const filtered = prev.filter((chat) => chat.question !== question);
      // Add the new question at the beginning
      const updated = [
        {
          id: generateMessageId(),
          question: question,
          timestamp: new Date(),
        },
        ...filtered,
      ];
      // Keep only the last 10 chats
      return updated.slice(0, 10);
    });
  };

  const loadChat = (chat) => {
    setMessages([]);
    setMessage(chat.question);
    setIsFirstVisit(false);
    // Automatically send the message
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handlePlayTTS = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Sorry, your browser does not support text-to-speech.");
      return;
    }

    // If currently speaking, stop and save position
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setTtsState((prev) => ({
        ...prev,
        isSpeaking: false,
      }));
      return;
    }

    // If resuming, start from lastCharIndex
    let startIndex = 0;
    if (ttsState.lastText === text && ttsState.lastCharIndex > 0) {
      startIndex = ttsState.lastCharIndex;
    }

    const remainingText = text.slice(startIndex);

    const utterance = new window.SpeechSynthesisUtterance(remainingText);

    // Enhanced language detection for Indian regional languages
    const hasHindi = /[\u0900-\u097F]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    const hasPunjabi = /[\u0A00-\u0A7F]/.test(text);
    const hasGujarati = /[\u0A80-\u0AFF]/.test(text);
    const hasBengali = /[\u0980-\u09FF]/.test(text);
    const hasTamil = /[\u0B80-\u0BFF]/.test(text);
    const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
    const hasKannada = /[\u0C80-\u0CFF]/.test(text);
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(text);
    const hasMarathi =
      /[\u0900-\u097F]/.test(text) &&
      /[\u0924\u0930\u0915\u093E\u0930\u0924]/.test(text);
    const hasOdia = /[\u0B00-\u0B7F]/.test(text);
    const hasAssamese =
      /[\u0980-\u09FF]/.test(text) &&
      /[\u0985\u09B8\u09AE\u09C0\u09AF\u09BC]/.test(text);

    // Get available voices and wait for them to load
    let voices = window.speechSynthesis.getVoices();

    // If voices aren't loaded yet, wait for them
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        setVoiceForUtterance(
          utterance,
          voices,
          hasHindi,
          hasEnglish,
          hasPunjabi,
          hasGujarati,
          hasBengali,
          hasTamil,
          hasTelugu,
          hasKannada,
          hasMalayalam,
          hasMarathi,
          hasOdia,
          hasAssamese
        );
      };
    } else {
      setVoiceForUtterance(
        utterance,
        voices,
        hasHindi,
        hasEnglish,
        hasPunjabi,
        hasGujarati,
        hasBengali,
        hasTamil,
        hasTelugu,
        hasKannada,
        hasMalayalam,
        hasMarathi,
        hasOdia,
        hasAssamese
      );
    }

    utterance.rate = 0.9; // Natural speaking rate
    utterance.pitch = 1.1; // Slightly higher pitch for female voice
    utterance.volume = 1.0;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        setTtsState((prev) => ({
          ...prev,
          lastCharIndex: startIndex + event.charIndex,
          lastText: text,
        }));
      }
    };

    utterance.onend = () => {
      setTtsState((prev) => ({
        ...prev,
        isSpeaking: false,
        lastCharIndex: 0,
      }));
    };

    utterance.onerror = () => {
      setTtsState((prev) => ({
        ...prev,
        isSpeaking: false,
      }));
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    setTtsState((prev) => ({
      ...prev,
      isSpeaking: true,
      lastText: text,
    }));
  };

  // Helper function to set the best voice for each language
  const setVoiceForUtterance = (
    utterance,
    voices,
    hasHindi,
    hasEnglish,
    hasPunjabi,
    hasGujarati,
    hasBengali,
    hasTamil,
    hasTelugu,
    hasKannada,
    hasMalayalam,
    hasMarathi,
    hasOdia,
    hasAssamese
  ) => {
    // Priority order for voice selection
    const voicePreferences = {
      hindi: ["hi-IN", "hi-IN-x-ABC", "hi-IN-x-ABD", "hi-IN-x-ABE"],
      english: ["en-IN", "en-IN-x-ABC", "en-IN-x-ABD"],
      punjabi: ["pa-IN", "pa-IN-x-ABC"],
      gujarati: ["gu-IN", "gu-IN-x-ABC"],
      bengali: ["bn-IN", "bn-IN-x-ABC"],
      tamil: ["ta-IN", "ta-IN-x-ABC"],
      telugu: ["te-IN", "te-IN-x-ABC"],
      kannada: ["kn-IN", "kn-IN-x-ABC"],
      malayalam: ["ml-IN", "ml-IN-x-ABC"],
      marathi: ["mr-IN", "mr-IN-x-ABC"],
      odia: ["or-IN", "or-IN-x-ABC"],
      assamese: ["as-IN", "as-IN-x-ABC"],
    };

    let selectedVoice = null;
    let selectedLang = "en-IN"; // default

    if (hasHindi || (hasHindi && hasEnglish)) {
      selectedLang = "hi-IN";
      selectedVoice = findBestVoice(voices, voicePreferences.hindi, "hindi");
    } else if (hasEnglish) {
      selectedLang = "en-IN";
      selectedVoice = findBestVoice(
        voices,
        voicePreferences.english,
        "english"
      );
    } else if (hasPunjabi) {
      selectedLang = "pa-IN";
      selectedVoice = findBestVoice(
        voices,
        voicePreferences.punjabi,
        "punjabi"
      );
    } else if (hasGujarati) {
      selectedLang = "gu-IN";
      selectedVoice = findBestVoice(
        voices,
        voicePreferences.gujarati,
        "gujarati"
      );
    } else if (hasBengali) {
      selectedLang = "bn-IN";
      selectedVoice = findBestVoice(
        voices,
        voicePreferences.bengali,
        "bengali"
      );
    } else if (hasTamil) {
      selectedLang = "ta-IN";
      selectedVoice = findBestVoice(voices, voicePreferences.tamil, "tamil");
    } else if (hasTelugu) {
      selectedLang = "te-IN";
      selectedVoice = findBestVoice(voices, voicePreferences.telugu, "telugu");
    } else if (hasKannada) {
      selectedLang = "kn-IN";
      selectedVoice = findBestVoice(
        voices,
        voicePreferences.kannada,
        "kannada"
      );
    } else if (hasMalayalam) {
      selectedLang = "ml-IN";
      selectedVoice = findBestVoice(
        voices,
        voicePreferences.malayalam,
        "malayalam"
      );
    } else if (hasMarathi) {
      selectedLang = "mr-IN";
      selectedVoice = findBestVoice(
        voices,
        voicePreferences.marathi,
        "marathi"
      );
    } else if (hasOdia) {
      selectedLang = "or-IN";
      selectedVoice = findBestVoice(voices, voicePreferences.odia, "odia");
    } else if (hasAssamese) {
      selectedLang = "as-IN";
      selectedVoice = findBestVoice(
        voices,
        voicePreferences.assamese,
        "assamese"
      );
    } else {
      // Default to Hindi
      selectedLang = "hi-IN";
      selectedVoice = findBestVoice(voices, voicePreferences.hindi, "hindi");
    }

    utterance.lang = selectedLang;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  };

  // Helper function to find the best available voice
  const findBestVoice = (voices, preferredLangs, languageName) => {
    // Priority 1: Indian female voices with exact language match
    for (const lang of preferredLangs) {
      const indianFemaleVoice = voices.find(
        (v) =>
          v.lang === lang &&
          (v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("woman") ||
            v.name.toLowerCase().includes("girl") ||
            v.name.toLowerCase().includes("priya") ||
            v.name.toLowerCase().includes("neha") ||
            v.name.toLowerCase().includes("meera") ||
            v.name.toLowerCase().includes("ananya") ||
            v.name.toLowerCase().includes("zara"))
      );
      if (indianFemaleVoice) return indianFemaleVoice;
    }

    // Priority 2: Any Indian female voice
    const indianFemaleVoice = voices.find(
      (v) =>
        (v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("woman") ||
          v.name.toLowerCase().includes("girl") ||
          v.name.toLowerCase().includes("priya") ||
          v.name.toLowerCase().includes("neha") ||
          v.name.toLowerCase().includes("meera") ||
          v.name.toLowerCase().includes("ananya") ||
          v.name.toLowerCase().includes("zara")) &&
        (v.name.toLowerCase().includes("india") ||
          v.name.toLowerCase().includes("indian") ||
          v.name.toLowerCase().includes("hindi") ||
          v.name.toLowerCase().includes("bengali") ||
          v.name.toLowerCase().includes("tamil") ||
          v.name.toLowerCase().includes("telugu") ||
          v.name.toLowerCase().includes("marathi") ||
          v.name.toLowerCase().includes("gujarati") ||
          v.name.toLowerCase().includes("punjabi") ||
          v.name.toLowerCase().includes("kannada") ||
          v.name.toLowerCase().includes("malayalam") ||
          v.name.toLowerCase().includes("odia") ||
          v.name.toLowerCase().includes("assamese"))
    );
    if (indianFemaleVoice) return indianFemaleVoice;

    // Priority 3: Exact language match (any gender)
    for (const lang of preferredLangs) {
      const voice = voices.find((v) => v.lang === lang);
      if (voice) return voice;
    }

    // Priority 4: Partial language match (any gender)
    for (const lang of preferredLangs) {
      const voice = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
      if (voice) return voice;
    }

    // Priority 5: Any Indian voice
    const indianVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes("india") ||
        v.name.toLowerCase().includes("indian") ||
        v.name.toLowerCase().includes("hindi") ||
        v.name.toLowerCase().includes("bengali") ||
        v.name.toLowerCase().includes("tamil") ||
        v.name.toLowerCase().includes("telugu") ||
        v.name.toLowerCase().includes("marathi") ||
        v.name.toLowerCase().includes("gujarati") ||
        v.name.toLowerCase().includes("punjabi") ||
        v.name.toLowerCase().includes("kannada") ||
        v.name.toLowerCase().includes("malayalam") ||
        v.name.toLowerCase().includes("odia") ||
        v.name.toLowerCase().includes("assamese")
    );
    if (indianVoice) return indianVoice;

    // Priority 6: Any female voice
    const femaleVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("woman") ||
        v.name.toLowerCase().includes("girl")
    );
    if (femaleVoice) return femaleVoice;

    // Finally, return any available voice
    return voices.length > 0 ? voices[0] : null;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 font-inter">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Mobile Sidebar */}
          <div className="absolute left-0 top-0 h-full w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={startNewChat}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                >
                  <Plus size={16} />
                  <span>New Chat</span>
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="ml-3 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
                Recent Chats
              </div>
              {recentChats.length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">
                  No recent chats yet
                </div>
              ) : (
                <div className="space-y-2">
                  {recentChats.map((chat) => (
                    <motion.button
                      key={chat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        loadChat(chat);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3 h-3 text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {chat.question}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {chat.timestamp.toLocaleDateString()} •{" "}
                            {chat.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    User
                  </div>
                </div>
                <Settings
                  size={16}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden xl:flex w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
            Recent Chats
          </div>
          {recentChats.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">
              No recent chats yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentChats.map((chat) => (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => loadChat(chat)}
                  className="w-full text-left p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {chat.question}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {chat.timestamp.toLocaleDateString()} •{" "}
                        {chat.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                User
              </div>
            </div>
            <Settings
              size={16}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-2 xs:p-3 sm:p-4 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden"
            >
              <Menu
                size={16}
                className="text-gray-600 dark:text-gray-400 xs:w-4 xs:h-4 sm:w-5 sm:h-5"
              />
            </button>
            <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-3">
              <img
                src="https://downloads.marketplace.jetbrains.com/files/21239/394982/icon/default.png"
                alt=""
                className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 bg-transparent"
              />
              <span className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 dark:text-white font-poppins">
                NirdeshakAI
              </span>
            </div>
          </div>

          {/* Backend Status Indicator */}
          <div className="flex items-center space-x-1 xs:space-x-2">
            <div
              className={`w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full ${
                isBackendConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span
              className={`text-xs ${
                isBackendConnected
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isBackendConnected ? "Connected" : "Disconnected"}
            </span>
            {!isBackendConnected && (
              <AlertCircle
                size={12}
                className="text-red-500 xs:w-3 xs:h-3 sm:w-4 sm:h-4"
              />
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto relative">
          {isFirstVisit && messages.length === 0 ? (
            /* Welcome Screen with Centered Input */
            <div className="h-full flex flex-col items-center justify-center p-2 xs:p-4 sm:p-6 lg:p-8 relative">
              <div className="text-center mb-6 xs:mb-8 sm:mb-12">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 bg-gradient-to-r bg-transparent rounded-3xl flex items-center justify-center mb-3 xs:mb-4 sm:mb-6 mx-auto shadow-2xl"
                >
                  <img
                    src="https://downloads.marketplace.jetbrains.com/files/21239/394982/icon/default.png"
                    alt=""
                    className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14"
                  />
                </motion.div>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl xs:text-5xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 xs:mb-3 sm:mb-4 font-poppins gradient-text"
                >
                  Welcome to NirdeshakAI
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-xs xs:text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-md font-inter px-2 xs:px-4"
                >
                  Your intelligent assistant for Indian government services. Ask
                  me anything about passports, licenses, certificates, and more.
                </motion.p>
              </div>

              {/* Centered Input Box */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="w-full max-w-2xl mb-4 xs:mb-6 sm:mb-8 px-2 xs:px-4"
              >
                <div className="relative">
                  <div className="glass rounded-2xl p-2 xs:p-3 sm:p-4 shadow-2xl border-0">
                    <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-4">
                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about government services..."
                        className="flex-1 resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs xs:text-sm sm:text-base font-inter leading-relaxed"
                        rows={1}
                        style={{ maxHeight: "120px" }}
                      />

                      <div className="flex space-x-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSarvamVoiceInput}
                          disabled={
                            !browserSupportsSpeechRecognition || !isOnline
                          }
                          className={`p-3 rounded-xl transition-all duration-300 relative ${
                            !browserSupportsSpeechRecognition || !isOnline
                              ? "text-gray-300 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                              : isListening
                              ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          title={
                            !browserSupportsSpeechRecognition
                              ? "Speech recognition not supported in this browser"
                              : !isOnline
                              ? "Speech recognition requires internet connection"
                              : isListening
                              ? "Click to stop listening"
                              : "Click to start voice input"
                          }
                        >
                          {isListening && (
                            <div className="absolute inset-0 rounded-xl bg-red-500 animate-pulse"></div>
                          )}
                          <div className="relative z-10">
                            {isListening ? (
                              <MicOff size={22} />
                            ) : (
                              <Mic size={22} />
                            )}
                          </div>
                          {isListening && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                          )}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSendMessage}
                          disabled={!message.trim() || isLoading}
                          className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white rounded-xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send size={22} />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isListening && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center space-x-3 mt-4 text-red-600 dark:text-red-400 text-sm font-medium"
                      >
                        <VoiceVisualizer isListening={isListening} />
                        <span>🎤 Listening... Speak clearly</span>
                      </motion.div>
                    )}
                    {speechProcessing && !isListening && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center space-x-3 mt-4 text-green-600 dark:text-green-400 text-sm font-medium"
                      >
                        <span>✅ Voice captured successfully!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {speechError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-5 h-5 text-red-500 mt-0.5">⚠️</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                              Speech Recognition Error
                            </div>
                            <div className="text-sm text-red-700 dark:text-red-300">
                              {speechError}
                            </div>
                            {speechError.includes("network") ||
                            speechError.includes("internet") ||
                            speechError.includes("connection") ? (
                              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                💡 Try these solutions:
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  <li>Check your internet connection</li>
                                  <li>Try refreshing the page</li>
                                  <li>
                                    Use a different browser (Chrome works best)
                                  </li>
                                  <li>Type your message instead</li>
                                </ul>
                              </div>
                            ) : speechError.includes("microphone") ||
                              speechError.includes("permission") ? (
                              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                💡 To fix microphone issues:
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  <li>
                                    Click the microphone icon in your browser's
                                    address bar
                                  </li>
                                  <li>Allow microphone access for this site</li>
                                  <li>Check if your microphone is connected</li>
                                  <li>Try refreshing the page</li>
                                </ul>
                              </div>
                            ) : (
                              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                                💡 You can continue typing your message normally
                              </div>
                            )}
                            <div className="mt-3">
                              <button
                                onClick={() => {
                                  clearError();
                                  handleVoiceInput();
                                }}
                                className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 px-3 py-1 rounded-md transition-colors"
                              >
                                🔄 Try Again
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={clearError}
                          className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-lg leading-none ml-2"
                        >
                          ×
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Suggested Questions */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl px-2 xs:px-4"
              >
                {/* Desktop: Show all 4 questions */}
                <div className="hidden sm:contents">
                  {suggestedQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestionClick(question)}
                      className="p-2 xs:p-3 sm:p-4 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 shadow-sm hover:shadow-md font-inter"
                    >
                      <div className="text-xs xs:text-sm text-gray-900 dark:text-white font-medium">
                        {question}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Mobile: Show only first 2 questions */}
                <div className="sm:hidden">
                  {suggestedQuestions.slice(0, 2).map((question, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestionClick(question)}
                      className="p-2 xs:p-3 sm:p-4 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 shadow-sm hover:shadow-md font-inter"
                    >
                      <div className="text-xs xs:text-sm text-gray-900 dark:text-white font-medium">
                        {question}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="max-w-4xl mx-auto p-2 xs:p-3 sm:p-4 lg:p-6 space-y-3 xs:space-y-4 sm:space-y-6 pb-20 xs:pb-24 sm:pb-32">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className={`flex ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex space-x-1 xs:space-x-2 sm:space-x-3 max-w-3xl ${
                        msg.type === "user"
                          ? "flex-row-reverse space-x-reverse"
                          : ""
                      }`}
                    >
                      <div
                        className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                          msg.type === "user"
                            ? "bg-blue-600"
                            : msg.isError
                            ? "bg-red-500"
                            : "bg-white dark:bg-gray-800"
                        }`}
                      >
                        {msg.type === "user" ? (
                          <User
                            size={12}
                            className="text-white xs:w-3 xs:h-3 sm:w-4 sm:h-4"
                          />
                        ) : msg.isError ? (
                          <AlertCircle
                            size={12}
                            className="text-white xs:w-3 xs:h-3 sm:w-4 sm:h-4"
                          />
                        ) : (
                          <img
                            src="https://downloads.marketplace.jetbrains.com/files/21239/394982/icon/default.png"
                            alt="NirdeshakAI"
                            className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 rounded-full"
                          />
                        )}
                      </div>
                      <div
                        className={`relative px-2 xs:px-3 sm:px-5 py-2 xs:py-3 sm:py-4 rounded-2xl shadow-sm ${
                          msg.type === "user"
                            ? "bg-blue-600 text-white"
                            : msg.isError
                            ? "bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {/* Speaker button for AI messages - upper right */}
                        {msg.type === "ai" && !msg.isError && (
                          <button
                            onClick={() => handlePlayTTS(msg.content)}
                            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none transform hover:scale-105"
                            title="Listen"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="text-white"
                            >
                              <path
                                d="M3 9v6h4l5 5V4L7 9H3z"
                                fill="currentColor"
                              />
                              <path
                                d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
                                fill="currentColor"
                              />
                              <path
                                d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        )}
                        <div className="text-xs xs:text-sm leading-relaxed font-inter pr-8">
                          {(() => {
                            // First, split content by URLs to handle them separately
                            const urlParts =
                              msg.content.split(/(https?:\/\/[^\s]+)/g);

                            return urlParts.map((part, index) => {
                              // Check if this part is a URL
                              const urlRegex = /^https?:\/\/[^\s]+$/;
                              if (urlRegex.test(part)) {
                                // Remove any parentheses around the URL
                                const cleanUrl = part
                                  .replace(/^[()]*/, "")
                                  .replace(/[()]*$/, "");
                                return (
                                  <div key={index} className="my-2">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                                      🔗 Official Website:
                                    </div>
                                    <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                                      <a
                                        href={cleanUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors break-all flex items-center"
                                      >
                                        <svg
                                          className="w-4 h-4 mr-2 flex-shrink-0"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                          />
                                        </svg>
                                        {cleanUrl}
                                      </a>
                                    </div>
                                  </div>
                                );
                              }

                              // For non-URL parts, parse markdown content
                              const parsedContent = parseMarkdownContent(part);
                              return (
                                <div key={index}>
                                  {renderParsedContent(parsedContent)}
                                </div>
                              );
                            });
                          })()}
                        </div>
                        <div
                          className={`text-xs mt-1 xs:mt-2 sm:mt-3 opacity-70 font-mono`}
                        >
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg">
                      <img
                        src="https://downloads.marketplace.jetbrains.com/files/21239/394982/icon/default.png"
                        alt="NirdeshakAI"
                        className="w-4 h-4 rounded-full"
                      />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                          NirdeshakAI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area (only shown when there are messages) */}
        {!isFirstVisit && messages.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="border-t border-gray-200 dark:border-gray-700 p-2 xs:p-3 sm:p-4 lg:p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
          >
            <div className="max-w-4xl mx-auto">
              <div className="glass rounded-2xl p-2 xs:p-3 sm:p-4 shadow-xl">
                <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-4">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about government services..."
                    className="flex-1 resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs xs:text-sm sm:text-base font-inter leading-relaxed"
                    rows={1}
                    style={{ maxHeight: "120px" }}
                  />

                  <div className="flex space-x-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleVoiceInput}
                      disabled={!browserSupportsSpeechRecognition || !isOnline}
                      className={`p-3 rounded-xl transition-all duration-300 relative ${
                        !browserSupportsSpeechRecognition || !isOnline
                          ? "text-gray-300 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                          : isListening
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title={
                        !browserSupportsSpeechRecognition
                          ? "Speech recognition not supported in this browser"
                          : !isOnline
                          ? "Speech recognition requires internet connection"
                          : isListening
                          ? "Click to stop listening"
                          : "Click to start voice input"
                      }
                    >
                      {isListening && (
                        <div className="absolute inset-0 rounded-xl bg-red-500 animate-pulse"></div>
                      )}
                      <div className="relative z-10">
                        {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                      </div>
                      {isListening && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isLoading}
                      className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white rounded-xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send size={22} />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center space-x-3 mt-4 text-red-600 dark:text-red-400 text-sm font-medium"
                  >
                    <VoiceVisualizer isListening={isListening} />
                    <span>🎤 Listening... Speak clearly</span>
                  </motion.div>
                )}
                {speechProcessing && !isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center space-x-3 mt-4 text-green-600 dark:text-green-400 text-sm font-medium"
                  >
                    <span>✅ Voice captured successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {speechError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 text-red-500 mt-0.5">⚠️</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                          Speech Recognition Error
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">
                          {speechError}
                        </div>
                        {speechError.includes("network") ||
                        speechError.includes("internet") ||
                        speechError.includes("connection") ? (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                            💡 Try these solutions:
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Check your internet connection</li>
                              <li>Try refreshing the page</li>
                              <li>
                                Use a different browser (Chrome works best)
                              </li>
                              <li>Type your message instead</li>
                            </ul>
                          </div>
                        ) : speechError.includes("microphone") ||
                          speechError.includes("permission") ? (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                            💡 To fix microphone issues:
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>
                                Click the microphone icon in your browser's
                                address bar
                              </li>
                              <li>Allow microphone access for this site</li>
                              <li>Check if your microphone is connected</li>
                              <li>Try refreshing the page</li>
                            </ul>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                            💡 You can continue typing your message normally
                          </div>
                        )}
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              clearError();
                              handleVoiceInput();
                            }}
                            className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 px-3 py-1 rounded-md transition-colors"
                          >
                            🔄 Try Again
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={clearError}
                      className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-lg leading-none ml-2"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="text-center mt-3 text-xs text-gray-500 dark:text-gray-400 font-inter">
                NirdeshakAI can make mistakes. Please verify important
                information.
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
