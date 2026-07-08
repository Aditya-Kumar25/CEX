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

  const [name, setName] = useState("");
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
        name,
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
    <form onSubmit={handleSubmit}>
      <h1>Create Account</h1>

      <input
        value={name}
        onChange={(event) =>
          setName(event.target.value)
        }
        placeholder="Name"
        required
      />

      <input
        type="email"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(event) =>
          setPassword(event.target.value)
        }
        placeholder="Password"
        required
      />

      <button
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Creating account..."
          : "Register"}
      </button>

      {error && <p>{error}</p>}

      <p>
        Already registered?{" "}
        <Link to="/login">
          Login
        </Link>
      </p>
    </form>
  );
}