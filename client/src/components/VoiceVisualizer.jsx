import { motion } from "framer-motion";

const VoiceVisualizer = ({ isListening }) => {
  if (!isListening) return null;

  return (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-red-500 to-pink-500 rounded-full"
          animate={{
            height: [8, 24, 8],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
