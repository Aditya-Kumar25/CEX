import { useState, FormEvent, ChangeEvent } from "react";

import bullImg from "../assets/bull.png";
import bearImg from "../assets/bear.jpg";
// import "./SignupPage.css";

const BRAND = "VOLT";

const SEAM_POINTS = "0,55 12,50 24,60 38,46 50,58 62,48 76,60 88,50 100,56";

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreed: boolean;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreed?: string;
}

interface SignupPageProps {
  onSubmit?: (data: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void> | void;
}

const initialForm: FormState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreed: false,
};

export default function SignupPage({ onSubmit }: SignupPageProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (form.username.trim().length < 3) {
      next.username = "Username needs at least 3 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    if (form.password.length < 8) {
      next.password = "Password needs at least 8 characters.";
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = "Passwords don't match.";
    }
    if (!form.agreed) {
      next.agreed = "Accept the terms to continue.";
    }
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          username: form.username,
          email: form.email,
          password: form.password,
        });
      } else {
        console.log("signup", form);
      }
      setForm(initialForm);
    } catch (err) {
      setErrors({
        email: err instanceof Error ? err.message : "Registration failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <section className="signup-hero">
        <img className="hero-img hero-img--bear" src={bearImg} alt="" aria-hidden="true" />
        <img className="hero-img hero-img--bull" src={bullImg} alt="" aria-hidden="true" />
        <svg className="hero-seam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={SEAM_POINTS} className="hero-seam__line" />
        </svg>
        <div className="hero-overlay" />
        <div className="hero-brand">
          <span className="hero-brand__mark">{BRAND}</span>
          <span className="hero-brand__sub">EXCHANGE</span>
        </div>
        <p className="hero-caption">Bulls rise. Bears fall. Trade both.</p>
      </section>

      <section className="signup-form-panel">
        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <span className="form-eyebrow">{"> NEW_USER_REGISTRATION"}</span>
          <h1 className="form-title">Create your account</h1>
          <p className="form-subtitle">Set up access to start trading.</p>

          <div className="field">
            <label className="field__label" htmlFor="username">
              Username
            </label>
            <div className="field__control">
              <input
                id="username"
                name="username"
                className="field__input"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>
            {errors.username && <span className="field__error">{errors.username}</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="email">
              Email
            </label>
            <div className="field__control">
              <input
                id="email"
                name="email"
                type="email"
                className="field__input"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="field__error">{errors.email}</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">
              Password
            </label>
            <div className="field__control field__control--row">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="field__input"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="field__toggle"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
            {errors.password && <span className="field__error">{errors.password}</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <div className="field__control">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                className="field__input"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && (
              <span className="field__error">{errors.confirmPassword}</span>
            )}
          </div>

          <label className="checkbox">
            <input type="checkbox" name="agreed" checked={form.agreed} onChange={handleChange} />
            <span className="checkbox__box" />
            <span className="checkbox__label">I agree to the Terms of Service</span>
          </label>
          {errors.agreed && <span className="field__error">{errors.agreed}</span>}

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>

          <p className="form-footer">
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </form>
      </section>
    </div>
  );
}