import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechRecognition, useTextToSpeech } from "../hooks/useSpeech";
import {
  generateMessageId,
  formatTimestamp,
  validateInput,
  getResponseTime,
} from "../utils/helpers";
import VoiceVisualizer from "./VoiceVisualizer";

const ChatInterface = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: generateMessageId(),
      type: "ai",
      content:
        "Welcome to NirdeshakAI! I'm here to help you navigate government services. You can type your question or use voice commands to interact with me.",
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef(null);
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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
    setMessage("");
    setIsLoading(true);

    // Simulate AI response with realistic delay
    const responseTime = getResponseTime();
    setTimeout(() => {
      const aiResponse = {
        id: generateMessageId(),
        type: "ai",
        content: generateAIResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);

      // Auto-speak AI response if enabled
      if (!isSpeaking) {
        speak(aiResponse.content);
      }
    }, responseTime);
  };

  const generateAIResponse = (userQuery) => {
    // Simple response generation based on keywords
    const query = userQuery.toLowerCase();

    if (query.includes("passport")) {
      return "To apply for a passport, you need to visit the Passport Seva portal at passportindia.gov.in. Required documents include proof of identity, address proof, and birth certificate. You can book an appointment online and visit your nearest Passport Seva Kendra.";
    } else if (
      query.includes("driving") ||
      query.includes("license") ||
      query.includes("dl")
    ) {
      return "For a driving license, visit your nearest RTO office or apply online through the Parivahan portal. You'll need to pass a written test and driving test. Required documents include age proof, address proof, and medical certificate.";
    } else if (query.includes("pan")) {
      return "You can apply for a PAN card online at incometaxindia.gov.in or through NSDL/UTIITSL websites. Required documents include identity proof, address proof, and date of birth proof. The process takes 15-20 working days.";
    } else if (query.includes("aadhar") || query.includes("aadhaar")) {
      return "For Aadhar card services, visit uidai.gov.in. You can enroll at any Aadhar enrollment center, update your details online, or download your e-Aadhar. Biometric verification is required for enrollment.";
    } else {
      return "I understand your query about government services. For specific information, please mention the service you need help with (like passport, driving license, PAN card, etc.). I can provide detailed step-by-step guidance for various government services.";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
    >
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Government Navigator</h2>
            <p className="text-indigo-200 mt-1">
              Ask me anything about government services
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => (isSpeaking ? stopSpeaking() : null)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
            >
              {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </motion.button>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/5 to-gray-100/5">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${
                msg.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.type === "user"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    : "bg-white/20 text-white border border-white/30"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    msg.type === "user" ? "text-blue-100" : "text-gray-300"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
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
            <div className="bg-white/20 text-white border border-white/30 px-4 py-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">NirdeshakAI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/5 border-t border-white/10">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question about government services..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              rows={1}
              style={{ minHeight: "48px" }}
            />
          </div>

          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVoiceInput}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </motion.button>
          </div>
        </div>

        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-400 text-sm mt-3 flex items-center justify-center space-x-2"
          >
            <VoiceVisualizer isListening={isListening} />
            <span>Listening... Speak now</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatInterface;
