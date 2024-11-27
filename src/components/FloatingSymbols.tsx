import React from 'react';
import { motion } from 'framer-motion';
import { WifiIcon, ServerIcon, GlobeIcon, ShieldIcon, KeyIcon } from 'lucide-react';

const symbols = [
  { Icon: WifiIcon, size: 24, color: 'rgba(37, 99, 235, 0.1)' },
  { Icon: ServerIcon, size: 32, color: 'rgba(37, 99, 235, 0.15)' },
  { Icon: GlobeIcon, size: 28, color: 'rgba(37, 99, 235, 0.12)' },
  { Icon: ShieldIcon, size: 20, color: 'rgba(37, 99, 235, 0.08)' },
  { Icon: KeyIcon, size: 22, color: 'rgba(37, 99, 235, 0.1)' },
];

const generateRandomPosition = () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
});

export const FloatingSymbols: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, index) => {
        const symbol = symbols[index % symbols.length];
        const position = generateRandomPosition();
        const duration = 20 + Math.random() * 30;
        const delay = Math.random() * -30;

        return (
          <motion.div
            key={index}
            initial={{ 
              x: `${position.x}vw`, 
              y: `${position.y}vh`,
              opacity: 0 
            }}
            animate={{
              x: [`${position.x}vw`, `${(position.x + 20) % 100}vw`],
              y: [`${position.y}vh`, `${(position.y + 20) % 100}vh`],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute"
          >
            <symbol.Icon 
              size={symbol.size} 
              style={{ color: symbol.color }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};