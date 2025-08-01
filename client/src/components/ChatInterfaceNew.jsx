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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechRecognition, useTextToSpeech } from "../hooks/useSpeech";
import {
  generateMessageId,
  validateInput,
  getResponseTime,
} from "../utils/helpers";
import VoiceVisualizer from "./VoiceVisualizer";

const ChatInterface = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [speechProcessing, setSpeechProcessing] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    setIsFirstVisit(false);

    // Simulate AI response
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
    }, responseTime);
  };

  const generateAIResponse = (userQuery) => {
    const query = userQuery.toLowerCase();

    if (query.includes("passport")) {
      return "To apply for a passport in India:\n\n1. **Visit the Official Portal**: Go to passportindia.gov.in\n2. **Register and Fill Form**: Create an account and fill the online application form\n3. **Book Appointment**: Schedule an appointment at your nearest Passport Seva Kendra (PSK)\n4. **Required Documents**:\n   - Proof of Identity (Aadhar, Voter ID, etc.)\n   - Proof of Address\n   - Birth Certificate\n   - Recent photographs\n\n5. **Visit PSK**: Attend your appointment with original documents\n6. **Police Verification**: Complete if required\n7. **Receive Passport**: Usually takes 7-15 days\n\n**Fees**: ₹1,500 for 36 pages, ₹2,000 for 60 pages (normal processing)";
    } else if (
      query.includes("driving") ||
      query.includes("license") ||
      query.includes("dl")
    ) {
      return "To get a Driving License in India:\n\n**Step 1: Learner's License**\n- Apply online at parivahan.gov.in or visit RTO\n- Submit Form 1, identity proof, address proof, age proof\n- Pass written test\n- Get Learner's License (valid for 6 months)\n\n**Step 2: Permanent License**\n- Wait at least 30 days after getting LL\n- Book driving test appointment\n- Submit Form 2, LL, and required documents\n- Pass practical driving test\n\n**Required Documents**:\n- Age proof (birth certificate, school certificate)\n- Address proof (Aadhar, utility bills)\n- Medical certificate (for commercial vehicles)\n- Passport-size photographs\n\n**Fees**: ₹200 for LL, ₹200 for DL (may vary by state)";
    } else if (query.includes("pan")) {
      return 'To apply for PAN Card online:\n\n**Method 1: Official Income Tax Website**\n1. Visit incometaxindia.gov.in\n2. Go to "Quick Links" → "Apply for PAN"\n3. Fill Form 49A (Indian citizens) or 49AA (foreign citizens)\n4. Upload required documents\n5. Pay fees online (₹110)\n6. Submit application\n\n**Method 2: Authorized Agencies**\n- NSDL: tin-nsdl.com\n- UTIITSL: utiitsl.com\n\n**Required Documents**:\n- Identity Proof (Aadhar, Passport, Voter ID)\n- Address Proof\n- Date of Birth Proof\n- Recent photograph\n\n**Processing Time**: 15-20 working days\n**Track Status**: Use acknowledgment number on the respective website';
    } else if (query.includes("aadhar") || query.includes("aadhaar")) {
      return 'Aadhar Card Services:\n\n**New Enrollment**:\n1. Visit nearest Aadhar Enrollment Center\n2. Fill enrollment form\n3. Provide biometric data (fingerprints, iris scan, photo)\n4. Submit supporting documents\n5. Get acknowledgment slip\n6. Receive Aadhar in 60-90 days\n\n**Update Aadhar**:\n- Online: uidai.gov.in → "Update Your Aadhar"\n- Offline: Visit Aadhar center\n\n**Download e-Aadhar**:\n- Visit uidai.gov.in\n- Enter Aadhar number/VID and security code\n- Verify with OTP\n- Download PDF (password: PIN code + year of birth)\n\n**Services Available**:\n- Demographic updates (name, address, mobile, email)\n- Biometric updates\n- Document updates\n- Virtual ID generation';
    } else if (query.includes("voter") || query.includes("epic")) {
      return 'Voter ID Card Registration:\n\n**Online Registration**:\n1. Visit nvsp.in (National Voters\' Service Portal)\n2. Select "Apply for Registration of New Voter"\n3. Fill Form 6\n4. Upload required documents\n5. Submit application\n\n**Required Documents**:\n- Age proof (birth certificate, passport, etc.)\n- Address proof (Aadhar, utility bill, etc.)\n- Recent photograph\n\n**Offline Registration**:\n- Get Form 6 from nearest Electoral Registration Office\n- Submit with documents to ERO/BLO\n\n**Processing Time**: 30-45 days\n**Track Status**: Use reference number on nvsp.in\n\n**Additional Services**:\n- Download EPIC: voters.eci.gov.in\n- Correction in details: Form 8\n- Transfer registration: Form 8A';
    } else {
      return 'I\'m NirdeshakAI, your government services assistant. I can help you with:\n\n🏛️ **Government Services**:\n- Passport applications and renewals\n- Driving License procedures\n- PAN Card applications\n- Aadhar services and updates\n- Voter ID registration\n- Income certificates\n- Property registration\n- Police clearance certificates\n\n💡 **How to use me**:\n- Type your question in plain language\n- Use voice input by clicking the microphone\n- Ask in Hindi or English\n\nTry asking: "How do I apply for a passport?" or "What documents do I need for driving license?"';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "How do I apply for a passport?",
    "What documents are needed for driving license?",
    "How to get PAN card online?",
    "Aadhar card update process",
  ];

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    setIsFirstVisit(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setMessage("");
    setIsFirstVisit(true);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 font-inter">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
            Recent Chats
          </div>
          {/* Chat history would go here */}
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
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <button className="md:hidden">
              <Menu size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center space-x-3">
              <span className="text-xl font-semibold text-gray-900 dark:text-white font-poppins">
                NirdeshakAI
              </span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto relative">
          {isFirstVisit && messages.length === 0 ? (
            /* Welcome Screen with Centered Input */
            <div className="h-full flex flex-col items-center justify-center p-8 relative">
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl"
                >
                  <Bot size={40} className="text-white" />
                </motion.div>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-poppins gradient-text"
                >
                  Welcome to NirdeshakAI
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-lg text-gray-600 dark:text-gray-400 max-w-md font-inter"
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
                className="w-full max-w-2xl mb-8"
              >
                <div className="relative">
                  <div className="glass rounded-2xl p-4 shadow-2xl border-0">
                    <div className="flex items-end space-x-4">
                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about government services..."
                        className="flex-1 resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base font-inter leading-relaxed"
                        rows={1}
                        style={{ maxHeight: "120px" }}
                      />

                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleVoiceInput}
                          disabled={
                            !browserSupportsSpeechRecognition || !isOnline
                          }
                          className={`p-3 rounded-xl transition-all duration-300 ${
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
                          {isListening ? (
                            <MicOff size={22} />
                          ) : (
                            <Mic size={22} />
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
                className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl"
              >
                {suggestedQuestions.map((question, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSuggestionClick(question)}
                    className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 shadow-sm hover:shadow-md font-inter"
                  >
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {question}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="max-w-4xl mx-auto p-6 space-y-6 pb-32">
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
                      className={`flex space-x-3 max-w-3xl ${
                        msg.type === "user"
                          ? "flex-row-reverse space-x-reverse"
                          : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                          msg.type === "user"
                            ? "bg-blue-600"
                            : "bg-gradient-to-r from-purple-600 to-blue-600"
                        }`}
                      >
                        {msg.type === "user" ? (
                          <User size={16} className="text-white" />
                        ) : (
                          <Bot size={16} className="text-white" />
                        )}
                      </div>
                      <div
                        className={`px-5 py-4 rounded-2xl shadow-sm ${
                          msg.type === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-inter">
                          {msg.content}
                        </div>
                        <div className={`text-xs mt-3 opacity-70 font-mono`}>
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                      <Bot size={16} className="text-white" />
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
            className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
          >
            <div className="max-w-4xl mx-auto">
              <div className="glass rounded-2xl p-4 shadow-xl">
                <div className="flex items-end space-x-4">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about government services..."
                    className="flex-1 resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base font-inter leading-relaxed"
                    rows={1}
                    style={{ maxHeight: "120px" }}
                  />

                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleVoiceInput}
                      disabled={!browserSupportsSpeechRecognition || !isOnline}
                      className={`p-3 rounded-xl transition-all duration-300 ${
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
                      {isListening ? <MicOff size={22} /> : <Mic size={22} />}
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
