import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { sendChatMessage } from '../api/client';

const SUGGESTED_QUERIES = [
  "Why did my expenses increase?",
  "What recurring subscriptions do I have?",
  "Are there duplicate or suspicious charges?",
  "Which budget categories exceeded limits?",
  "How can I save more each month?",
  "What is the 90-day cash flow forecast?"
];

export default function AdvisorChat({ reportId }) {
  const [messages, setMessages] = useState([
    {
      sender: 'advisor',
      text: "Hello! I am your Autonomous Financial Advisor Agent. I have analyzed your transactions. What would you like to explore about your spending, recurring bills, or budget limits?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryToSend) => {
    const query = queryToSend || inputText;
    if (!query.trim() || loading) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await sendChatMessage(query, reportId);
      setMessages(prev => [...prev, { sender: 'advisor', text: res.response }]);
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { sender: 'advisor', text: "I'm having trouble analyzing that request right now. Please check if transaction data is loaded." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" id="advisor-chat-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="card-title">
            <MessageSquare size={16} color="var(--primary)" />
            AI Financial Copilot
          </h2>
          <p className="card-subtitle">Grounded conversational intelligence across your transactions</p>
        </div>
      </div>

      <div className="chat-window" style={{ border: 'none', height: 440 }}>
        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.sender}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', opacity: 0.7, fontSize: '0.7rem' }}>
                {m.sender === 'advisor' ? <Bot size={11} /> : <User size={11} />}
                <span>{m.sender === 'advisor' ? 'Financial Advisor' : 'You'}</span>
              </div>
              <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble advisor" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              Advisor is analyzing your transactions...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        <div className="suggested-prompts">
          {SUGGESTED_QUERIES.map((q, idx) => (
            <button 
              key={idx}
              className="prompt-chip"
              onClick={() => handleSend(q)}
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          <input 
            type="text"
            className="chat-input"
            placeholder="Ask about spending, budgets, savings..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => handleSend()}
            disabled={loading || !inputText.trim()}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
