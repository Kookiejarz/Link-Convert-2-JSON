import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseLink } from './utils/linkParser';
import { ConfigDisplay } from './components/ConfigDisplay';
import { AnimatedContainer } from './components/AnimatedContainer';
import { FloatingSymbols } from './components/FloatingSymbols';
import { Header } from './components/Header';
import { LinkInput } from './components/LinkInput';
import { Footer } from './components/Footer';
import { ConvertButton } from './components/ConvertButton';

function App() {
  const [link, setLink] = useState('');
  const [config, setConfig] = useState<object | null>(null);
  const [error, setError] = useState('');

  const handleConvert = () => {
    setError('');
    setConfig(null);

    if (!link) {
      setError('Please enter a link');
      return;
    }

    const result = parseLink(link);
    if (result) {
      setConfig(result);
    } else {
      setError('Invalid link format');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <FloatingSymbols />
      <AnimatedContainer>
        <div className="max-w-3xl mx-auto px-4 py-12 relative z-10">
          <Header />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-6"
          >
            <div className="space-y-4">
              <LinkInput 
                link={link} 
                setLink={setLink} 
                placeholder="vmess:// or vless://"
              />

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <ConvertButton onClick={handleConvert} />

              <ConfigDisplay config={config} />
            </div>
          </motion.div>
        </div>
      </AnimatedContainer>
      <Footer />
    </div>
  );
}

export default App;