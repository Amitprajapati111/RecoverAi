import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Send, Sparkles, Bot, ArrowRight } from 'lucide-react';
import api from '../../api/client';

interface AskRecoverAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolUsed?: string;
}

export const AskRecoverAIModal: React.FC<AskRecoverAIModalProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am your RecoverAI Revenue Assistant. Ask me anything about revenue at risk, payment failure trends, recovery probabilities, or campaign performance.",
    },
  ]);

  const quickQuestions = [
    'How much revenue is currently at risk?',
    'Why are payments failing most frequently?',
    'How much revenue did we recover so far?',
    'Which recovery strategy works best?',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || question;
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await api.post('/ai/ask', { question: query });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.data.answer,
          toolUsed: response.data.data.toolUsed,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error querying the revenue engine.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask RecoverAI — Revenue Assistant" maxWidth="2xl">
      <div className="flex flex-col h-[480px]">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto space-y-3 p-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="flex items-center text-[10px] font-semibold text-sky-600 mb-1">
                    <Sparkles className="w-3 h-3 mr-1" /> RecoverAI Intelligence
                    {m.toolUsed && (
                      <span className="ml-2 px-1.5 py-0.2 bg-sky-100/80 text-sky-800 rounded text-[9px]">
                        Tool: {m.toolUsed}
                      </span>
                    )}
                  </div>
                )}
                <div className="whitespace-pre-line">{m.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
              <Sparkles className="w-4 h-4 text-sky-500 animate-spin" />
              <span>Querying internal revenue models...</span>
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 mb-3">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about revenue, failures, recovery rate..."
            disabled={loading}
            className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
          <Button
            variant="primary"
            size="md"
            icon={Send}
            onClick={() => handleSend()}
            isLoading={loading}
          >
            Send
          </Button>
        </div>
      </div>
    </Modal>
  );
};
