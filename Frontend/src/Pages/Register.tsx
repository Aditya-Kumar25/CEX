import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../Context/AuthContext";
import { signupUser } from "../Services/auth";
import bullImage from "../assets/BullCard.jpg";

export default function Register() {
  const { loginGoogle, authenticated } = useAuth();

  const navigate = useNavigate();

  const [username, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!agreeTerms) {
      setError("You must agree to the Terms & Conditions.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await signupUser({
        username,
        email,
        password,
      });

      navigate("/login");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09080F] flex items-center justify-center p-4 md:p-8 select-none">
      {/* Outer Card Wrapper */}
      <div className="w-full max-w-4xl bg-[#12111A]/90 border border-[#201D2D] rounded-2xl overflow-hidden shadow-2xl shadow-purple-950/20 grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Column - Bull Hero Illustration */}
        <div className="relative hidden md:block overflow-hidden min-h-[500px]">
          {/* Background Image */}
          <img 
            src={bullImage} 
            alt="Bull Market Hero" 
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          {/* Gradients Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12111A] via-[#12111A]/10 to-[#12111A]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#12111A]" />
          
          {/* Brand Logo & Tagline */}
          <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white tracking-wider font-mono bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                ALLINVEGAS
              </span>
              <span className="text-[10px] text-purple-400 font-bold px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-800/30 uppercase tracking-widest">
                CEX
              </span>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white leading-tight tracking-tight max-w-xs">
                Unlock the Bull, Maximize the Momentum
              </h2>
              <p className="text-xs text-purple-300/80 max-w-xs leading-relaxed">
                Open a free account and trade with high-liquidity order books, secure cold storage, and modern execution engines.
              </p>
              {/* Mockup Pagination Indicators */}
              <div className="flex space-x-2 pt-2">
                <div className="w-2 h-1 rounded bg-purple-950 border border-purple-800/30" />
                <div className="w-6 h-1 rounded bg-purple-500 transition-all" />
                <div className="w-2 h-1 rounded bg-purple-950 border border-purple-800/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Register Form */}
        <div className="p-8 flex flex-col justify-center bg-[#12111A]">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Create an account
            </h1>
            <p className="text-xs text-[#8E8A9F]">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs text-rose-400 font-mono break-all">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#8E8A9F]">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(event) => setName(event.target.value)}
                placeholder="yourusername"
                required
                className="w-full bg-[#1C1926] border border-[#2B273D] focus:border-purple-600/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[#5A566A] focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#8E8A9F]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@domain.com"
                required
                className="w-full bg-[#1C1926] border border-[#2B273D] focus:border-purple-600/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[#5A566A] focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#8E8A9F]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#1C1926] border border-[#2B273D] focus:border-purple-600/80 rounded-lg px-3.5 py-2.5 pr-10 text-xs text-white placeholder-[#5A566A] focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8A9F] hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="agree"
                checked={agreeTerms}
                onChange={(event) => setAgreeTerms(event.target.checked)}
                className="rounded border-[#2B273D] bg-[#1C1926] text-purple-600 focus:ring-purple-600/40 w-3.5 h-3.5 transition-colors cursor-pointer"
              />
              <label htmlFor="agree" className="text-xs text-[#8E8A9F] cursor-pointer">
                I agree to the <a href="#" className="text-purple-400 hover:underline">Terms & Conditions</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-xs font-semibold py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg shadow-lg shadow-purple-900/20 transition-all cursor-pointer disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {/* Social Logins Split Line */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#2B273D]"></div>
              <span className="flex-shrink mx-4 text-[10px] text-[#5A566A] uppercase font-bold tracking-wider">
                OR
              </span>
              <div className="flex-grow border-t border-[#2B273D]"></div>
            </div>


            {/* Google Button */}
            <div className="w-full flex justify-center mt-2">
              <GoogleLogin
                theme="filled_black"
                shape="rectangular"
                size="large"
                width="340"
                onSuccess={async (credentialResponse) => {
                  console.log("[Google Auth Register] onSuccess triggered");
                  const cred = credentialResponse.credential || "";
                  console.log(`[Google Auth Register] Token length: ${cred.length}, starting with: ${cred.substring(0, 30)}...`);
                  if (cred) {
                    try {
                      setLoading(true);
                      setError(null);
                      await loginGoogle(cred);
                      console.log("[Google Auth Register] Authentication successful, navigating to dashboard");
                      navigate("/dashboard");
                    } catch (err) {
                      console.error("[Google Auth Register] Backend authentication failed:", err);
                      if (err instanceof Error) {
                        setError(err.message);
                      }
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                onError={() => {
                  console.error("[Google Auth Register] onError triggered");
                  setError("Google authentication failed.");
                }}
              />
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}