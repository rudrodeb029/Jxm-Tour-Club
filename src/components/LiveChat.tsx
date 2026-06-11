import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const LiveChat = () => {
  const { isChatOpen, setIsChatOpen, messages, sendMessage, isTyping } = useChat();
  const { t } = useLanguage();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(inputMessage, 'user');
    setInputMessage('');
  };

  const location = useLocation();
  const hiddenPaths = ['/', '/onboarding', '/auth', '/admin', '/admin/dashboard'];
  const isHidden = hiddenPaths.some(path => location.pathname === path || (path !== '/' && location.pathname.startsWith(path)));

  if (isHidden) return null;

  return (
    <>
      {/* Chat Window */}
      {isChatOpen && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: 'calc(100% - 48px)',
            maxWidth: '400px',
            height: '500px',
            maxHeight: '70vh',
            background: 'var(--bg-dark)',
            backdropFilter: 'blur(20px)',
            borderRadius: '32px',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '24px', 
            background: 'var(--glass-bg)', 
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{t('liveSupport') || 'Live Support'}</div>
                <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>{t('alwaysOnline') || 'Always Online'}</div>
              </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              className="hover-scale"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
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
                    gap: '6px',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: isUser ? 'row-reverse' : 'row', marginBottom: '2px' }}>
                    <img 
                      src={msg.avatar || (isUser ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' : 'https://api.dicebear.com/7.x/bottts/svg?seed=Support')} 
                      alt={msg.userName || 'User'} 
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        border: `1.5px solid ${isUser ? 'var(--accent-orange)' : 'var(--glass-border)'}`,
                      }} 
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {msg.userName || (isUser ? t('you') : t('support'))}
                    </span>
                  </div>
                  <div style={{ 
                    background: isUser ? 'var(--accent-gradient)' : 'var(--glass-bg)',
                    padding: '10px 14px',
                    borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    color: isUser ? 'white' : 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    border: isUser ? 'none' : '1px solid var(--glass-border)',
                    boxShadow: isUser ? '0 4px 12px rgba(249, 111, 46, 0.15)' : 'none'
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>{msg.time}</span>
                    {isUser && (
                      <span style={{ 
                        fontSize: '0.6rem', 
                        color: msg.status === 'sending' ? 'var(--text-muted)' : '#10B981', 
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {msg.status === 'sending' ? (
                          <span style={{ 
                            display: 'inline-block',
                            width: '4px',
                            height: '4px',
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
                  gap: '6px',
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <img 
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=Support" 
                    alt="Support Bot" 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      border: '1px solid var(--glass-border)'
                    }} 
                  />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    {t('supportBot')}
                  </span>
                </div>
                <div style={{ 
                  background: 'var(--glass-bg)',
                  padding: '10px 14px',
                  borderRadius: '4px 16px 16px 16px',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span className="typing-dot" style={{ width: '5px', height: '5px', background: 'var(--text-primary)', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span className="typing-dot" style={{ width: '5px', height: '5px', background: 'var(--text-primary)', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span className="typing-dot" style={{ width: '5px', height: '5px', background: 'var(--text-primary)', borderRadius: '50%', display: 'inline-block' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSendMessage}
            style={{ 
              padding: '20px', 
              background: 'var(--glass-bg)', 
              borderTop: '1px solid var(--glass-border)',
              display: 'flex',
              gap: '12px'
            }}
          >
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t('typeMessage')}
              style={{
                flex: 1,
                background: 'var(--input-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button 
              type="submit"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'var(--accent-gradient)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 5px 15px rgba(227, 67, 96, 0.3)'
              }}
              className="hover-scale"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default LiveChat;
