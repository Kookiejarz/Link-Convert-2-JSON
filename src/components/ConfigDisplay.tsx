import React from 'react';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfigDisplayProps {
  config: string | null;
}

export const ConfigDisplay: React.FC<ConfigDisplayProps> = ({ config }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (config) {
      navigator.clipboard.writeText(config);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!config) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full mt-6"
      >
        <div className="flex justify-between items-center mb-2">
          <motion.h3
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="text-lg font-semibold text-gray-700"
          >
            Configuration JSON
          </motion.h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <motion.div
              initial={false}
              animate={{ rotate: copied ? 360 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-green-500" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
            </motion.div>
            {copied ? 'Copied!' : 'Copy'}
          </motion.button>
        </div>
        <motion.pre
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm"
        >
          {config}
        </motion.pre>
      </motion.div>
    </AnimatePresence>
  );
};