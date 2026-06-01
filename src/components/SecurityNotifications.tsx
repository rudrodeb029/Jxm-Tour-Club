import React from 'react';
import { securityNotifications } from '../data/mockData';

interface SecurityNotificationsProps {
  onClose: () => void;
}

const SecurityNotifications: React.FC<SecurityNotificationsProps> = ({ onClose }) => {
  return (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="animate-fade-in"
        style={{
          background: 'var(--modal-bg)',
          width: '100%',
          maxWidth: '450px',
          maxHeight: '85vh',
          borderRadius: '24px',
          padding: '32px 24px',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>
            Security <span style={{ color: 'var(--accent-orange)' }}>Alerts</span>
          </h3>
          <button 
            onClick={onClose}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {securityNotifications.map((notif) => (
            <div 
              key={notif.id} 
              style={{ 
                background: 'var(--glass-bg)', 
                padding: '20px', 
                borderRadius: '24px', 
                border: '1px solid var(--glass-border)',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '14px', 
                background: notif.type === 'alert' ? 'rgba(239, 68, 68, 0.1)' : notif.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {notif.type === 'alert' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>}
                {notif.type === 'success' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>}
                {notif.type === 'info' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{notif.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>{notif.time}</div>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>{notif.message}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          style={{ width: '100%', padding: '22px', borderRadius: '26px', background: 'var(--accent-gradient)', border: 'none', color: '#FFFFFF', fontWeight: 900, fontSize: '1.1rem', marginTop: '32px', cursor: 'pointer', boxShadow: '0 12px 35px rgba(249, 111, 46, 0.4)' }}
        >
          DONE
        </button>
      </div>
    </div>
  );
};

export default SecurityNotifications;
