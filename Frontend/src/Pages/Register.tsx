import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../Context/AuthContext";

import { signupUser } from "../Services/auth";

export default function Register() {
  const { authenticated } = useAuth();

  const navigate = useNavigate();

  const [username, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  if (authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

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
    <div className="min-h-screen bg-[#0C0C0E] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-850 p-6 rounded-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Create Account</h1>
            <p className="text-xs text-zinc-500 font-medium">Join the CEX trading platform</p>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-rose-950/20 border border-rose-900/40 text-[10px] text-rose-400 font-mono break-all">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
                Name / Username
              </label>
              <input
                value={username}
                onChange={(event) => setName(event.target.value)}
                placeholder="yourusername"
                required
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-zinc-700/80 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@domain.com"
                required
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-zinc-700/80 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-zinc-700/80 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-xs font-semibold py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded transition-colors cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="text-center text-xs text-zinc-500 mt-2 font-medium">
            Already registered?{" "}
            <Link
              to="/login"
              className="text-zinc-300 hover:text-zinc-100 transition-colors font-semibold"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}