import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UserPlus, LogIn, ChevronLeft } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
const Auth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (!isLogin) {
        // Registration flow
        if (!isAgreed) {
          setErrorMsg('You must agree to the Terms of Service to register.');
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Generate a unique 8-digit ID (format: XXXX XXXX) for the user
        const part1 = Math.floor(1000 + Math.random() * 9000);
        const part2 = Math.floor(1000 + Math.random() * 9000);
        const generatedId = `${part1} ${part2}`;
        
        // Save initial user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          userId: generatedId,
          createdAt: new Date(),
          balance: 0,
        });

        setSuccessMsg('Registration successful! Logging you in...');
        setTimeout(() => navigate('/home'), 1500);
      } else {
        // Login flow
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/home');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered.');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else {
        setErrorMsg(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-gradient)',
      color: 'var(--text-primary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glowing orbs for modern look */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 0
      }} />
      
      <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', zIndex: 1 }}>
        <button 
          onClick={() => navigate(-1)} 
          className="hover-scale"
          style={{ 
            background: 'var(--glass-bg)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '12px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)'
          }}>
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="animate-slide-up" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 24px',
        textAlign: 'center',
        zIndex: 1
      }}>
        {/* Brand Header */}
        <div style={{ marginBottom: '32px' }} className="animate-fade-in">
          <h1 style={{ fontSize: '4.5rem', fontWeight: 900, margin: 0, lineHeight: 0.9, letterSpacing: '-2px', background: 'var(--text-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            JXM
          </h1>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '4px', color: 'var(--accent-orange)', marginTop: '8px', textTransform: 'uppercase' }}>
            Tour Club
          </h1>
        </div>

        {/* Auth Toggle Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--glass-bg)',
          borderRadius: '16px',
          padding: '6px',
          marginBottom: '32px',
          width: '100%',
          maxWidth: '320px',
          border: '1px solid var(--glass-border)'
        }}>
          <button
            onClick={() => {
              setIsLogin(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: !isLogin ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
              color: !isLogin ? 'var(--accent-orange)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <UserPlus size={18} />
            Register
          </button>
          <button
            onClick={() => {
              setIsLogin(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: isLogin ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
              color: isLogin ? 'var(--accent-orange)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <LogIn size={18} />
            Login
          </button>
        </div>

        {/* Content Section */}
        <div style={{ width: '100%', maxWidth: '340px', transition: 'all 0.4s ease' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
              {isLogin ? 'Welcome Back' : 'Join the Elite'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {isLogin 
                ? 'Enter your email and password to jump back into the action.' 
                : 'Experience the thrill of elite competitive gaming with Jxm Tour Club.'}
            </p>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="animate-fade-in" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="animate-fade-in" style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              {successMsg}
            </div>
          )}

          <div style={{ marginBottom: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email Input */}
            <div style={{
              position: 'relative',
              background: isEmailFocused ? 'rgba(255, 255, 255, 0.08)' : 'var(--glass-bg)',
              border: `2px solid ${isEmailFocused ? 'var(--accent-orange)' : 'var(--glass-border)'}`,
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isEmailFocused ? '0 0 20px rgba(249, 115, 22, 0.15)' : 'none'
            }}>
              <Mail 
                size={20} 
                color={isEmailFocused ? 'var(--accent-orange)' : 'var(--text-secondary)'} 
                style={{ marginRight: '12px', transition: 'color 0.3s ease' }} 
              />
              <div style={{ flex: 1, position: 'relative' }}>
                <label style={{ 
                  position: 'absolute', 
                  top: (isEmailFocused || email) ? '-24px' : '0px',
                  left: (isEmailFocused || email) ? '-32px' : '0px',
                  fontSize: (isEmailFocused || email) ? '0.75rem' : '1rem',
                  color: (isEmailFocused || email) ? 'var(--accent-orange)' : 'var(--text-muted)',
                  fontWeight: (isEmailFocused || email) ? 800 : 500,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: 'none',
                  background: (isEmailFocused || email) ? 'var(--bg-dark)' : 'transparent',
                  padding: (isEmailFocused || email) ? '0 8px' : '0',
                  borderRadius: '4px'
                }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  placeholder={isEmailFocused ? "player@example.com" : ""}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    outline: 'none',
                    color: 'var(--text-primary)',
                    letterSpacing: '1px'
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{
              position: 'relative',
              background: isPasswordFocused ? 'rgba(255, 255, 255, 0.08)' : 'var(--glass-bg)',
              border: `2px solid ${isPasswordFocused ? 'var(--accent-orange)' : 'var(--glass-border)'}`,
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isPasswordFocused ? '0 0 20px rgba(249, 115, 22, 0.15)' : 'none'
            }}>
              <Lock 
                size={20} 
                color={isPasswordFocused ? 'var(--accent-orange)' : 'var(--text-secondary)'} 
                style={{ marginRight: '12px', transition: 'color 0.3s ease' }} 
              />
              <div style={{ flex: 1, position: 'relative' }}>
                <label style={{ 
                  position: 'absolute', 
                  top: (isPasswordFocused || password) ? '-24px' : '0px',
                  left: (isPasswordFocused || password) ? '-32px' : '0px',
                  fontSize: (isPasswordFocused || password) ? '0.75rem' : '1rem',
                  color: (isPasswordFocused || password) ? 'var(--accent-orange)' : 'var(--text-muted)',
                  fontWeight: (isPasswordFocused || password) ? 800 : 500,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: 'none',
                  background: (isPasswordFocused || password) ? 'var(--bg-dark)' : 'transparent',
                  padding: (isPasswordFocused || password) ? '0 8px' : '0',
                  borderRadius: '4px'
                }}>
                  Password
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder={isPasswordFocused ? "••••••••" : ""}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    outline: 'none',
                    color: 'var(--text-primary)',
                    letterSpacing: '1px'
                  }}
                />
              </div>
            </div>
          </div>

          {!isLogin && (
            <div className="animate-fade-in" style={{ 
              marginBottom: '32px', 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <input 
                type="checkbox" 
                id="age"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  accentColor: 'var(--accent-orange)',
                  cursor: 'pointer',
                  marginTop: '2px'
                }} 
              />
              <label htmlFor="age" style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                I certify that I am 18 years of age or older, and agree to the Terms of Service.
              </label>
            </div>
          )}

          <button 
            className="btn btn-primary hover-scale w-full" 
            onClick={handleAuth}
            disabled={isLoading}
            style={{ 
              padding: '16px',
              borderRadius: '16px',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4)',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Login Now' : 'Register Account')}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
