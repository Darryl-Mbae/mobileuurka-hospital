import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";

const PatientVisit = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    visitNumber: 1,
    gestationWeek: "",
    visitReason: "",
    visitExplanation: "",
    nextVisit: "",
  });

  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [fetchingPatient, setFetchingPatient] = useState(false);

  // Clear form function
  const clearForm = () => {
    setFormData({
      patientId: selectedPatientId || "",
      editor: currentUser?.name || "",
      date: new Date().toISOString().split("T")[0],
      visitNumber: 1,
      gestationWeek: 0,
      visitReason: "",
      visitExplanation: "",
      nextVisit: "",
    });
    setPatientName("");
  };

  // Use success message hook
  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);
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
        setFormData((prev) => ({
          ...prev,
          visitNumber: patient?.visits.length + 1,
        }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${SERVER}/patients/medical/visit`, {
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
      console.log("Visit created:", result);
      
      // Show success message
      showSuccessMessage({
        title: "Visit Recorded Successfully!",
        message: `Visit details recorded for ${formData.name || 'the patient'}.`,
        showScreeningButton: true,
        patientId: formData.patientId
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const visitReasons = [
    { value: "", label: "Select Reason" },
    { value: "Routine Checkup", label: "Routine Checkup" },
    { value: "Follow-up", label: "Follow-up" },
    { value: "Emergency", label: "Emergency" },
    { value: "Consultation", label: "Consultation" },
    { value: "Lab Results", label: "Lab Results" },
    { value: "Ultrasound", label: "Ultrasound" },
    { value: "Complications", label: "Complications" },
    { value: "Other", label: "Other" },
  ];

  return (
    <div className="form">
      {showSuccess && <SuccessMessage {...successConfig} />}
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Patient Visit</h2>

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
              <label>Visit Number</label>
              <input
                type="number"
                name="visitNumber"
                value={formData.visitNumber}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Gestation Week</label>
              <input
                type="number"
                name="gestationWeek"
                value={formData.gestationWeek}
                onChange={handleChange}
                placeholder="e.g 12"
                min="0"
                max="42"
              />
            </div>
            <div className="form-group">
              <label>Visit Reason *</label>
              <div className="select-container">
                <select
                  name="visitReason"
                  value={formData.visitReason}
                  onChange={handleChange}
                  required
                >
                  {visitReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-icon" />
              </div>
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
            <div className="form-group">
              <label>Visit Explanation</label>
              <input
                name="visitExplanation"
                value={formData.visitExplanation}
                onChange={handleChange}
                placeholder="Visit Reason"
              />
            </div>
            <div className="form-group">
              <label>Next Visit Date</label>
              <input
                type="date"
                name="nextVisit"
                value={formData.nextVisit}
                onChange={handleChange}
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

        </div>
      </form>
    </div>
  );
};

export default PatientVisit;
