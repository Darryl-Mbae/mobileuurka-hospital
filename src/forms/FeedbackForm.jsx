import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";

const FeedbackForm = ({ setActiveItem }) => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    category: "general",
    priority: "medium",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;

  const categories = [
    "general",
    "bug",
    "feature-request",
    "ui-issue",
    "performance",
  ];

  const priorities = ["low", "medium", "high", "critical"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error when user types
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (!formData.message.trim()) {
      setError("Message is required");
      return false;
    }
    if (formData.message.length < 20) {
      setError("Please provide more details (at least 20 characters)");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${SERVER}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          userId: currentUser.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit feedback");
      }

      setSuccess(true);
      // Reset form
      setFormData({
        title: "",
        message: "",
        category: "general",
        priority: "medium",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError(error.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form">
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Submit Feedback</h2>

        {error && (
          <div
            className="error-message"
            style={{
              color: "#e74c3c",
              background: "#fdf2f2",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #e74c3c",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="success-message"
            style={{
              color: "#27ae60",
              background: "#f2fdf2",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #27ae60",
            }}
          >
            Feedback submitted successfully! We'll review it soon.
          </div>
        )}

        <div className="form-grid">
          <div className="column-1">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief description of your feedback"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <div className="select-container">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat
                        .split("-")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-icon" />
              </div>
            </div>
            <div className="form-group">
              <label>Priority *</label>
              <div className="select-container">
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  {priorities.map((pri) => (
                    <option key={pri} value={pri}>
                      {pri.charAt(0).toUpperCase() + pri.slice(1)}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-icon" />
              </div>
            </div>
          </div>

          <div className="column-2">
          <div className="form-group">
          <label>Detailed Message *</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            style={{
                height:"210px"
            }}
            placeholder="Please describe your feedback in detail..."
            rows={6}
            required
          />
          <small style={{ color: "#666", fontSize: "12px" }}>
            Minimum 20 characters
          </small>
        </div>
          </div>
        </div>



        <div className="form-navigation">
          <div className="button" onClick={() => setActiveItem("Feedback")}>
            Cancel
          </div>
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? <div className="spinner"></div> : "Submit Feedback"}
          </button>
          {success && (
            <div
              className="button primary"
              onClick={() => setActiveItem("Feedback")}
            >
              View My Feedback
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;