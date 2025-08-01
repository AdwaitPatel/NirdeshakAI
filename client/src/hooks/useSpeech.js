import { useState, useEffect, useRef } from "react";

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const [
    browserSupportsSpeechRecognition,
    setBrowserSupportsSpeechRecognition,
  ] = useState(false);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    const initializeSpeechRecognition = () => {
      // Check for speech recognition support
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn("Speech recognition not supported in this browser");
        setBrowserSupportsSpeechRecognition(false);
        return;
      }

      setBrowserSupportsSpeechRecognition(true);

      try {
        recognitionRef.current = new SpeechRecognition();

        // Configure recognition for better reliability
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.maxAlternatives = 1;

        // More aggressive timeout to prevent hanging
        const SPEECH_TIMEOUT = 8000;

        // Event handlers with improved error recovery
        recognitionRef.current.onstart = () => {
          console.log("Speech recognition started successfully");
          setIsListening(true);
          setError(null);
          isInitializing.current = false;

          // Set timeout to automatically stop listening
          timeoutRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              console.log("Speech recognition timeout - auto stopping");
              try {
                recognitionRef.current.stop();
              } catch (err) {
                console.error("Error stopping recognition on timeout:", err);
                setIsListening(false);
              }
            }
          }, SPEECH_TIMEOUT);
        };

        recognitionRef.current.onresult = (event) => {
          console.log("Speech recognition result received:", event);
          let finalTranscript = "";

          try {
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              const transcript = result[0].transcript;

              if (result.isFinal) {
                finalTranscript += transcript;
              }
            }

            // Process final results
            if (finalTranscript.trim()) {
              console.log("Final transcript extracted:", finalTranscript);
              setTranscript(finalTranscript.trim());
              setError(null);
            }
          } catch (err) {
            console.error("Error processing speech results:", err);
            setError("Error processing speech input. Please try again.");
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error, event);
          setIsListening(false);
          isInitializing.current = false;

          // Clear timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          // Handle errors with retry logic for network issues
          switch (event.error) {
            case "not-allowed":
              setError(
                "Microphone access denied. Please allow microphone permissions and try again."
              );
              break;
            case "no-speech":
              setError(
                "No speech detected. Please speak clearly and try again."
              );
              break;
            case "audio-capture":
              setError(
                "No microphone found. Please check your microphone connection."
              );
              break;
            case "network":
              setError(
                "Speech recognition service is temporarily unavailable. Please check your internet connection or try refreshing the page."
              );
              break;
            case "service-not-allowed":
              setError(
                "Speech recognition service is blocked. Please enable it in your browser settings or try typing instead."
              );
              break;
            case "bad-grammar":
            case "language-not-supported":
              setError(
                "Speech recognition had trouble understanding. Please try again or type your message."
              );
              break;
            default:
              setError(
                "Speech recognition encountered an issue. Please try again or type your message."
              );
          }
        };

        recognitionRef.current.onend = () => {
          console.log("Speech recognition ended");
          setIsListening(false);
          isInitializing.current = false;

          // Clear timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };
      } catch (initError) {
        console.error("Failed to initialize speech recognition:", initError);
        setBrowserSupportsSpeechRecognition(false);
        setError(
          "Failed to initialize speech recognition. Please refresh the page and try again."
        );
      }
    };

    initializeSpeechRecognition();

    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } catch (err) {
        console.error("Error cleaning up speech recognition:", err);
      }
    };
  }, []);

  const testNetworkConnection = async () => {
    try {
      // Test network connectivity by making a small request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch("https://www.google.com/favicon.ico", {
        method: "HEAD",
        signal: controller.signal,
        mode: "no-cors",
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.log("Network test failed:", error);
      return false;
    }
  };

  const startListening = async () => {
    if (!browserSupportsSpeechRecognition) {
      setError("Speech recognition is not supported in your browser");
      return;
    }

    if (!recognitionRef.current) {
      setError(
        "Speech recognition not initialized. Please refresh the page and try again."
      );
      return;
    }

    if (isListening || isInitializing.current) {
      console.log("Already listening or initializing, stopping first");
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
      return;
    }

    try {
      // Check basic network connectivity
      if (!navigator.onLine) {
        setError(
          "You appear to be offline. Speech recognition requires an internet connection."
        );
        return;
      }

      // Test network connection to speech services
      const hasConnection = await testNetworkConnection();
      if (!hasConnection) {
        setError(
          "Poor network connection detected. Please check your internet and try again."
        );
        return;
      }

      isInitializing.current = true;

      // Test microphone access first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        // Stop the stream immediately after testing
        stream.getTracks().forEach((track) => track.stop());
      } catch (permissionError) {
        console.error("Microphone permission error:", permissionError);
        isInitializing.current = false;

        if (permissionError.name === "NotAllowedError") {
          setError(
            "Microphone access denied. Please allow microphone permissions in your browser settings and try again."
          );
        } else if (permissionError.name === "NotFoundError") {
          setError(
            "No microphone found. Please connect a microphone and try again."
          );
        } else {
          setError(
            "Unable to access microphone. Please check your browser settings and try again."
          );
        }
        return;
      }

      // Clear previous state
      setTranscript("");
      setError(null);

      // Start recognition with error handling
      try {
        console.log("Starting speech recognition...");
        recognitionRef.current.start();
      } catch (startError) {
        console.error("Error starting speech recognition:", startError);
        isInitializing.current = false;
        setError(
          "Failed to start speech recognition. Please try again or refresh the page."
        );
      }
    } catch (generalError) {
      console.error("General error in startListening:", generalError);
      isInitializing.current = false;
      setError(
        "An unexpected error occurred. Please try again or refresh the page."
      );
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      console.log("Stopping speech recognition...");
      recognitionRef.current.stop();
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition,
    resetTranscript: () => {
      setTranscript("");
    },
    clearError: () => {
      setError(null);
    },
  };
};

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(speechSynthesis.getVoices());
    };

    updateVoices();
    speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  const speak = (text, options = {}) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || "en-US";
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      // Try to find a female voice
      const femaleVoice = voices.find(
        (voice) =>
          voice.name.toLowerCase().includes("female") ||
          voice.name.toLowerCase().includes("woman") ||
          voice.name.toLowerCase().includes("zira") ||
          voice.name.toLowerCase().includes("samantha")
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    }
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return {
    speak,
    stop,
    isSpeaking,
    voices,
    supported: "speechSynthesis" in window,
  };
};
