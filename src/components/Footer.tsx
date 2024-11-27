import React from 'react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-sm"
    >
      Made with ❤️ by Liu © {currentYear}
    </motion.footer>
  );
};