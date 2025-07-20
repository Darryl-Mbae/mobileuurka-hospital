// Auth/SignupForm.jsx
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useCallback, useRef, memo } from "react";
import google from '../assets/images/GoogleLogo.webp';

const SignupForm = memo(({
  signupFormData,
  setSignupFormData,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
  onSwitch,
  error,
  setError
}) => {
  // Refs to maintain focus
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // ✅ Optimized input handlers
  const handleNameChange = useCallback((e) => {
    setSignupFormData((prev) => ({ ...prev, name: e.target.value }));
  }, [setSignupFormData]);

  const handleEmailChange = useCallback((e) => {
    setSignupFormData((prev) => ({ ...prev, email: e.target.value }));
  }, [setSignupFormData]);

  const handlePasswordChange = useCallback((e) => {
    setSignupFormData((prev) => ({ ...prev, password: e.target.value }));
  }, [setSignupFormData]);

  const handleTermsChange = useCallback((e) => {
    setSignupFormData((prev) => ({ ...prev, terms: e.target.checked }));
  }, [setSignupFormData]);

  // ✅ Clear error only when user focuses on input
  const handleFocus = useCallback(() => {
    if (error) {
      setError(null);
    }
  }, [error, setError]);

  // ✅ Memoize password toggle
  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, [setShowPassword]);

  return (
    <form onSubmit={onSubmit}>
      <div className="input-group">
        <label htmlFor="name-signup">Name</label>
        <input
          ref={nameRef}
          type="text"
          id="name-signup"
          required
          value={signupFormData.name}
          onChange={handleNameChange}
          onFocus={handleFocus}
          autoComplete="name"
        />
      </div>

      <div className="input-group">
        <label htmlFor="email-signup">Email address</label>
        <input
          ref={emailRef}
          type="email"
          id="email-signup"
          required
          value={signupFormData.email}
          onChange={handleEmailChange}
          onFocus={handleFocus}
          autoComplete="email"
        />
      </div>

      <div className="input-group password-group">
        <label htmlFor="password-signup">Password</label>
        <div className="password-input">
          <input
            ref={passwordRef}
            type={showPassword ? 'text' : 'password'}
            id="password-signup"
            required
            value={signupFormData.password}
            onChange={handlePasswordChange}
            onFocus={handleFocus}
            autoComplete="new-password"
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
            {showPassword ? <FaEyeSlash className="icon" /> : <FaEye className="icon" />}
          </span>
        </div>
      </div>

      <div className="form-actions">
        <label className="remember-me">
          <input
            type="checkbox"
            checked={signupFormData.terms}
            onChange={handleTermsChange}
          />
          <span>Agree to our <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms and Conditions</a></span>
        </label>
      </div>

      {error && <p className="error-message">{error}</p>}

      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? "Loading..." : "Sign Up"}
      </button>

      <button type="button" className="google-btn">
        <img src={google} alt="Google Logo" />
        Sign up with Google
      </button>

      <p className="switch-auth">
        Already have an account? <span onClick={onSwitch}>Login</span>
      </p>
    </form>
  );
});

SignupForm.displayName = 'SignupForm';

export default SignupForm;