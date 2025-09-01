import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const SERVER = import.meta.env.VITE_SERVER_URL;

  // Check if token exists on component mount
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }, [error]);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    // Validation
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);

    } catch (error) {
      console.error("Reset password error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [formData, token, SERVER, navigate]);

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-form">
          <div className="success-message">
            <h2>Password Reset Successful!</h2>
            <p>Your password has been successfully reset.</p>
            <p>You will be redirected to the login page in a few seconds...</p>
            <button 
              onClick={() => navigate("/auth")}
              className="login-btn"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-form">
        <div className="logo-auth">
          <img src="/logo.png" alt="logo" />
        </div>
        
        <h2>Reset Your Password</h2>
        <p className="reset-password-notice">
          Enter your new password below.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group password-group">
            <label htmlFor="new-password">New Password</label>
            <div className="password-input">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="new-password"
                required
                minLength={8}
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
              <span
                className="password-toggle"
                onClick={() => togglePasswordVisibility("new")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    togglePasswordVisibility("new");
                  }
                }}
              >
                {showPasswords.new ? (
                  <FaEyeSlash className="icon" />
                ) : (
                  <FaEye className="icon" />
                )}
              </span>
            </div>
            <small className="password-hint">
              Password must be at least 8 characters long
            </small>
          </div>

          <div className="input-group password-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <div className="password-input">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirm-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
              <span
                className="password-toggle"
                onClick={() => togglePasswordVisibility("confirm")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    togglePasswordVisibility("confirm");
                  }
                }}
              >
                {showPasswords.confirm ? (
                  <FaEyeSlash className="icon" />
                ) : (
                  <FaEye className="icon" />
                )}
              </span>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            type="submit" 
            className="reset-password-btn" 
            disabled={loading || !token}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
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

export default ResetPassword;