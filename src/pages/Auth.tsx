import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UserPlus, LogIn, ChevronLeft } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User as UserIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

const Auth = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize GoogleAuth configuration
    GoogleAuth.initialize({
      clientId: '194765747449-l22sfgpnv6c9gugdhsuij2nsbpu6trv0.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      let user;

      if (Capacitor.isNativePlatform()) {
        // Native Google Auth login
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;

        // Authenticate with Firebase using native Google credentials
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        user = userCredential.user;
      } else {
        // Web Google Auth login using Firebase Popup (bypasses deprecated gapi library)
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        user = userCredential.user;
      }

      // Check if user document already exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Generate JXM Profile info for first-time Google sign-ins
        const nameVal = user.displayName || 'Google User';
        const part1 = Math.floor(1000 + Math.random() * 9000);
        const part2 = Math.floor(1000 + Math.random() * 9000);
        const generatedId = `${part1} ${part2}`;
        const generatedAvatar = user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nameVal)}`;
        const generatedUsername = `@${nameVal.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(100 + Math.random() * 900)}`;

        await setDoc(userDocRef, {
          email: user.email,
          name: nameVal,
          username: generatedUsername,
          avatar: generatedAvatar,
          userId: generatedId,
          createdAt: new Date(),
          balance: 0,
        });
      }

      setSuccessMsg('Logged in successfully!');
      setTimeout(() => navigate('/home'), 1500);
    } catch (error: any) {
      console.error("Google Auth failed:", error);
      setErrorMsg('Google Authentication failed: ' + (error.message || error.code || JSON.stringify(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg(t('enterEmailPass'));
      return;
    }

    setIsLoading(true);
    try {
        if (!isLogin) {
          // Registration flow
          if (!isAgreed) {
            setErrorMsg(t('agreeTerms'));
            setIsLoading(false);
            return;
          }
          if (!name) {
            setErrorMsg(t('enterName'));
            setIsLoading(false);
            return;
          }
  
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          // Generate a unique 8-digit ID (format: XXXX XXXX) for the user
          const part1 = Math.floor(1000 + Math.random() * 9000);
          const part2 = Math.floor(1000 + Math.random() * 9000);
          const generatedId = `${part1} ${part2}`;
          const generatedAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
          const generatedUsername = `@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(100 + Math.random() * 900)}`;
          
          await updateProfile(user, {
            displayName: name,
            photoURL: generatedAvatar
          });
          
          // Save initial user profile in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            name: name,
            username: generatedUsername,
            avatar: generatedAvatar,
            userId: generatedId,
          createdAt: new Date(),
          balance: 0,
        });

        setSuccessMsg(t('registrationSuccess'));
        setTimeout(() => navigate('/home'), 1500);
      } else {
        // Login flow
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/home');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg(t('emailInUse'));
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setErrorMsg(t('invalidCredentials'));
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg(t('weakPassword'));
      } else {
        setErrorMsg(error.message || t('authFailed'));
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
        padding: '12px 16px',
        textAlign: 'center',
        zIndex: 1
      }}>
        {/* Brand Header */}
        <div style={{ marginBottom: '24px' }} className="animate-fade-in">
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, lineHeight: 0.9, letterSpacing: '-2px', background: 'var(--text-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            JXM
          </h1>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '4px', color: 'var(--accent-orange)', marginTop: '8px', textTransform: 'uppercase' }}>
            Tour Club
          </h1>
        </div>

        {/* Auth Toggle Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--glass-bg)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          width: '100%',
          maxWidth: '280px',
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
            {t('register')}
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
            {t('login')}
          </button>
        </div>

        {/* Content Section */}
        <div style={{ width: '100%', maxWidth: '300px', transition: 'all 0.4s ease' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
              {isLogin ? t('welcomeBack') : t('joinTheElite')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {isLogin 
                ? t('loginSub') 
                : t('registerSub')}
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
            {!isLogin && (
              <div style={{
                position: 'relative',
                background: isNameFocused ? 'rgba(255, 255, 255, 0.08)' : 'var(--glass-bg)',
                border: `2px solid ${isNameFocused ? 'var(--accent-orange)' : 'var(--glass-border)'}`,
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isNameFocused ? '0 0 20px rgba(249, 115, 22, 0.15)' : 'none'
              }}>
                <UserIcon 
                  size={20} 
                  color={isNameFocused ? 'var(--accent-orange)' : 'var(--text-secondary)'} 
                  style={{ marginRight: '12px', transition: 'color 0.3s ease' }} 
                />
                <div style={{ flex: 1, position: 'relative' }}>
                  <label style={{ 
                    position: 'absolute', 
                    top: (isNameFocused || name) ? '-24px' : '0px',
                    left: (isNameFocused || name) ? '-32px' : '0px',
                    fontSize: (isNameFocused || name) ? '0.75rem' : '1rem',
                    color: (isNameFocused || name) ? 'var(--accent-orange)' : 'var(--text-muted)',
                    fontWeight: (isNameFocused || name) ? 800 : 500,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: 'none',
                    background: (isNameFocused || name) ? 'var(--bg-dark)' : 'transparent',
                    padding: (isNameFocused || name) ? '0 8px' : '0',
                    borderRadius: '4px'
                  }}>
                    {t('fullName')}
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    placeholder={isNameFocused ? t('fullName') : ""}
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
            )}
            
            {/* Email Input */}
            <div style={{
              position: 'relative',
              background: isEmailFocused ? 'rgba(255, 255, 255, 0.08)' : 'var(--glass-bg)',
              border: `2px solid ${isEmailFocused ? 'var(--accent-orange)' : 'var(--glass-border)'}`,
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'center',
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
                  {t('emailAddress')}
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
              borderRadius: '12px',
              padding: '12px 16px',
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
                  {t('password')}
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
                {t('ageCertification')}
              </label>
            </div>
          )}

          <button 
            className="btn btn-primary hover-scale w-full" 
            onClick={handleAuth}
            disabled={isLoading}
            style={{ 
              padding: '14px',
              borderRadius: '12px',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4)',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? t('processing') : (isLogin ? t('loginNow') : t('registerAccount'))}
            <ArrowRight size={20} />
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          </div>

          {/* Google Sign-in Button */}
          <button 
            className="hover-scale w-full" 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{ 
              padding: '14px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--card-shadow)'
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" style={{ display: 'block' }}>
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.44-1.09 2.66-2.31 3.48l3.6 2.79c2.1-1.94 3.76-5.8 3.76-8.37z" />
              <path fill="#FBBC05" d="M5.24 10.55c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.39 7.2C.5 9 .5 11 1.39 12.8l3.85-2.25z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.79c-1 .67-2.28 1.07-3.6 1.07-3.34 0-5.86-1.81-6.76-4.51L1.15 17.1C3.13 21.02 7.11 23 12 23z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;

