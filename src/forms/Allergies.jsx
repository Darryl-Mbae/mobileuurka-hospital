import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";
import useSuccessMessage from "../hooks/useSuccessMessage";
import SuccessMessage from "../components/SuccessMessage";

const Allergies = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    allergyType: "",
    allergies: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showSuccess, successConfig, showSuccessMessage } =
    useSuccessMessage(clearForm);
  const [patientName, setPatientName] = useState("");
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;

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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "patientId" && value) {
      fetchPatientName(value);
    } else if (name === "patientId" && !value) {
      setPatientName("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${SERVER}/patients/medical/allergy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
      }

      const result = await response.json();
      console.log("Allergy created:", result);

      // Show success message
      showSuccessMessage({
        title: "Patient Allergy Registered Successfully!",
        message: `Allergies recorded for ${patientName || "the patient"}.`,
        showRedoButton: true,
        showScreeningButton: true,
        showNextButton: true,
        setInternalTab: setInternalTab,
        nextButtonText: "Add Another Triage",
        nextButtonAction: () => {
          clearForm();
        },
        patientId: formData.patientId,
      });
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const allergyTypes = [
    { value: "", label: "Select Allergy Type" },
    { value: "Food", label: "Food Allergy" },
    { value: "Medication", label: "Drug Allergy" },
    { value: "Environment", label: "Environmental Allergy" },
    { value: "Other", label: "Other" },
  ];

  return (
    <div className="form">
      {showSuccess && <SuccessMessage {...successConfig} />}

      <form onSubmit={handleSubmit} className="form-container">
        <h2>Patient Allergies</h2>

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
              <label>Allergy Type *</label>
              <div className="select-container">
                <select
                  name="allergyType"
                  value={formData.allergyType}
                  onChange={handleChange}
                  required
                >
                  {allergyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-icon" />
              </div>
            </div>
            <div className="form-group">
              <label>Allergies *</label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="e.g., Peanuts, Penicillin, Shellfish"
                required
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
                    patientName === "Patient not found" ? "#ffe6e6" : "#f8f9fa",
                  color:
                    patientName === "Patient not found" ? "#d32f2f" : "inherit",
                }}
              />
            </div>
          </div>
        </div>

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

export default Allergies;
