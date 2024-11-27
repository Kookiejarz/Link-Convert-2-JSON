import React from 'react';
import { motion } from 'framer-motion';

interface LinkInputProps {
  link: string;
  setLink: (value: string) => void;
  placeholder?: string;
}

export const LinkInput: React.FC<LinkInputProps> = ({ 
  link, 
  setLink,
  placeholder = "Enter link..."
}) => {
  return (
    <div>
      <motion.label
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        htmlFor="link"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Enter Link
      </motion.label>
      <motion.input
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        id="link"
        type="text"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      />
    </div>
  );
};