import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UserPlus, LogIn, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail } from 'firebase/auth';
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize GoogleAuth configuration
    GoogleAuth.initialize({
      clientId: '194765747449-l22sfgpnv6c9gugdhsuij2nsbpu6trv0.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });
  }, []);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setIsLoading(true);
          const user = result.user;

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
          setTimeout(() => {
            navigate('/home');
          }, 1000);
        }
      } catch (error: any) {
        console.error("Error with redirect result", error);
        setErrorMsg(error.message || 'Google Auth Redirect failed');
      } finally {
        setIsLoading(false);
      }
    };
    checkRedirect();
  }, [navigate]);

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
        // Web Google Auth login using Firebase Popup/Redirect (bypasses deprecated gapi library)
        const provider = new GoogleAuthProvider();
        const isMobileWeb = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobileWeb) {
          await signInWithRedirect(auth, provider);
          return; // Redirect will reload the page
        } else {
          try {
            const userCredential = await signInWithPopup(auth, provider);
            user = userCredential.user;
          } catch (popupError: any) {
            console.warn("Popup blocked, falling back to redirect:", popupError);
            if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-popup-request') {
              await signInWithRedirect(auth, provider);
              return; // Redirect will reload the page
            } else {
              throw popupError;
            }
          }
        }
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

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!email) {
      setErrorMsg('Please enter your email address first to reset your password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Failed to send password reset email.');
    }
  };

  // Helper to split title so the last word is always highlighted with a neon gradient
  const getStyledTitle = () => {
    const titleText = isLogin ? t('welcomeBack') : t('joinTheElite');
    const words = titleText.split(' ');
    if (words.length <= 1) {
      return <span className="cyber-title-accent">{titleText}</span>;
    }
    const lastWord = words.pop();
    const firstPart = words.join(' ');
    return (
      <>
        {firstPart} <span className="cyber-title-accent">{lastWord}</span>
      </>
    );
  };

  return (
    <div className="cyber-auth-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@600;700&display=swap');

        .cyber-auth-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: #ffffff;
          position: relative;
          font-family: 'Rajdhani', sans-serif;
          overflow-x: hidden;
          padding: 40px 16px;
        }

        .cyber-back-btn {
          transition: all 0.25s ease;
        }

        .cyber-back-btn:hover {
          background: rgba(162, 0, 255, 0.15) !important;
          border-color: #00d2ff !important;
          color: #00d2ff !important;
          box-shadow: 0 0 15px rgba(0, 210, 255, 0.4);
          transform: scale(1.05);
        }

        .cyber-header {
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          z-index: 1;
        }

        .cyber-logo-wrapper {
          position: relative;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 106px;
          height: 106px;
          z-index: 2;
        }

        .cyber-hud-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 12px rgba(0, 210, 255, 0.45)) drop-shadow(0 0 22px rgba(162, 0, 255, 0.35));
        }

        .hud-rotate-cw {
          animation: hud-rotate-cw-anim 25s linear infinite;
          transform-origin: center;
        }

        .hud-rotate-ccw {
          animation: hud-rotate-ccw-anim 16s linear infinite;
          transform-origin: center;
        }

        @keyframes hud-rotate-cw-anim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes hud-rotate-ccw-anim {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        .cyber-title {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: 2.4rem;
          font-style: italic;
          margin: 0;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          background: linear-gradient(to bottom, #ffffff 30%, #b3b3b3 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        }

        .cyber-title-accent {
          background: linear-gradient(to right, #9d4edd 0%, #c77dff 60%, #e0aaff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cyber-subtitle-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 10px;
          width: 100%;
          max-width: 380px;
        }

        .cyber-subtitle-line {
          flex: 1;
          height: 1.5px;
          position: relative;
        }

        .cyber-subtitle-line.left {
          background: linear-gradient(to right, transparent, #bd52ff);
        }

        .cyber-subtitle-line.right {
          background: linear-gradient(to left, transparent, #bd52ff);
        }

        .cyber-subtitle-line::after {
          content: '';
          position: absolute;
          width: 4px;
          height: 4px;
          background: #bd52ff;
          transform: rotate(45deg);
          top: -1.5px;
          box-shadow: 0 0 8px #bd52ff;
        }

        .cyber-subtitle-line.left::after {
          right: 0;
        }

        .cyber-subtitle-line.right::after {
          left: 0;
        }

        .cyber-subtitle {
          color: #a3a3d1;
          font-size: 0.85rem;
          letter-spacing: 2px;
          margin: 0;
          text-transform: uppercase;
          font-weight: 700;
        }

        /* Card Container with Clipped Corners & Neon Glow */
        .cyber-card-wrapper {
          width: 100%;
          max-width: 380px;
          position: relative;
          background: linear-gradient(135deg, rgba(79, 38, 230, 0.4) 0%, rgba(162, 0, 255, 0.4) 50%, rgba(0, 210, 255, 0.4) 100%);
          padding: 1.5px;
          clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);
          filter: drop-shadow(0 0 25px rgba(162, 0, 255, 0.25));
          z-index: 1;
        }

        .cyber-card-inner {
          background: rgba(10, 8, 22, 0.93);
          clip-path: polygon(19px 0, 100% 0, 100% calc(100% - 19px), calc(100% - 19px) 100%, 0 100%, 0 19px);
          padding: 36px 24px;
          display: flex;
          flex-direction: column;
        }

        .cyber-inputs-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Input Fields */
        .cyber-input-group {
          display: flex;
          align-items: center;
          background: rgba(16, 12, 32, 0.65);
          border: 1px solid rgba(157, 78, 221, 0.25);
          padding: 10px 14px;
          transition: all 0.3s ease;
          position: relative;
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
        }

        .cyber-input-group:focus-within {
          border-color: #00d2ff;
          box-shadow: inset 0 0 10px rgba(0, 210, 255, 0.15), 0 0 15px rgba(0, 210, 255, 0.1);
        }

        .cyber-input-icon-box {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(157, 78, 221, 0.5);
          background: rgba(157, 78, 221, 0.1);
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #bd52ff;
          margin-right: 14px;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(189, 82, 255, 0.2);
        }

        .cyber-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 0.95rem;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .cyber-input::placeholder {
          color: #5c5c8a;
          font-weight: 500;
        }

        /* Eye visibility toggle */
        .cyber-eye-toggle {
          background: transparent;
          border: none;
          outline: none;
          color: #5c5c8a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: color 0.2s ease;
        }

        .cyber-eye-toggle:hover {
          color: #00d2ff;
        }

        /* Checkbox Row */
        .cyber-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 16px 0 24px 0;
          font-size: 0.9rem;
        }

        .cyber-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a3a3d1;
          cursor: pointer;
          user-select: none;
          font-weight: 600;
        }

        .cyber-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #bd52ff;
          cursor: pointer;
          border: 1px solid rgba(157, 78, 221, 0.5);
          background: rgba(16, 12, 32, 0.65);
        }

        .cyber-forgot-link {
          color: #bd52ff;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .cyber-forgot-link:hover {
          color: #e0aaff;
          text-shadow: 0 0 8px rgba(224, 170, 255, 0.6);
        }

        /* Primary Submit Button */
        .cyber-btn-primary {
          width: 100%;
          background: linear-gradient(90deg, #4f26e6 0%, #a200ff 50%, #e0115f 100%);
          color: #ffffff;
          font-weight: 900;
          font-size: 1.15rem;
          font-family: 'Orbitron', sans-serif;
          text-transform: uppercase;
          letter-spacing: 2px;
          padding: 13px;
          border: none;
          cursor: pointer;
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
          transition: all 0.25s ease;
          box-shadow: 0 0 20px rgba(162, 0, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
        }

        .cyber-btn-primary:hover:not(:disabled) {
          filter: brightness(1.2);
          box-shadow: 0 0 30px rgba(162, 0, 255, 0.75);
          transform: translateY(-1px);
        }

        .cyber-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cyber-btn-slashes {
          position: absolute;
          bottom: 2px;
          right: 20px;
          width: 18px;
          height: 4px;
          background: rgba(255, 255, 255, 0.4);
          transform: skewX(-30deg);
        }

        /* OR Divider */
        .cyber-divider {
          display: flex;
          align-items: center;
          margin: 20px 0;
          gap: 12px;
        }

        .cyber-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(157, 78, 221, 0.4), transparent);
        }

        .cyber-divider-text {
          font-size: 0.8rem;
          color: #8c8cbd;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 2px;
          font-family: 'Orbitron', sans-serif;
        }

        /* Google Button */
        .cyber-btn-google {
          width: 100%;
          background: rgba(16, 12, 32, 0.7);
          border: 1px solid rgba(0, 210, 255, 0.6);
          color: #ffffff;
          font-weight: 900;
          font-size: 0.95rem;
          font-family: 'Orbitron', sans-serif;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          padding: 13px;
          cursor: pointer;
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
          transition: all 0.25s ease;
          box-shadow: 0 0 10px rgba(0, 210, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .cyber-btn-google:hover:not(:disabled) {
          background: rgba(0, 210, 255, 0.12);
          box-shadow: 0 0 22px rgba(0, 210, 255, 0.55);
          transform: translateY(-1px);
        }

        .cyber-btn-google:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Footer Link */
        .cyber-footer {
          margin-top: 24px;
          text-align: center;
          color: #8c8cbd;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .cyber-footer-link {
          color: #bd52ff;
          text-decoration: none;
          font-weight: 700;
          margin-left: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cyber-footer-link:hover {
          color: #e0aaff;
          text-shadow: 0 0 8px rgba(224, 170, 255, 0.6);
        }
      `}</style>

      {/* Sleek Floating Back Button */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
        <button 
          onClick={() => navigate(-1)} 
          className="cyber-back-btn"
          style={{ 
            background: 'rgba(16, 12, 32, 0.6)', 
            border: '1px solid rgba(157, 78, 221, 0.4)', 
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c77dff',
            boxShadow: '0 0 10px rgba(162, 0, 255, 0.1)'
          }}>
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Brand & Heading Header */}
      <div className="cyber-header">
        <div className="cyber-logo-wrapper">
          <svg viewBox="0 0 100 100" className="cyber-hud-svg">
            {/* Outer rotating dashed circle (Clockwise) */}
            <circle cx="50" cy="50" r="44" stroke="rgba(0, 210, 255, 0.4)" strokeWidth="1.5" fill="none" strokeDasharray="8 6 4 6" className="hud-rotate-cw" />
            {/* Inner rotating dashed circle (Counter-Clockwise) */}
            <circle cx="50" cy="50" r="37" stroke="rgba(162, 0, 255, 0.35)" strokeWidth="1.2" fill="none" strokeDasharray="6 8" className="hud-rotate-ccw" />
            {/* Middle double-lined octagon */}
            <polygon points="50,15 78,31 78,69 50,85 22,69 22,31" stroke="url(#hud-grad-purple)" strokeWidth="2" fill="none" />
            {/* Inner glowing circle */}
            <circle cx="50" cy="50" r="23" fill="rgba(162, 0, 255, 0.08)" stroke="url(#hud-grad-cyan)" strokeWidth="1.5" />
            {/* Central Security Shield & Key Icon */}
            <g transform="translate(38.5, 37.5) scale(0.95)" stroke="#00d2ff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#hud-grad-cyan)" />
              <circle cx="12" cy="9" r="2.2" fill="#bd52ff" stroke="none" />
              <path d="M12 11.5v4.5M10.5 14h3" stroke="#ffffff" strokeWidth="1.2" />
            </g>
            
            <defs>
              <linearGradient id="hud-grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9d4edd" />
                <stop offset="100%" stopColor="#e0aaff" />
              </linearGradient>
              <linearGradient id="hud-grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="100%" stopColor="#bd52ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="cyber-title">
          {getStyledTitle()}
        </h1>
        <div className="cyber-subtitle-container">
          <div className="cyber-subtitle-line left"></div>
          <p className="cyber-subtitle">{isLogin ? t('loginSub') : 'Register to continue'}</p>
          <div className="cyber-subtitle-line right"></div>
        </div>
      </div>

      {/* Cyber Auth Card Container */}
      <div className="cyber-card-wrapper">
        <div className="cyber-card-inner">
          
          {/* Status Message Banners */}
          {errorMsg && (
            <div className="animate-fade-in" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textAlign: 'center'
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
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {successMsg}
            </div>
          )}

          {/* Form Inputs */}
          <div className="cyber-inputs-container">
            {!isLogin && (
              <div className="cyber-input-group">
                <div className="cyber-input-icon-box">
                  <UserIcon size={18} />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('fullName')}
                  className="cyber-input"
                />
              </div>
            )}

            <div className="cyber-input-group">
              <div className="cyber-input-icon-box">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailAddress')}
                className="cyber-input"
              />
            </div>

            <div className="cyber-input-group">
              <div className="cyber-input-icon-box">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                className="cyber-input"
              />
              <button 
                type="button" 
                className="cyber-eye-toggle" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Options Row (Remember me, Age cert, Forgot Password) */}
          <div className="cyber-options-row">
            {isLogin ? (
              <>
                <label className="cyber-checkbox-label">
                  <input 
                    type="checkbox" 
                    className="cyber-checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <a href="#" className="cyber-forgot-link" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }}>
                  Forgot Password?
                </a>
              </>
            ) : (
              <label className="cyber-checkbox-label" style={{ width: '100%' }}>
                <input 
                  type="checkbox" 
                  className="cyber-checkbox" 
                  checked={isAgreed} 
                  onChange={(e) => setIsAgreed(e.target.checked)}
                />
                <span style={{ fontSize: '0.85rem', lineHeight: 1.3 }}>{t('ageCertification')}</span>
              </label>
            )}
          </div>

          {/* Primary Action Button */}
          <button 
            className="cyber-btn-primary" 
            onClick={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? t('processing') : (isLogin ? 'SIGN IN' : 'SIGN UP')}
            <ArrowRight size={18} />
            <div className="cyber-btn-slashes"></div>
          </button>

          {/* OR Divider */}
          <div className="cyber-divider">
            <div className="cyber-divider-line"></div>
            <div className="cyber-divider-text">OR</div>
            <div className="cyber-divider-line"></div>
          </div>

          {/* Google Login Button */}
          <button 
            className="cyber-btn-google" 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" style={{ display: 'block' }}>
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.44-1.09 2.66-2.31 3.48l3.6 2.79c2.1-1.94 3.76-5.8 3.76-8.37z" />
              <path fill="#FBBC05" d="M5.24 10.55c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.39 7.2C.5 9 .5 11 1.39 12.8l3.85-2.25z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.79c-1 .67-2.28 1.07-3.6 1.07-3.34 0-5.86-1.81-6.76-4.51L1.15 17.1C3.13 21.02 7.11 23 12 23z" />
            </svg>
            Sign In with Google
          </button>

          {/* Bottom Footer Switching link */}
          <div className="cyber-footer">
            {isLogin ? (
              <>
                Don't have an account? 
                <span className="cyber-footer-link" onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}>
                  Sign Up
                </span>
              </>
            ) : (
              <>
                Already have an account? 
                <span className="cyber-footer-link" onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}>
                  Sign In
                </span>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;

