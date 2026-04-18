import { useState, useEffect, useCallback } from "react";

// ── Constants ──────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || 'https://my-backend-1-25r0.onrender.com';

const CATEGORIES = [
  { value: "Food",          label: "Food",          emoji: "🍔" },
  { value: "Transport",     label: "Transport",     emoji: "🚗" },
  { value: "Entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "Other",         label: "Other",         emoji: "📦" },
];

const ALL_FILTERS = [{ value: "All", label: "All", emoji: "📋" }, ...CATEGORIES];

function getCategoryMeta(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[3];
}

function fmt(n) {
  return "₹" + Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Design tokens ──────────────────────────────────────────
const C = {
  greenDark:  "#1a4731",
  greenMid:   "#2d6a4f",
  greenMain:  "#3a8a65",
  greenSoft:  "#52b788",
  greenPale:  "#d8f3dc",
  greenFrost: "#f0faf4",
  inkDark:    "#1a2e22",
  inkSoft:    "#4a6155",
  inkFaint:   "#8aab96",
  border:     "#c8e6d0",
  danger:     "#c0392b",
  dangerSoft: "#fdecea",
  dangerBorder:"#f5c6c2",
  pageBg:     "#eef0f2",
  white:      "#ffffff",
};

// ── Shared style helpers ───────────────────────────────────
const inputStyle = (focused) => ({
  padding: "12px 14px",
  border: `1.5px solid ${focused ? C.greenMain : C.border}`,
  borderRadius: 10,
  fontFamily: "inherit",
  fontSize: "0.97rem",
  color: C.inkDark,
  background: C.white,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  boxShadow: focused ? `0 0 0 3px rgba(58,138,101,.13)` : "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
});

const fieldLabelStyle = {
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: C.inkSoft,
};

const primaryBtnStyle = (disabled) => ({
  width: "100%",
  padding: "13px",
  background: disabled ? C.inkFaint : C.greenMain,
  color: C.white,
  border: "none",
  borderRadius: 10,
  fontFamily: "inherit",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: disabled ? "none" : `0 2px 8px rgba(58,138,101,0.28)`,
  transition: "background 0.18s",
  letterSpacing: "0.02em",
});

const ghostBtnStyle = {
  background: "none",
  border: "none",
  color: C.greenMain,
  fontFamily: "inherit",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "underline",
  padding: 0,
};

// ── Reusable Field component ───────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, disabled, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={fieldLabelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        style={inputStyle(focused)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

// ── Auth page shell (shared by Login + Register) ───────────
function AuthShell({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: C.pageBg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* Logo mark */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "2.8rem", marginBottom: 6 }}>🌿</div>
        <h1 style={{
          margin: 0,
          fontSize: "1.8rem",
          fontWeight: 800,
          color: C.greenDark,
          letterSpacing: "-0.02em",
        }}>
          Expense Tracker
        </h1>
        <p style={{ margin: "4px 0 0", color: C.inkFaint, fontSize: "0.88rem" }}>
          Stay on top of where your money goes
        </p>
      </div>

      {/* Form card */}
      <div style={{
        background: C.white,
        borderRadius: 20,
        boxShadow: "0 8px 32px rgba(26,71,49,0.12)",
        padding: "36px 32px",
        width: "min(420px, 100%)",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Error banner ───────────────────────────────────────────
function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: C.dangerSoft,
      border: `1.5px solid ${C.dangerBorder}`,
      color: C.danger,
      borderRadius: 10,
      padding: "11px 14px",
      fontSize: "0.88rem",
      fontWeight: 500,
    }}>
      ⚠️ {msg}
    </div>
  );
}

