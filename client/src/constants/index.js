export const APP_CONFIG = {
  name: "NirdeshakAI",
  tagline: "Navigate Government Services Effortlessly",
  description:
    "Your intelligent companion for accessing Indian government services.",
  version: "1.0.0",
};

export const COLORS = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    900: "#1e3a8a",
  },
  secondary: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
  },
  accent: {
    50: "#fdf4ff",
    100: "#fae8ff",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7c3aed",
  },
};

export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.8 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.8 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6 },
  },
};

export const GOVERNMENT_SERVICES = {
  passport: {
    name: "Passport Services",
    url: "https://passportindia.gov.in",
    description: "Apply for new passport, renewal, and other passport services",
  },
  driving_license: {
    name: "Driving License",
    url: "https://parivahan.gov.in",
    description: "Apply for driving license, renewal, and related services",
  },
  pan_card: {
    name: "PAN Card",
    url: "https://incometaxindia.gov.in",
    description: "Apply for PAN card, corrections, and reprints",
  },
  aadhar: {
    name: "Aadhar Services",
    url: "https://uidai.gov.in",
    description: "Aadhar enrollment, updates, and download services",
  },
  voter_id: {
    name: "Voter ID",
    url: "https://nvsp.in",
    description: "Voter registration, EPIC download, and voter services",
  },
  ration_card: {
    name: "Ration Card",
    url: "#",
    description: "Apply for ration card and manage beneficiary details",
  },
};

export const COMMON_QUERIES = [
  {
    question: "How do I apply for a passport?",
    category: "passport",
    tags: ["passport", "apply", "documents"],
  },
  {
    question: "What documents are needed for driving license?",
    category: "driving_license",
    tags: ["driving", "license", "documents"],
  },
  {
    question: "How to get PAN card online?",
    category: "pan_card",
    tags: ["pan", "card", "online", "apply"],
  },
  {
    question: "Aadhar card update process",
    category: "aadhar",
    tags: ["aadhar", "update", "process"],
  },
  {
    question: "Voter ID registration steps",
    category: "voter_id",
    tags: ["voter", "registration", "steps"],
  },
  {
    question: "How to download income certificate?",
    category: "certificates",
    tags: ["income", "certificate", "download"],
  },
];

export const RESPONSE_TEMPLATES = {
  greeting: [
    "Hello! I'm here to help you with government services.",
    "Welcome to NirdeshakAI! How can I assist you today?",
    "Hi there! What government service information do you need?",
  ],
  notUnderstood: [
    "I'm sorry, I didn't quite understand that. Could you please rephrase your question?",
    "Could you please provide more details about what you're looking for?",
    "I'm here to help with government services. Please let me know which service you need information about.",
  ],
  noService: [
    "I don't have specific information about that service right now. Please try asking about passport, driving license, PAN card, or Aadhar services.",
    "That service isn't in my current database. However, I can help you with passport, driving license, PAN card, and Aadhar related queries.",
  ],
};

export const SPEECH_CONFIG = {
  language: "en-US",
  alternativeLanguages: ["hi-IN", "en-IN"],
  continuous: false,
  interimResults: false,
  maxAlternatives: 1,
};

export const TEXT_TO_SPEECH_CONFIG = {
  rate: 0.9,
  pitch: 1,
  volume: 0.8,
  lang: "en-US",
};
