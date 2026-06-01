'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { useAiChat, ChatMessage } from '@/hooks/useAiChat';
import { useTranslations } from 'next-intl';

export default function FloatingAiChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Hello! I am your Uttarakhand Compliance Assistant. How can I help you regarding industrial inspections today?' }
    ]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { mutate: sendMessage, isPending } = useAiChat();

    // Scroll to bottom when messages change
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim() || isPending) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        const updatedHistory = [...messages, userMessage];
        setMessages(updatedHistory);
        setInput('');

        // Provide some contextual instruction for the investor context
        const context = 'The user is an investor seeking guidance on regulatory compliance, specifically related to Labour, Fire, Pollution (PCB), and Factory inspections in Uttarakhand.';

        sendMessage(
            { message: userMessage.text, history: messages, context },
            {
                onSuccess: (data) => {
                    setMessages(prev => [...prev, { role: 'model', text: data.response }]);
                },
                onError: () => {
                    setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error processing your request. Please try again.' }]);
                }
            }
        );
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <div className={`transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100 pointer-events-auto mb-4' : 'scale-75 opacity-0 pointer-events-none absolute bottom-0'}`}>
                <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 h-[500px] max-h-[80vh] flex flex-col overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex justify-between items-center shadow-md">
                        <div className="flex items-center space-x-2">
                            <Bot className="w-6 h-6" />
                            <h3 className="font-semibold text-lg">Compliance Assistant</h3>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                                    msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-br-none shadow-sm' 
                                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
                                }`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isPending && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100 flex items-center space-x-2">
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                    <span className="text-sm text-gray-500">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask a compliance question..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800 placeholder-gray-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isPending}
                                className={`ml-2 p-1.5 rounded-full transition-colors ${
                                    input.trim() && !isPending ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'
                                }`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toggle Button Container */}
            <div className="flex items-center space-x-3">
                {/* Floating Clickable Banner */}
                {!isOpen && (
                    <div 
                        onClick={() => setIsOpen(true)}
                        className="bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100 cursor-pointer animate-pulse-slow hover:scale-105 transition-transform group flex items-center space-x-2"
                    >
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                            Need help? <strong className="text-blue-600">Chat with AI</strong>
                        </span>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                )}

                {/* Primary Circle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-50 ${
                        isOpen ? 'opacity-0 scale-75 pointer-events-none absolute' : 'opacity-100 scale-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30'
                    }`}
                    aria-label="Toggle AI Assistant"
                >
                    <Bot className="w-7 h-7" />
                </button>
            </div>
        </div>
    );
}