// ── LOGIN PAGE ─────────────────────────────────────────────
function LoginPage({ onLogin, onGoRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleLogin() {
    if (!username.trim()) return setError("Please enter your username.");
    if (!password)        return setError("Please enter your password.");

    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/API/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      onLogin(data);                      // { id, username, token }
    } catch (err) {
      setError(err.message.includes("Failed to fetch")
        ? "Cannot reach the server. Is it running on port 5000?"
        : err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key === "Enter") handleLogin(); }

  return (
    <AuthShell>
      <h2 style={{ margin: "0 0 24px", fontSize: "1.35rem", fontWeight: 700, color: C.greenDark }}>
        Welcome back
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ErrorBanner msg={error} />

        <Field
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="your username"
          disabled={loading}
          autoFocus
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          disabled={loading}
        />

        {/* Invisible keydown listener on the last input */}
        <div onKeyDown={handleKey} style={{ display: "contents" }} />

        <button
          style={primaryBtnStyle(loading)}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <p style={{ textAlign: "center", margin: 0, color: C.inkSoft, fontSize: "0.88rem" }}>
          Don't have an account?{" "}
          <button style={ghostBtnStyle} onClick={onGoRegister}>
            Create one
          </button>
        </p>
      </div>
    </AuthShell>
  );
}

// ── REGISTER PAGE ──────────────────────────────────────────
function RegisterPage({ onLogin, onGoLogin }) {
  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleRegister() {
    if (!username.trim())       return setError("Please enter a username.");
    if (username.trim().length < 3) return setError("Username must be at least 3 characters.");
    if (!password)              return setError("Please enter a password.");
    if (password.length < 6)   return setError("Password must be at least 6 characters.");
    if (password !== confirm)   return setError("Passwords do not match.");

    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/API/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      onLogin(data);                      // auto-login after register
    } catch (err) {
      setError(err.message.includes("Failed to fetch")
        ? "Cannot reach the server. Is it running on port 5000?"
        : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h2 style={{ margin: "0 0 24px", fontSize: "1.35rem", fontWeight: 700, color: C.greenDark }}>
        Create account
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ErrorBanner msg={error} />

        <Field
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="choose a username"
          disabled={loading}
          autoFocus
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="at least 6 characters"
          disabled={loading}
        />
        <Field
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder="repeat your password"
          disabled={loading}
        />

        <button
          style={primaryBtnStyle(loading)}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>

        <p style={{ textAlign: "center", margin: 0, color: C.inkSoft, fontSize: "0.88rem" }}>
          Already have an account?{" "}
          <button style={ghostBtnStyle} onClick={onGoLogin}>
            Sign in
          </button>
        </p>
      </div>
    </AuthShell>
  );
}

// ── EXPENSE TRACKER ────────────────────────────────────────
function ExpenseTracker({ user, token, onLogout }) {
  const [expenses,         setExpenses]         = useState([]);
  const [name,             setName]             = useState("");
  const [amount,           setAmount]           = useState("");
  const [category,         setCategory]         = useState("Food");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortDesc,         setSortDesc]         = useState(false);
  const [focusedInput,     setFocusedInput]     = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [submitting,       setSubmitting]       = useState(false);
  const [deletingIds,      setDeletingIds]      = useState([]);
  const [fetchError,       setFetchError]       = useState("");
  const [formFlash,        setFormFlash]        = useState({ type: "", msg: "" });

  // Auth header for every request
  const authHeaders = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  };

  function flash(msg, type = "error") {
    setFormFlash({ type, msg });
    setTimeout(() => setFormFlash({ type: "", msg: "" }), 3000);
  }

  // ── Fetch expenses ──
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`${API_BASE}/API/expenses`, { headers: authHeaders });
      if (res.status === 401) { onLogout(); return; }   // token expired
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setExpenses(await res.json());
    } catch (err) {
      setFetchError(err.message.includes("Failed to fetch")
        ? "Cannot reach the server. Is it running on port 5000?"
        : err.message);
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // ── Add expense ──
  async function addExpense() {
    const trimmed = name.trim();
    const parsed  = parseFloat(amount);
    if (!trimmed)                               return flash("Please enter an expense name.");
    if (!amount || isNaN(parsed) || parsed <= 0) return flash("Please enter a valid amount greater than 0.");

    setSubmitting(true);
    try {
      const res  = await fetch(`${API_BASE}/API/expenses`, {
        method: "POST",
        headers: authHeaders,
        body:   JSON.stringify({ name: trimmed, amount: parsed, category }),
      });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add expense.");

      setExpenses(prev => [data, ...prev]);
      setName("");
      setAmount("");
      flash("Expense added!", "success");
    } catch (err) {
      flash(err.message.includes("Failed to fetch") ? "Cannot reach the server." : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete expense ──
  async function deleteExpense(id) {
    setDeletingIds(prev => [...prev, id]);
    try {
      const res  = await fetch(`${API_BASE}/API/expenses/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete.");
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      flash(err.message.includes("Failed to fetch") ? "Cannot reach the server." : err.message);
    } finally {
      setDeletingIds(prev => prev.filter(x => x !== id));
    }
  }

  async function clearAll() {
    if (expenses.length === 0) return;
    if (!window.confirm("Clear all your expenses? This cannot be undone.")) return;
    await Promise.all(expenses.map(e => deleteExpense(e.id)));
  }

  // ── Derived data ──
  const filtered = expenses
    .filter(e => selectedCategory === "All" || e.category === selectedCategory)
    .sort((a, b) => sortDesc ? b.amount - a.amount : 0);

  const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  // ── Render ──
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        minHeight: "100vh",
        background: C.pageBg,
        fontFamily: "'Segoe UI', sans-serif",
        padding: "0 0 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>

        {/* HEADER */}
        <header style={{
          width: "100%",
          background: C.greenDark,
          color: C.white,
          textAlign: "center",
          padding: "32px 24px 52px",
          position: "relative",
          overflow: "hidden",
        }}>
          <span style={{
            position: "absolute", fontSize: 160, opacity: 0.07,
            top: -18, right: -18, lineHeight: 1,
            userSelect: "none", pointerEvents: "none",
          }}>🌿</span>

          <h1 style={{
            fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
            fontWeight: 800, margin: 0,
            letterSpacing: "-0.01em", position: "relative",
          }}>
            Expense Tracker
          </h1>
          <p style={{
            margin: "6px 0 0", fontWeight: 300,
            color: C.greenPale, fontSize: "0.92rem", position: "relative",
          }}>
            Stay on top of where your money goes
          </p>

          {/* User badge + logout */}
          <div style={{
            position: "absolute",
            top: 16, right: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <span style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 999,
              padding: "5px 12px",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: C.greenPale,
            }}>
              👤 {user.username}
            </span>
            <button
              onClick={onLogout}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                padding: "5px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: C.white,
                cursor: "pointer",
                transition: "background 0.18s",
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
              onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            >
              Sign out
            </button>
          </div>
        </header>

        <div style={{ width: "min(580px, calc(100% - 32px))", marginTop: -28, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* INPUT CARD */}
          <div style={{ background: C.white, borderRadius: 18, boxShadow: "0 4px 24px rgba(26,71,49,0.10)", padding: 24 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: C.inkSoft, marginBottom: 12 }}>
              Add Expense
            </div>
            <div style={{ background: C.greenFrost, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 18, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

                <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 2, minWidth: 120 }}>
                  <label style={fieldLabelStyle}>Expense</label>
                  <input
                    style={inputStyle(focusedInput === "name")}
                    type="text" placeholder="e.g., Groceries"
                    value={name} maxLength={60}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                    onKeyDown={e => e.key === "Enter" && addExpense()}
                    disabled={submitting}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: 130, flex: 1, minWidth: 90 }}>
                  <label style={fieldLabelStyle}>Amount (₹)</label>
                  <input
                    style={inputStyle(focusedInput === "amount")}
                    type="number" placeholder="0.00"
                    value={amount} min="0.01" step="0.01"
                    onChange={e => setAmount(e.target.value)}
                    onFocus={() => setFocusedInput("amount")}
                    onBlur={() => setFocusedInput(null)}
                    onKeyDown={e => e.key === "Enter" && addExpense()}
                    disabled={submitting}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: 145, flex: 1, minWidth: 110 }}>
                  <label style={fieldLabelStyle}>Category</label>
                  <select
                    style={{ padding: "12px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontFamily: "inherit", fontSize: "0.97rem", color: C.inkDark, background: C.white, outline: "none", width: "100%", cursor: "pointer" }}
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    disabled={submitting}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  style={{ alignSelf: "flex-end", padding: "12px 22px", background: submitting ? C.inkFaint : C.greenMain, color: C.white, border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: submitting ? "none" : "0 2px 8px rgba(58,138,101,0.28)", transition: "background 0.18s" }}
                  onClick={addExpense}
                  disabled={submitting}
                >
                  {submitting ? "Adding…" : "+ Add"}
                </button>
              </div>

              <div style={{ fontSize: "0.8rem", minHeight: 16, marginTop: 8, color: formFlash.type === "error" ? C.danger : C.greenMid, fontWeight: formFlash.type === "success" ? 600 : 400 }}>
                {formFlash.msg}
              </div>

              <button
                style={{ width: "100%", marginTop: 10, padding: "10px", background: C.dangerSoft, color: C.danger, border: `1.5px solid ${C.dangerBorder}`, borderRadius: 10, fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}
                onClick={clearAll}
                onMouseOver={e => e.currentTarget.style.background = "#f9d9d7"}
                onMouseOut={e => e.currentTarget.style.background = C.dangerSoft}
              >
                🗑 Clear All Expenses
              </button>
            </div>
          </div>

          {/* FILTER */}
          <div style={{ background: C.white, borderRadius: 18, boxShadow: "0 4px 24px rgba(26,71,49,0.10)", padding: 24 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: C.inkSoft, marginBottom: 12 }}>Filter by Category</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ALL_FILTERS.map(f => {
                const active = selectedCategory === f.value;
                return (
                  <button
                    key={f.value}
                    style={{ padding: "8px 16px", borderRadius: 999, border: active ? `2px solid ${C.greenMain}` : `1.5px solid ${C.border}`, background: active ? C.greenMain : C.white, color: active ? C.white : C.greenMid, fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}
                    onClick={() => setSelectedCategory(f.value)}
                  >
                    {f.emoji} {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LIST */}
          <div style={{ background: C.white, borderRadius: 18, boxShadow: "0 4px 24px rgba(26,71,49,0.10)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: C.greenDark, margin: 0 }}>
                Expenses {selectedCategory !== "All" && `· ${selectedCategory}`}
              </p>
              <button
                style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${sortDesc ? C.greenMain : C.border}`, background: sortDesc ? C.greenFrost : C.white, color: sortDesc ? C.greenMid : C.inkFaint, fontFamily: "inherit", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                onClick={() => setSortDesc(p => !p)}
              >
                {sortDesc ? "↓ Highest First" : "↕ Default Order"}
              </button>
            </div>

            {loading && (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.inkFaint }}>
                <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.greenMain}`, borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
                <p style={{ fontSize: "0.9rem" }}>Loading expenses…</p>
              </div>
            )}

            {!loading && fetchError && (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.danger }}>
                <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>⚠️</div>
                <p style={{ fontSize: "0.9rem", marginBottom: 12 }}>{fetchError}</p>
                <button style={{ ...primaryBtnStyle(false), width: "auto", padding: "10px 24px" }} onClick={fetchExpenses}>Retry</button>
              </div>
            )}

            {!loading && !fetchError && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.inkFaint }}>
                <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>🧾</div>
                <p style={{ fontSize: "0.9rem" }}>No expenses yet. Add one above!</p>
              </div>
            )}

            {!loading && !fetchError && filtered.length > 0 && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(e => {
                  const meta       = getCategoryMeta(e.category);
                  const isDeleting = deletingIds.includes(e.id);
                  return (
                    <li key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, background: C.greenFrost, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", opacity: isDeleting ? 0.4 : 1, transition: "opacity 0.2s" }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.greenPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem", flexShrink: 0 }}>
                        {e.emoji || meta.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: C.inkDark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.greenSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{e.category}</div>
                      </div>
                      <div style={{ marginLeft: "auto", fontWeight: 700, fontSize: "1.05rem", color: C.greenDark, whiteSpace: "nowrap" }}>{fmt(e.amount)}</div>
                      <button
                        style={{ background: C.dangerSoft, border: `1.5px solid ${C.dangerBorder}`, color: C.danger, borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
                        onClick={() => deleteExpense(e.id)}
                        disabled={isDeleting}
                        onMouseOver={e => e.currentTarget.style.background = "#f5b7b1"}
                        onMouseOut={e => e.currentTarget.style.background = C.dangerSoft}
                        aria-label="Delete expense"
                      >×</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* TOTAL */}
          <div style={{ background: C.greenDark, borderRadius: 14, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", color: C.white }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.greenPale }}>Total Spent</div>
              <div style={{ fontSize: "0.75rem", color: C.greenSoft, marginTop: 4 }}>
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}{selectedCategory !== "All" && ` · ${selectedCategory}`}
              </div>
            </div>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
              {fmt(total)}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ── ROOT APP ───────────────────────────────────────────────
export default function App() {
  // Restore session from localStorage on first render
  const [user,      setUser]      = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });
  const [token,     setToken]     = useState(() => localStorage.getItem("token") || "");
  const [authPage,  setAuthPage]  = useState("login");   // "login" | "register"

  // Persist session to localStorage whenever it changes
  useEffect(() => {
    if (user && token) {
      localStorage.setItem("user",  JSON.stringify(user));
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user, token]);

  function handleLogin(data) {   // data = { id, username, token }
    setUser({ id: data.id, username: data.username });
    setToken(data.token);
  }

  function handleLogout() {
    setUser(null);
    setToken("");
    setAuthPage("login");
  }

  // ── Routing ──
  if (!user || !token) {
    return authPage === "login"
      ? <LoginPage    onLogin={handleLogin} onGoRegister={() => setAuthPage("register")} />
      : <RegisterPage onLogin={handleLogin} onGoLogin={() => setAuthPage("login")} />;
  }

  return <ExpenseTracker user={user} token={token} onLogout={handleLogout} />;
}