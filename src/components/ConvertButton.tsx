import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ConvertButtonProps {
  onClick: () => void;
}

export const ConvertButton: React.FC<ConvertButtonProps> = ({ onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors relative overflow-hidden group"
    >
      <div className="flex items-center justify-center gap-2">
        <span>Convert to JSON</span>
        <motion.div
          animate={{
            rotate: isHovered ? [0, 180, 360] : 0,
            scale: isHovered ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
      </div>
      <motion.div
        className="absolute inset-0 bg-blue-400 opacity-20"
        initial={false}
        animate={{
          scale: isHovered ? [1, 1.5] : 1,
          opacity: isHovered ? [0.2, 0] : 0.2,
        }}
        transition={{ duration: 0.4 }}
      />
    </motion.button>
  );
};