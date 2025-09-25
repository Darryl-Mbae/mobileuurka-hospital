import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";

const Fetal = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    gestationWeek: "",
    fhr: "", // Fetal Heart Rate
    femurHeight: "",
    headCircumference: "",
  });

  const token = localStorage.getItem("access_token");

  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [success,setSuccess] =useState(false)
  const [fetchingPatient, setFetchingPatient] = useState(false);

  const clearForm = () => {
    setFormData({
      patientId: selectedPatientId || "",
      editor: currentUser?.name || "",
      date: new Date().toISOString().split("T")[0],
      gestationWeek: "",
      fhr: "",
      femurHeight: "",
      headCircumference:""
    });
    setPatientName("");
  };

  const { showSuccess, successConfig, showSuccessMessage } =
    useSuccessMessage(clearForm);
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
        headers: {
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }), // Add token header if available
        },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${SERVER}/patients/medical/fetalInfo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }), // Add token header if available
        },        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
      }

      const result = await response.json();
      console.log("Fetal info created:", result);
      showSuccessMessage({
        title: "Fetal Completed Successfully!",
        message: `Fetal information recorded for ${
          patientName || "the patient"
        }.`,
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

  // Helper function to assess FHR
  const getFHRAssessment = (fhr, gestationWeek) => {
    if (fhr === 0) return "";
    if (gestationWeek < 20) {
      if (fhr >= 120 && fhr <= 160) return "Normal";
      return "Abnormal - Consult specialist";
    } else {
      if (fhr >= 110 && fhr <= 160) return "Normal";
      if (fhr < 110) return "Bradycardia - Monitor closely";
      if (fhr > 160) return "Tachycardia - Monitor closely";
    }
    return "";
  };

  const fhrAssessment = getFHRAssessment(formData.fhr, formData.gestationWeek);

  return (
    <div className="form">
      {showSuccess && <SuccessMessage {...successConfig} setInternalTab={setInternalTab}/>}

      <form onSubmit={handleSubmit} className="form-container">
        <h2>Fetal Assessment</h2>

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
              <label>Gestation Week *</label>
              <input
                type="number"
                name="gestationWeek"
                value={formData.gestationWeek}
                onChange={handleChange}
                placeholder="e.g., 28"
                min="0"
                max="42"
                required
              />
            </div>
            <div className="form-group">
              <label>Fetal Heart Rate (bpm) *</label>
              <input
                type="number"
                name="fhr"
                value={formData.fhr}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 140"
                required
              />
              {fhrAssessment && (
                <small
                  style={{
                    color: fhrAssessment.includes("Normal")
                      ? "#27ae60"
                      : "#e74c3c",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  Assessment: {fhrAssessment}
                </small>
              )}
            </div>
            <div className="form-group">
              <label>Femur Length (mm)</label>
              <input
                type="number"
                name="femurHeight"
                value={formData.femurHeight}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 35"
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
            <div className="form-group">
              <label>Head Circumference (mm)</label>
              <input
                type="number"
                name="headCircumference"
                value={formData.headCircumference}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 180"
              />
            </div>
          </div>
        </div>

        {/* Reference Values Section */}
        {/* <div className="form-section">
          <h3>Reference Values</h3>
          <div style={{ 
            background: '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: '4px', 
            padding: '15px',
            fontSize: '14px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Fetal Heart Rate (FHR):</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  <li>&lt;20 weeks: 120-160 bpm</li>
                  <li>≥20 weeks: 110-160 bpm</li>
                  <li>&lt;110 bpm: Bradycardia</li>
                  <li>&gt;160 bpm: Tachycardia</li>
                </ul>
              </div>
              <div>
                <strong>Biometric Measurements:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  <li>Femur Length: Varies by GA</li>
                  <li>Head Circumference: Varies by GA</li>
                  <li>Values should correlate with gestational age</li>
                </ul>
              </div>
            </div>
          </div>
        </div> */}

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

export default Fetal;
