import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const Support = () => {
  const navigate = useNavigate();
  const { messages, sendMessage, isTyping } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(inputMessage, 'user');
    setInputMessage('');
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'var(--bg-gradient)', 
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'var(--modal-bg)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ 
              background: 'var(--glass-bg)', 
              border: '1px solid var(--glass-border)', 
              color: 'var(--text-primary)', 
              cursor: 'pointer', 
              padding: '10px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--card-shadow)'
            }}
            className="hover-scale"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Live <span style={{ color: 'var(--accent-orange)' }}>Support</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 8px #10B981' }}></span>
              <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>Online Support Agent</span>
            </div>
          </div>
        </div>
        <div style={{ 
          width: '44px', 
          height: '44px', 
          borderRadius: '14px', 
          background: 'var(--glass-bg)', 
          border: '1px solid var(--glass-border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: 'var(--card-shadow)'
        }}>
          <MessageSquare className="w-5 h-5 text-orange-500" />
        </div>
      </div>

      {/* Messages List Area */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
        className="custom-scrollbar"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id} 
              className="animate-message-in"
              style={{ 
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                display: 'flex',
                gap: '10px',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                <img 
                  src={msg.avatar || (isUser ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' : 'https://api.dicebear.com/7.x/bottts/svg?seed=Support')} 
                  alt={msg.userName || 'User'} 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    border: `1.5px solid ${isUser ? 'var(--accent-orange)' : 'var(--glass-border)'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }} 
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {msg.userName || (isUser ? 'You' : 'Support')}
                </span>
              </div>
              <div style={{ 
                background: isUser ? 'var(--accent-gradient)' : 'var(--glass-bg)',
                padding: '14px 18px',
                borderRadius: isUser ? '24px 4px 24px 24px' : '4px 24px 24px 24px',
                color: isUser ? 'white' : 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 500,
                lineHeight: '1.4',
                border: isUser ? 'none' : '1px solid var(--glass-border)',
                boxShadow: isUser ? '0 8px 20px rgba(249, 111, 46, 0.15)' : 'var(--card-shadow)'
              }}>
                {msg.text}
              </div>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginRight: isUser ? '8px' : '0', 
                marginLeft: isUser ? '0' : '8px', 
              }}>
                <span style={{ 
                  fontSize: '0.65rem', 
                  color: 'var(--text-muted)', 
                  fontWeight: 600 
                }}>
                  {msg.time}
                </span>
                {isUser && (
                  <span style={{ 
                    fontSize: '0.65rem', 
                    color: msg.status === 'sending' ? 'var(--text-muted)' : '#10B981', 
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {msg.status === 'sending' ? (
                      <span style={{ 
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--text-secondary)',
                        animation: 'pulse 1s infinite'
                      }} />
                    ) : (
                      '✓✓'
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div 
            className="animate-message-in"
            style={{ 
              alignSelf: 'flex-start',
              maxWidth: '80%',
              display: 'flex',
              gap: '10px',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img 
                src="https://api.dicebear.com/7.x/bottts/svg?seed=Support" 
                alt="Support Bot" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  border: '1.5px solid var(--glass-border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }} 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                Support Bot
              </span>
            </div>
            <div style={{ 
              background: 'var(--glass-bg)',
              padding: '14px 20px',
              borderRadius: '4px 24px 24px 24px',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--text-primary)', borderRadius: '50%', display: 'inline-block' }}></span>
              <span className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--text-primary)', borderRadius: '50%', display: 'inline-block' }}></span>
              <span className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--text-primary)', borderRadius: '50%', display: 'inline-block' }}></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div style={{ 
        padding: '16px', 
        paddingBottom: '96px',
        background: 'var(--modal-bg)', 
        borderTop: '1px solid var(--glass-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
        zIndex: 10
      }}>
        <form 
          onSubmit={handleSendMessage}
          style={{ 
            display: 'flex',
            gap: '12px',
            maxWidth: '600px',
            margin: '0 auto'
          }}
        >
          <input 
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
            style={{
              flex: 1,
              background: 'var(--input-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '14px 20px',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'all 0.3s',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
          <button 
            type="submit"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(249, 111, 46, 0.25)',
              transition: 'all 0.2s'
            }}
            className="hover-scale"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Support;
