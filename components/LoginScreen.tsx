
import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (name: string, email: string, avatar: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    // Simulate backend latency
    setTimeout(() => {
      const vault = JSON.parse(localStorage.getItem('cc_user_vault') || '[]');

      if (isSignUp) {
        // Sign Up Logic
        if (!formData.name || !formData.email || !formData.password) {
          setError("All fields are required to secure your vault.");
          setIsProcessing(false);
          return;
        }

        const userExists = vault.find((u: any) => u.email === formData.email);
        if (userExists) {
          setError("An account with this email already exists.");
          setIsProcessing(false);
          return;
        }

        const newUser = {
          ...formData,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
          recordings: []
        };

        vault.push(newUser);
        localStorage.setItem('cc_user_vault', JSON.stringify(vault));
        setSuccess("Vault created! You can now log in.");
        setIsSignUp(false);
        setIsProcessing(false);
      } else {
        // Login Logic
        const user = vault.find((u: any) => u.email === formData.email && u.password === formData.password);
        
        if (user) {
          onLogin(user.name, user.email, user.avatar);
        } else {
          setError("Invalid credentials. Access denied.");
          setIsProcessing(false);
        }
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6">
            <i className="fa-solid fa-bolt-lightning text-white text-3xl"></i>
          </div>
          
          <h1 className="text-2xl font-black tracking-tighter mb-2 text-white">
            CloudCapture <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-slate-500 font-medium mb-8 text-xs uppercase tracking-widest">
            {isSignUp ? "Create Secure Workspace" : "Access your vault"}
          </p>

          <form onSubmit={handleAuth} className="w-full space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm"></i>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm"></i>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Master Password</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-12 py-3.5 text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 animate-in shake duration-300">
                <i className="fa-solid fa-circle-exclamation text-red-500"></i>
                <p className="text-[10px] font-bold text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                <i className="fa-solid fa-circle-check text-green-500"></i>
                <p className="text-[10px] font-bold text-green-400">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-600/20 disabled:opacity-50 mt-4"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <i className={`fa-solid ${isSignUp ? 'fa-user-plus' : 'fa-right-to-bracket'}`}></i>
                  <span>{isSignUp ? "Create Workspace" : "Access Vault"}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 w-full flex flex-col items-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
                setShowPassword(false);
              }}
              className="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors"
            >
              {isSignUp ? "Already have a vault? Log in" : "New here? Create your private vault"}
            </button>
            
            <div className="mt-6 flex items-center gap-2 text-slate-600">
              <i className="fa-solid fa-shield-halved text-[10px]"></i>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">End-to-End Encrypted Node</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
