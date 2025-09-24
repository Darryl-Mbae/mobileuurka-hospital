import React, { useState, useEffect, useRef } from "react";
import "../css/OTP.css";

const OTPForm = ({
  email,
  loading,
  onVerify,
  onResend,
  error,
  setError,
  countdown = 60,
}) => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [resendDisabled, setResendDisabled] = useState(true);
  const [remainingTime, setRemainingTime] = useState(countdown);
  const inputRefs = useRef([]);

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (resendDisabled && remainingTime > 0) {
      timer = setTimeout(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
    } else if (remainingTime === 0) {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [resendDisabled, remainingTime]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    
    // Allow alphanumeric characters (letters and numbers)
    if (/^[a-zA-Z0-9]*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value.slice(-1).toUpperCase(); // Take last char and convert to uppercase
      setOtp(newOtp);
      setError("");

      // Auto-focus next input if a character was entered
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move focus to previous input on backspace
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    // Filter to only alphanumeric and take first 6 characters
    const filteredData = pasteData.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
    
    if (filteredData.length === 6) {
      const newOtp = filteredData.split("").map(char => char.toUpperCase());
      setOtp(newOtp);
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      onVerify(otpCode);
    } else {
      setError("Please enter a complete 6-character code");
    }
  };

  const handleResendClick = () => {
    onResend();
    setResendDisabled(true);
    setRemainingTime(countdown);
    setOtp(Array(6).fill(""));
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="otp-form">
      <div className="otp-header">
        <h3>Enter Verification Code</h3>
        <p className="otp-instructions">
          We sent a code to <span className="otp-email">{email}</span>
        </p>
      </div>

      <div className="password-container">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="pin-input" key={index} >
            <input
              type="text"
              inputMode="text"
              pattern="[a-zA-Z0-9]*"
              maxLength={1}
              value={otp[index]}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              ref={(el) => (inputRefs.current[index] = el)}
              className={`otp-input ${error ? "error" : ""}`}
              disabled={loading}
              autoCapitalize="characters"
              style={{
                fontSize:"16px"
              }}
            />
          </div>
        ))}
      </div>

      {error && <p className="otp-error">{error}</p>}

      <button
        type="submit"
        className="login-btn"
        disabled={loading || otp.join("").length !== 6}
      >
        {loading ? "Verifying..." : "Verify Code"}
      </button>

      <div className="otp-resend">
        {resendDisabled ? (
          <p className="otp-resend-text">
            Resend code in {remainingTime} seconds
          </p>
        ) : (
          <button
            type="button"
            className="otp-resend-button"
            onClick={handleResendClick}
            disabled={loading}
          >
            Resend Code
          </button>
        )}
      </div>
    </form>
  );
};

export default OTPForm;