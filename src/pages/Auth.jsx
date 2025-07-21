import "../css/Auth.css";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import Overlay from "../components/Overlay";
import logo from "../assets/images/logo.png";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import OTPForm from "../components/OTP";
import ChangePassword from "../components/ChangePassword";

// ✅ Backend API base URL
const SERVER = import.meta.env.VITE_SERVER_URL;

// ✅ Wrapper to inject reCAPTCHA context
export const AuthWrapper = () => (
  <GoogleReCaptchaProvider
    reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
  >
    <Auth />
  </GoogleReCaptchaProvider>
);

// ✅ Main Auth Component
const Auth = () => {
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [isLogin, setIsLogin] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [userHasDefaultPassword, setUserHasDefaultPassword] = useState(false);

  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [signupFormData, setSignupFormData] = useState({
    name: "",
    email: "",
    password: "",
    terms: false,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Memoize setError to prevent unnecessary re-renders
  const memoizedSetError = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);

  // ✅ Memoize setLoginFormData to prevent unnecessary re-renders
  const memoizedSetLoginFormData = useCallback((updater) => {
    setLoginFormData(updater);
  }, []);

  // ✅ Memoize setSignupFormData to prevent unnecessary re-renders
  const memoizedSetSignupFormData = useCallback((updater) => {
    setSignupFormData(updater);
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Clear previous errors

    try {
      // 1. reCAPTCHA verification
      if (!executeRecaptcha)
        throw new Error("reCAPTCHA not ready. Please try again.");
      const token = await executeRecaptcha("login");

      const recaptchaResponse = await fetch(`${SERVER}/recaptcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recaptchaToken: token }),
      });

      if (!recaptchaResponse.ok) {
        throw new Error("Failed to verify reCAPTCHA. Please try again.");
      }

      const recaptchaData = await recaptchaResponse.json();
      if (!recaptchaData.success) {
        throw new Error(
          recaptchaData["error-codes"]?.includes("timeout-or-duplicate")
            ? "reCAPTCHA expired. Please try again."
            : "reCAPTCHA verification failed. Please try again."
        );
      }

      if (recaptchaData.score !== undefined && recaptchaData.score < 0.5) {
        throw new Error("Suspicious activity detected. Please try again.");
      }

      sendOTP(loginFormData.email, loginFormData.password); // Send OTP to the email
    } catch (error) {
      console.error("Login error:", error.message);
      setError(error.message);
      setLoading(false);

      // For network errors or unexpected issues
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        setError("Network error. Please check your connection.");
      }
    } finally {
    }
  };

  // Function to check credentials and determine next step
  const sendOTP = async (email, password) => {
    try {
      const response = await fetch(`${SERVER}/auth/check-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      console.log(data);

      // Check if user has default password BEFORE sending OTP
      if (data.user && data.user.default === true) {
        setUserHasDefaultPassword(true);
        setRequiresPasswordChange(true);
        setLoading(false);
        return;
      }

      // If not default password, proceed to send OTP
      await sendOTPToUser(email, password);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Function to actually send OTP
  const sendOTPToUser = async (email, password) => {
    try {
      const response = await fetch(`${SERVER}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setLoading(false);
      console.log("OTP sent successfully to:", email);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const verifyOTP = async (otpCode) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Verifying OTP:", otpCode);

      // 1. Verify OTP with backend
      const otpResponse = await fetch(`${SERVER}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginFormData.email,
          otp: otpCode,
        }),
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        throw new Error(otpData.error || "Invalid OTP code");
      }

      // 2. Proceed with login after successful OTP verification
      await submitLoginForm(
        loginFormData.email,
        loginFormData.password,
        loginFormData.rememberMe
      );

      // 3. Redirect on successful login
      navigate("/");
    } catch (error) {
      console.error("OTP verification error:", error);
      setError(error.message);

      // Clear OTP fields on error
      // setOtp(Array(6).fill(""));
      // if (inputRefs.current[0]) {
      //   inputRefs.current[0].focus();
      // }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Verify reCAPTCHA for resend (important for security)
      if (!executeRecaptcha) throw new Error("Security verification not ready");
      const token = await executeRecaptcha("resend_otp");

      const recaptchaResponse = await fetch(`${SERVER}/recaptcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recaptchaToken: token }),
      });

      if (!recaptchaResponse.ok) {
        throw new Error("Security verification failed");
      }

      // 2. Request new OTP
      const otpResponse = await fetch(`${SERVER}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginFormData.email }),
      });

      const otpData = await otpResponse.json();
      if (!otpResponse.ok) {
        throw new Error(otpData.error || "Failed to resend OTP");
      }

      // 3. Show success message
      setError("New OTP sent successfully!");
      setTimeout(() => setError(null), 3000);

      // Reset OTP input fields
      setOtp(Array(6).fill(""));
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitLoginForm = async (email, password, rememberMe) => {
    const response = await fetch(`${SERVER}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important for cookies
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.message || "Login failed");
      setLoading(false);
      throw new Error(errorData.message || "Login failed");
    }

    const userData = await response.json();
    console.log("Login successful:", userData);

    // Store token in localStorage as backup
    if (userData.token) {
      localStorage.setItem("access_token", userData.token);
    }

    // Normal login flow - redirect to dashboard
    setLoginFormData({
      email: "",
      password: "",
      rememberMe: false,
    });
    navigate("/");

    return userData;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Add reCAPTCHA verification here if needed
      await submitSignupForm(
        signupFormData.name,
        signupFormData.email,
        signupFormData.password,
        signupFormData.terms
      );
      navigate("/");
    } catch (error) {
      console.error("Signup error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitSignupForm = async (name, email, password, terms) => {
    const response = await fetch(`${SERVER}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, terms }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Signup failed");
    }

    return response.json();
  };

  // Handle password change for users with default passwords
  const handleChangePassword = async (passwordData) => {
    setLoading(true);
    setError(null);

    try {
      // 1. reCAPTCHA verification for password change
      if (!executeRecaptcha) throw new Error("Security verification not ready");
      const token = await executeRecaptcha("change_password");

      const recaptchaResponse = await fetch(`${SERVER}/recaptcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recaptchaToken: token }),
      });

      if (!recaptchaResponse.ok) {
        throw new Error("Security verification failed");
      }

      // 2. Change password
      const response = await fetch(`${SERVER}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: loginFormData.email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      // 3. Password changed successfully - now proceed to OTP
      setRequiresPasswordChange(false);
      setUserHasDefaultPassword(false);

      // Update the login form data with the new password
      const updatedFormData = {
        ...loginFormData,
        password: passwordData.newPassword,
      };
      setLoginFormData(updatedFormData);

      // Now send OTP with the new password
      await sendOTPToUser(updatedFormData.email, passwordData.newPassword);
    } catch (error) {
      console.error("Change password error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Memoize Left component to prevent unnecessary re-renders
  const Left = useMemo(
    () => (
      <div className="left">
        <div className="logo-auth">
          <img src={logo} alt="logo" />
        </div>
        {requiresPasswordChange ? (
          <ChangePassword
            email={loginFormData.email}
            loading={loading}
            onChangePassword={handleChangePassword}
            error={error}
            setError={memoizedSetError}
          />
        ) : otpSent ? (
          <OTPForm
            email={loginFormData.email}
            loading={loading}
            onVerify={verifyOTP}
            onResend={handleResendOtp}
            error={error}
            setError={memoizedSetError}
          />
        ) : (
          <LoginForm
            loginFormData={loginFormData}
            setLoginFormData={memoizedSetLoginFormData}
            showPassword={showLoginPassword}
            setShowPassword={setShowLoginPassword}
            loading={loading}
            onSubmit={handleLoginSubmit}
            setError={memoizedSetError}
            error={error}
            onSwitch={() => setIsLogin(false)}
          />
        )}
      </div>
    ),
    [
      requiresPasswordChange,
      otpSent,
      loginFormData,
      showLoginPassword,
      loading,
      error,
      memoizedSetLoginFormData,
      memoizedSetError,
      handleLoginSubmit,
      handleChangePassword,
      verifyOTP,
      handleResendOtp,
    ]
  );

  // ✅ Memoize Right component to prevent unnecessary re-renders
  const Right = useMemo(
    () => (
      <div className="right">
        <div className="logo-auth">
          <img src={logo} alt="logo" />
        </div>
        <SignupForm
          signupFormData={signupFormData}
          setSignupFormData={memoizedSetSignupFormData}
          showPassword={showSignupPassword}
          setShowPassword={setShowSignupPassword}
          loading={loading}
          setError={memoizedSetError}
          error={error}
          onSubmit={handleSignupSubmit}
          onSwitch={() => setIsLogin(true)}
        />
      </div>
    ),
    [
      signupFormData,
      showSignupPassword,
      loading,
      error,
      memoizedSetSignupFormData,
      memoizedSetError,
      handleSignupSubmit,
    ]
  );

  return isMobile ? (
    <div className="auth">{isLogin ? Left : Right}</div>
  ) : (
    <div className="auth">
      {Right}
      {Left}
      <Overlay isActive={!isLogin} />
    </div>
  );
};

export default AuthWrapper;
