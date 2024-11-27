import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export type LinkType = 'vmess' | 'vless' | 'ss' | 'trojan';

interface LinkTypeSelectorProps {
  selectedType: LinkType;
  onSelect: (type: LinkType) => void;
}

export const LinkTypeSelector: React.FC<LinkTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  const types: LinkType[] = ['vmess', 'vless', 'ss', 'trojan'];

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {types.map((type, index) => (
        <React.Fragment key={type}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => onSelect(type)}
          >
            {type.toUpperCase()}
          </motion.button>
          {index < types.length - 1 && (
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};