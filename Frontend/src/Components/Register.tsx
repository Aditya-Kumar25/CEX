import { useState, type FormEvent } from "react";
import bullImg from "../assets/bull.png";
import bearImg from "../assets/bear.jpg";

export  function Register() {
  const [showBear, setShowBear] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("signup", form);
  };

  return (
    <div className="cex-signup">
      {/* grain + grid overlays for a rough, non-smooth feel */}
      <div className="cex-grid" />
      <div className="cex-grain" />
      <div className="cex-scan" />

      <nav className="cex-nav">
        <div className="cex-brand">
          <span className="cex-brand-mark">◆</span>
          <span>VOLTEX</span>
          <span className="cex-brand-tag">/ CEX</span>
        </div>
        <ul className="cex-nav-links">
          <li>Markets</li>
          <li>Trade</li>
          <li>Derivatives</li>
          <li>Earn</li>
          <li>Docs</li>
        </ul>
        <div className="cex-nav-right">
          <span className="cex-pill">EN</span>
          <button className="cex-ghost">Sign in</button>
        </div>
      </nav>

      <main className="cex-main">
        {/* left: beast art */}
        <section className="cex-art">
          <div className="cex-art-frame">
            <img
              src={showBear ? bearImg : bullImg}
              alt={showBear ? "Armored bear" : "Armored bull"}
              className="cex-art-img"
            />
            <div className="cex-art-overlay" />
            <div className="cex-art-corners">
              <span /><span /><span /><span />
            </div>
            <div className="cex-art-meta">
              <div className="cex-art-row">
                <span className="cex-dot" />
                <span>LIVE FEED · {showBear ? "BEARS / SHORT" : "BULLS / LONG"}</span>
              </div>
              <div className="cex-art-stats">
                <div>
                  <span className="cex-stat-k">24H VOL</span>
                  <span className="cex-stat-v">$8.42B</span>
                </div>
                <div>
                  <span className="cex-stat-k">OPEN INT.</span>
                  <span className="cex-stat-v">$1.21B</span>
                </div>
                <div>
                  <span className="cex-stat-k">FUND.</span>
                  <span className="cex-stat-v">+0.0124%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cex-side-toggle">
            <button
              className={!showBear ? "active" : ""}
              onClick={() => setShowBear(false)}
            >
              ▲ BULL
            </button>
            <button
              className={showBear ? "active" : ""}
              onClick={() => setShowBear(true)}
            >
              ▼ BEAR
            </button>
          </div>
        </section>

        {/* right: form */}
        <section className="cex-form-wrap">
          <div className="cex-form-head">
            <span className="cex-kicker">[ 01 / CREATE ACCOUNT ]</span>
            <h1>
              Forge your <br />
              <em>position.</em>
            </h1>
            <p>
              Spin up a Voltex account in seconds. Trade spot, perps and
              options on a venue built for the storm.
            </p>
          </div>

          <form className="cex-form" onSubmit={onSubmit}>
            <label className="cex-field">
              <span>Full name</span>
              <input
                type="text"
                placeholder="Satoshi N."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label className="cex-field">
              <span>Email</span>
              <input
                type="email"
                placeholder="trader@voltex.io"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>

            <label className="cex-field">
              <span>Password</span>
              <input
                type="password"
                placeholder="••••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <small className="cex-hint">
                Min 12 chars · 1 upper · 1 number · 1 symbol
              </small>
            </label>

            <label className="cex-check">
              <input type="checkbox" required />
              <span>
                I accept the <a>Terms</a> and acknowledge the{" "}
                <a>Risk Disclosure</a>.
              </span>
            </label>

            <button type="submit" className="cex-cta">
              <span>CREATE ACCOUNT</span>
              <span className="cex-cta-arrow">→</span>
            </button>

            <div className="cex-divider">
              <span>or continue with</span>
            </div>

            <div className="cex-oauth">
              <button type="button">Google</button>
              <button type="button">Apple</button>
              <button type="button">Wallet</button>
            </div>

            <p className="cex-foot">
              Already trading? <a>Sign in →</a>
            </p>
          </form>
        </section>
      </main>

      <footer className="cex-footer">
        <span>© 2026 VOLTEX LABS</span>
        <span>SOC 2 · ISO 27001</span>
        <span>v1.04.21 — mainnet</span>
      </footer>
    </div>
  );
}