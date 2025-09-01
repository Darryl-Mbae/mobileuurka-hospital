import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const SERVER = import.meta.env.VITE_SERVER_URL;

  const handleInputChange = useCallback((e) => {
    setEmail(e.target.value);
    if (error) setError(null);
  }, [error]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setSuccess(true);

    } catch (error) {
      console.error("Forgot password error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [email, SERVER]);

  if (success) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-form">
          <div className="logo-auth">
            <img src="/logo.png" alt="logo" />
          </div>
          
          <div className="success-message">
            <h2>Check Your Email</h2>
            <p>
              If an account with that email exists, we've sent a password reset link to:
            </p>
            <p className="email-highlight">{email}</p>
            <p>
              Please check your email and click the link to reset your password.
              The link will expire in 1 hour.
            </p>
            
            <div className="auth-actions">
              <button 
                onClick={() => navigate("/auth")}
                className="login-btn"
              >
                Back to Login
              </button>
              
              <button 
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                className="secondary-btn"
              >
                Send Another Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form">
        <div className="logo-auth">
          <img src="/logo.png" alt="logo" />
        </div>
        
        <h2>Forgot Your Password?</h2>
        <p className="forgot-password-notice">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={handleInputChange}
              autoComplete="email"
              disabled={loading}
              placeholder="Enter your email address"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            type="submit" 
            className="forgot-password-btn" 
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Remember your password? <span onClick={() => navigate("/auth")}>Back to Login</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;