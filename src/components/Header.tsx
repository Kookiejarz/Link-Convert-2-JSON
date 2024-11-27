import React from 'react';
import { Link2Icon } from 'lucide-react';
import { motion } from 'framer-motion';
import { TypewriterText } from './TypewriterText';

export const Header: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <motion.div
        className="flex justify-center mb-4"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Link2Icon className="w-12 h-12 text-blue-600" />
      </motion.div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        <TypewriterText 
          text="The Link Converter"
          delay={0.2}
          className="inline-block"
        />
      </h1>
      <p className="text-gray-600">
        <TypewriterText 
          text="Convert your links into Sing-Box compatible configuration"
          delay={1}
          className="inline-block"
        />
      </p>
    </div>
  );
};
