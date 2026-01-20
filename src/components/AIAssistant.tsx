import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send } from 'lucide-react';

export const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'Olá! Sou seu assistente virtual da Maju. Precisa de ajuda para preencher algum campo?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('/.netlify/functions/assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg })
            });

            if (!response.ok) throw new Error('Falha na requisição');

            const data = await response.json();

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error("Failed to fetch response from AI assistant", error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema de conexão. Tente novamente mais tarde.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <motion.button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 bg-white text-black rounded-full shadow-2xl z-40 hover:scale-110 transition-transform ${isOpen ? 'hidden' : 'flex'}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
            >
                <Bot size={28} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-6 right-6 w-[90vw] md:w-96 h-[500px] max-h-[80vh] bg-gray-900 border border-white/20 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-white/10">
                            <div className="flex items-center gap-2 text-white font-medium">
                                <Bot size={20} className="text-blue-400" />
                                Assistente Maju
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white self-end rounded-tr-sm'
                                            : 'bg-gray-800 text-gray-200 self-start rounded-tl-sm'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="bg-gray-800 text-gray-200 self-start rounded-tl-sm p-3 rounded-2xl text-sm">
                                    <span className="animate-pulse">...</span>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-gray-800 border-t border-white/10 flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Digite sua dúvida..."
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
