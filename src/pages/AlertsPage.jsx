import React, { useEffect } from "react";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";
import { useNavigate } from "react-router-dom";

const AlertsPage = () => {
  const { showSuccess, successConfig, showSuccessMessage } =
  useSuccessMessage();
const navigate = useNavigate();

useEffect(() => {
  showSuccessMessage({
    title: "Feature Unavailable During Pilot",
    message: `Oops! This page isn’t available during the pilot phase. We'd love to hear your thoughts, share your feedback and help shape what comes next!`,
    showScreeningButton: false,
    showFeedbackButton: true,
    closeAction: () => {
      navigate("/Patients");
    },
  });
}, []);

return <SuccessMessage {...successConfig} />;
}

export default AlertsPage