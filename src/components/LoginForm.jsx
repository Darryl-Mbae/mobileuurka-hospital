// Auth/LoginForm.jsx
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useCallback, useRef, memo } from "react";
import google from "../assets/images/GoogleLogo.webp";

const LoginForm = memo(({
  loginFormData,
  setLoginFormData,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
  onSwitch,
  error,
  setError,
}) => {
  // Refs to maintain focus
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // ✅ Optimized input handlers that don't cause re-renders
  const handleEmailChange = useCallback((e) => {
    const value = e.target.value;
    setLoginFormData((prev) => ({ ...prev, email: value }));
  }, [setLoginFormData]);

  const handlePasswordChange = useCallback((e) => {
    const value = e.target.value;
    setLoginFormData((prev) => ({ ...prev, password: value }));
  }, [setLoginFormData]);

  const handleRememberMeChange = useCallback((e) => {
    setLoginFormData((prev) => ({ ...prev, rememberMe: e.target.checked }));
  }, [setLoginFormData]);

  // ✅ Clear error only when user focuses on input (not on every keystroke)
  const handleFocus = useCallback(() => {
    if (error) {
      setError(null);
    }
  }, [error, setError]);

  // ✅ Memoize password toggle to prevent re-renders
  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, [setShowPassword]);

  return (
    <form onSubmit={onSubmit}>
      <div className="input-group">
        <label htmlFor="email-login">Email address</label>
        <input
          ref={emailRef}
          type="email"
          id="email-login"
          required
          value={loginFormData.email}
          onChange={handleEmailChange}
          onFocus={handleFocus}
          autoComplete="email"
        />
      </div>

      <div className="input-group password-group">
        <label htmlFor="password-login">Password</label>
        <div className="password-input">
          <input
            ref={passwordRef}
            type={showPassword ? "text" : "password"}
            id="password-login"
            required
            value={loginFormData.password}
            onChange={handlePasswordChange}
            onFocus={handleFocus}
            autoComplete="current-password"
          />
          <span
            className="password-toggle"
            onClick={togglePassword}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePassword();
              }
            }}
          >
            {showPassword ? (
              <FaEyeSlash className="icon" />
            ) : (
              <FaEye className="icon" />
            )}
          </span>
        </div>
      </div>

      <div className="form-actions">
        <label className="remember-me">
          <input
            type="checkbox"
            checked={loginFormData.rememberMe}
            onChange={handleRememberMeChange}
          />
          <span>Remember me</span>
        </label>
        <a href="/forgot-password">Forgot password?</a>
      </div>

      {error && <p className="error-message">{error}</p>}

      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? "Loading..." : "Sign In"}
      </button>

     

      <p className="switch-auth">
        Don't have an account? <span onClick={onSwitch}>Signup</span>
      </p>
    </form>
  );
});

LoginForm.displayName = 'LoginForm';

export default LoginForm;