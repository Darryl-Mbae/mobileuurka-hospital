import { useState, useCallback } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ChangePassword = ({ 
  email, 
  loading, 
  onChangePassword, 
  error, 
  setError 
}) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }, [error, setError]);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    onChangePassword(formData);
  }, [formData, onChangePassword, setError]);

  return (
    <div className="change-password-form">
      <h2 style={{
        marginBottom:"5vh"
      }}>Change Your Password</h2>
      {/* <p className="change-password-notice">
        You are using a default password. Please change it to secure your account.
      </p> */}
      
      <form onSubmit={handleSubmit}>
        <div className="input-group password-group">
          <label htmlFor="current-password">Current Password</label>
          <div className="password-input">
            <input
              type={showPasswords.current ? "text" : "password"}
              id="current-password"
              required
              value={formData.currentPassword}
              onChange={(e) => handleInputChange("currentPassword", e.target.value)}
              autoComplete="current-password"
            />
            <span
              className="password-toggle"
              onClick={() => togglePasswordVisibility("current")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  togglePasswordVisibility("current");
                }
              }}
            >
              {showPasswords.current ? (
                <FaEyeSlash className="icon" />
              ) : (
                <FaEye className="icon" />
              )}
            </span>
          </div>
        </div>

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

        <button type="submit" className="change-password-btn" disabled={loading}>
          {loading ? "Changing Password..." : "Change Password"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;