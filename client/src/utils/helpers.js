export const formatTimestamp = (date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const generateMessageId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};

export const scrollToBottom = (element) => {
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

export const detectLanguage = (text) => {
  const hindiPattern = /[\u0900-\u097F]/;
  const englishPattern = /^[A-Za-z\s.,!?'"()-]+$/;

  if (hindiPattern.test(text)) {
    return "hi";
  } else if (englishPattern.test(text)) {
    return "en";
  }
  return "en"; // default to English
};

export const validateInput = (input) => {
  if (!input || typeof input !== "string") {
    return false;
  }

  const trimmed = input.trim();
  return trimmed.length > 0 && trimmed.length <= 1000; // Max 1000 characters
};

export const formatResponse = (response) => {
  // Format AI response for better readability
  if (!response) return "";

  // Add proper spacing after periods
  let formatted = response.replace(/\.\s*/g, ". ");

  // Ensure proper capitalization after periods
  formatted = formatted.replace(/\.\s*([a-z])/g, (match, letter) => {
    return ". " + letter.toUpperCase();
  });

  return formatted.trim();
};

export const getResponseTime = () => {
  // Simulate response time based on message complexity
  return Math.random() * 2000 + 1000; // 1-3 seconds
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Government service related utilities
export const serviceCategories = {
  passport: "Passport Services",
  driving: "Driving License",
  pan: "PAN Card",
  aadhar: "Aadhar Services",
  voter: "Voter ID",
  income: "Income Certificate",
  domicile: "Domicile Certificate",
  ration: "Ration Card",
  birth: "Birth Certificate",
  death: "Death Certificate",
  marriage: "Marriage Certificate",
  property: "Property Registration",
  police: "Police Clearance",
  court: "Court Services",
  tax: "Tax Services",
};

export const getServiceKeywords = (query) => {
  const keywords = query.toLowerCase().split(" ");
  const matchedServices = [];

  Object.keys(serviceCategories).forEach((service) => {
    if (
      keywords.some(
        (keyword) => keyword.includes(service) || service.includes(keyword)
      )
    ) {
      matchedServices.push(serviceCategories[service]);
    }
  });

  return matchedServices;
};

export const getCommonQuestions = () => {
  return [
    "How do I apply for a passport?",
    "What documents are needed for driving license?",
    "How to get PAN card online?",
    "Aadhar card update process",
    "Voter ID registration steps",
    "Income certificate application",
    "Property registration procedure",
    "Police verification process",
  ];
};
