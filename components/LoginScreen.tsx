
import React, { useState, useEffect } from 'react';

interface LoginScreenProps {
  onLogin: (name: string, email: string, avatar: string) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a fallback Client ID for demonstration if process.env.GOOGLE_CLIENT_ID is missing
  const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; 

  const handleLoginClick = () => {
    if (!window.google) {
      setError("Google Sign-In library not loaded. Please check your connection.");
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response: any) => {
          if (response.error !== undefined) {
            setIsLoggingIn(false);
            setError(`Authentication failed: ${response.error}`);
            return;
          }

          // Fetch user profile from Google to verify identity and get data
          try {
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            const userData = await userInfoResponse.json();

            // Verify integrity of the received data
            if (userData && userData.email_verified) {
              // Successfully authenticated and authorized
              onLogin(
                userData.name,
                userData.email,
                userData.picture
              );
            } else {
              setError("Email not verified by Google. Please use a verified account.");
              setIsLoggingIn(false);
            }
          } catch (err) {
            setError("Failed to fetch user profile. Please try again.");
            setIsLoggingIn(false);
          }
        },
      });

      client.requestAccessToken();
    } catch (err) {
      setError("An unexpected error occurred during sign-in.");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800 p-12 rounded-[3rem] backdrop-blur-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-8">
            <i className="fa-solid fa-bolt-lightning text-white text-4xl"></i>
          </div>
          
          <h1 className="text-3xl font-black tracking-tighter mb-4 text-white">
            CloudCapture <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-slate-400 font-medium mb-12 text-sm leading-relaxed">
            Connect your workspace to enable automatic Gemini analysis and secure Google Drive synchronization.
          </p>

          <button
            onClick={handleLoginClick}
            disabled={isLoggingIn}
            className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
            )}
            <span className="font-bold">
              {isLoggingIn ? "Waiting for Approval..." : "Continue with Google"}
            </span>
          </button>

          {error && (
            <p className="mt-4 text-xs text-red-400 font-bold bg-red-400/10 py-2 px-4 rounded-xl border border-red-400/20">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center gap-4 text-slate-600">
            <div className="h-px flex-1 bg-slate-800"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Encrypted</span>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>

          <p className="mt-8 text-[11px] text-slate-500 leading-relaxed px-4">
            By continuing, you agree to grant CloudCapture AI permissions to manage files in your Google Drive and record system audio.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
