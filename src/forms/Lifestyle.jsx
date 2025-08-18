import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";
import useSuccessMessage from "../hooks/useSuccessMessage";
import SuccessMessage from "../components/SuccessMessage";

const Lifestyle = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    smoking: "",
    diet: "",
    exercise: "",
    alcoholConsumption: "",
    caffeine: "",
    caffeineSources: [],
    otherCaffeine: "",
    caffeineQuantity: "",
    sugarDrink: "",
  });
  
  const clearForm = () => {
    setFormData({});
  }
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);


  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      editor: currentUser?.name || "",
      patientId: selectedPatientId || "",
    }));

    if (selectedPatientId) {
      fetchPatientName(selectedPatientId);
    }
  }, [currentUser, selectedPatientId]);

  const fetchPatientName = async (patientId) => {
    if (!patientId) return;

    setFetchingPatient(true);
    try {
      const response = await fetch(`${SERVER}/patients/${patientId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const patient = await response.json();
        setPatientName(patient.name || "Unknown Patient");
      } else {
        setPatientName("Patient not found");
      }
    } catch (error) {
      console.error("Error fetching patient:", error);
      setPatientName("Error fetching patient");
    } finally {
      setFetchingPatient(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));

    if (name === "patientId" && value) {
      fetchPatientName(value);
    } else if (name === "patientId" && !value) {
      setPatientName("");
    }
  };

  const handleCaffeineSourceChange = (source) => {
    setFormData((prev) => {
      const updatedSources = prev.caffeineSources.includes(source)
        ? prev.caffeineSources.filter((s) => s !== source)
        : [...prev.caffeineSources, source];

      return {
        ...prev,
        caffeineSources: updatedSources,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${SERVER}/patients/medical/patientlifestyle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
      }

      const result = await response.json();
      console.log("Lifestyle record created:", result);
       // Show success message
       showSuccessMessage({
        title: "Lifestyle Completed Successfully!",
        message: `Visit details recorded for ${formData.name || 'the patient'}.`,
        showRedoButton: true,
        showScreeningButton: true,
        showNextButton: true,
        setInternalTab: setInternalTab,
        nextButtonText: "Add Another Triage",
        nextButtonAction: () => {
          clearForm();
        },
        patientId: formData.patientId
      });
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const yesNoOptions = [
    { value: "", label: "Select" },
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
    { value: "Occasionally", label: "Occasionally" },
  ];

  const dietOptions = [
    { value: "", label: "Select Diet Type" },
    { value: "Balanced", label: "Balanced Diet" },
    { value: "Vegetarian", label: "Vegetarian" },
    { value: "Vegan", label: "Vegan" },
    { value: "Low Sodium", label: "Low Sodium" },
    { value: "Diabetic", label: "Diabetic Diet" },
    { value: "High Protein", label: "High Protein" },
    { value: "Other", label: "Other" },
  ];

  const alcoholOptions = [
    { value: "", label: "Select" },
    { value: "Never", label: "Never" },
    { value: "Rarely", label: "Rarely" },
    { value: "Occasionally", label: "Occasionally" },
    { value: "Regularly", label: "Regularly" },
    { value: "Daily", label: "Daily" },
  ];

  const caffeineQuantityOptions = [
    { value: "", label: "Select Quantity" },
    { value: "1-2 cups/day", label: "1-2 cups/day" },
    { value: "3-4 cups/day", label: "3-4 cups/day" },
    { value: "5+ cups/day", label: "5+ cups/day" },
    { value: "Minimal", label: "Minimal" },
  ];

  const caffeineSources = [
    "Coffee",
    "Tea",
    "Soda",
    "Energy Drinks",
    "Chocolate",
    "Supplements",
  ];

  return (
    <div className="form">
      {showSuccess && <SuccessMessage {...successConfig} />}

      <form onSubmit={handleSubmit} className="form-container">
        <h2>Patient Lifestyle Assessment</h2>

        <div className="form-grid-group">
          {/* Grid 1 - Basic Info & Smoking/Diet */}
          <div className="form-grid">
            <div className="column-1">
              <div className="form-group">
                <label>Editor</label>
                <input
                  type="text"
                  value={currentUser?.name || "Loading..."}
                  readOnly
                  className="read-only-field"
                />
              </div>
              <div className="form-group">
                <label>Patient ID *</label>
                <input
                  type="text"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleChange}
                  placeholder="Enter Patient ID"
                  required
                />
              </div>
              <div className="form-group">
                <label>Smoking</label>
                <div className="select-container">
                  <select
                    name="smoking"
                    value={formData.smoking}
                    onChange={handleChange}
                  >
                    {yesNoOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Diet Type</label>
                <div className="select-container">
                  <select
                    name="diet"
                    value={formData.diet}
                    onChange={handleChange}
                  >
                    {dietOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Exercise (hours per week)</label>
                <input
                  type="number"
                  name="exercise"
                  value={formData.exercise}
                  onChange={handleChange}
                  min="0"
                  placeholder="e.g., 3"
                />
              </div>
            </div>
            <div className="column-2">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Patient Name</label>
                <input
                  type="text"
                  value={fetchingPatient ? "Fetching..." : patientName}
                  readOnly
                  className="read-only-field"
                  style={{
                    background:
                      patientName === "Patient not found"
                        ? "#ffe6e6"
                        : "#f8f9fa",
                    color:
                      patientName === "Patient not found"
                        ? "#d32f2f"
                        : "inherit",
                  }}
                />
              </div>
              <div className="form-group">
                <label>Alcohol Consumption</label>
                <div className="select-container">
                  <select
                    name="alcoholConsumption"
                    value={formData.alcoholConsumption}
                    onChange={handleChange}
                  >
                    {alcoholOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Caffeine Consumption</label>
                <div className="select-container">
                  <select
                    name="caffeine"
                    value={formData.caffeine}
                    onChange={handleChange}
                  >
                    {yesNoOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Sugar Drinks</label>
                <div className="select-container">
                  <select
                    name="sugarDrink"
                    value={formData.sugarDrink}
                    onChange={handleChange}
                  >
                    {yesNoOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="select-icon" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Caffeine Details Section */}
        {formData.caffeine === "Yes" && (
          <div className="form-section">
            <h3>Caffeine Details</h3>
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Caffeine Quantity</label>
                  <div className="select-container">
                    <select
                      name="caffeineQuantity"
                      value={formData.caffeineQuantity}
                      onChange={handleChange}
                    >
                      {caffeineQuantityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Other Caffeine Sources</label>
                  <input
                    type="text"
                    name="otherCaffeine"
                    value={formData.otherCaffeine}
                    onChange={handleChange}
                    placeholder="Specify other sources..."
                  />
                </div>
              </div>
              <div className="column-2">
                <div className="form-group">
                  <label>Caffeine Sources</label>
                  <div className="caffeine-grid">
                    {caffeineSources.map((source) => (
                      <div key={source} className="checkbox-item">
                        <input
                          type="checkbox"
                          id={source}
                          checked={formData.caffeineSources.includes(source)}
                          onChange={() => handleCaffeineSourceChange(source)}
                        />
                        <label htmlFor={source}>{source}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-navigation">
          <div className="button" onClick={() => setInternalTab(0)}>
            Cancel
          </div>
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? <div className="spinner"></div> : "Submit"}
          </button>
          {success && (
            <div className="button primary" onClick={() => setInternalTab(0)}>
              Back to Patient
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default Lifestyle;
