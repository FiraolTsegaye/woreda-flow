import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Shield, Eye, EyeOff, LogIn } from "lucide-react";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
const SESSION_KEY = "woreda-admin-authenticated";

interface AdminGateProps {
  children: React.ReactNode;
}

const AdminGate = ({ children }: AdminGateProps) => {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true"
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (authenticated) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Helmet>
        <title>Admin Login — Woreda-Wait</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="civic-card w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Admin Access
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Enter the admin password to manage queues and view analytics.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter admin password"
              autoFocus
              className="w-full rounded-lg border border-border bg-muted/60 px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium animate-in fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          This area is restricted to Woreda staff only.
        </p>
      </div>
    </div>
  );
};

export default AdminGate;
