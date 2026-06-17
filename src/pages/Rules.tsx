import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Rules = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [rulesText, setRulesText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'rules', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setRulesText(docSnap.data().text || '');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading rules:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderFormattedText = (text: string) => {
    const rulesSource = text || `* Welcome to JXM Tour Club!
* Play fairly and respect all other participants.
* Cheating, hacking, or using emulator advantages will lead to a permanent ban.
* Make sure your in-game ID matches the one registered in your JXM Profile.
* Join the lobby at least 5 to 10 minutes before the match start time.
* Decisions made by match moderators are final and binding.`;

    return rulesSource.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <li key={index} style={{ 
            marginBottom: '10px', 
            fontSize: '0.95rem', 
            color: 'var(--text-secondary)', 
            lineHeight: '1.6', 
            marginLeft: '8px',
            listStyleType: 'none',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ color: 'var(--accent-orange)', fontSize: '1.1rem', lineHeight: '0.9' }}>•</span>
            <span>{trimmed.substring(1).trim()}</span>
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={index} style={{ height: '14px' }} />;
      }
      return (
        <p key={index} style={{ 
          marginBottom: '12px', 
          fontSize: '0.95rem', 
          color: 'var(--text-secondary)', 
          lineHeight: '1.6' 
        }}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'var(--bg-gradient)', 
      color: 'var(--text-primary)'
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
        zIndex: 10,
        position: 'sticky',
        top: 0
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
              {t('gameRules') || 'Game Rules'}
            </h1>
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
          <BookOpen className="w-5 h-5 text-orange-500" />
        </div>
      </div>

      {/* Rules content */}
      <div style={{ 
        flex: 1, 
        padding: '24px 16px',
        overflowY: 'auto'
      }}>
        <div style={{ 
          background: 'var(--card-bg)', 
          border: '1px solid var(--glass-border)', 
          borderRadius: '24px', 
          padding: '24px',
          boxShadow: 'var(--card-shadow)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{
                width: '30px',
                height: '30px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                borderTopColor: 'var(--accent-orange)',
                animation: 'spin 1s ease-in-out infinite'
              }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: 800, 
                marginBottom: '16px', 
                color: 'var(--accent-orange)',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase'
              }}>
                📢 Official Club Directives
              </h3>
              <ul style={{ margin: 0, padding: 0 }}>
                {renderFormattedText(rulesText)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rules;
