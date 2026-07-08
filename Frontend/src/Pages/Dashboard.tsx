import {
  useState,
  type FormEvent,
} from "react";

import { useAuth } from "../Context/Authcontext";

function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] = useState<
    string | null
  >(null);

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    try {
      setError(null);

      await login({
        email,
        password,
      });

      console.log("LOGIN SUCCESS");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        placeholder="Email"
      />

      <input
        type="password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        placeholder="Password"
      />

      <button type="submit">
        Login
      </button>

      {error && <p>{error}</p>}
    </form>
  );
}

export default Login;