import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";

const Prescription = ({ setInternalTab, selectedPatientId,patientId }) => {
  const [formData, setFormData] = useState({
    patientId: patientId || selectedPatientId  ||  "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    gestationWeek: "",
    trimester: 1,
    medicine: "",
    prescription: "",
    dosage: "",
    startDate: new Date().toISOString().split("T")[0],
    stopDate: "",
    medicationPurpose: "",
  });

  const token = localStorage.getItem("access_token");

  const [grid, setGrid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [fetchingPatient, setFetchingPatient] = useState(false);

  // Clear form function
  const clearForm = () => {
    setFormData({
      patientId: patientId || selectedPatientId || "",
      editor: currentUser?.name || "",
      date: new Date().toISOString().split("T")[0],
      gestationWeek: 0,
      trimester: 1,
      medicine: "",
      prescription: "",
      dosage: "",
      startDate: new Date().toISOString().split("T")[0],
      stopDate: "",
      medicationPurpose: "",
    });
    setGrid(0);
    setPatientName("");
  };

  // Use success message hook
  const { showSuccess, successConfig, showSuccessMessage } =
    useSuccessMessage(clearForm);

  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      editor: currentUser?.name || "",
      patientId: patientId || selectedPatientId || "",
    }));

    if (selectedPatientId || patientId) {
      fetchPatientName(selectedPatientId || patientId);
    }
  }, [currentUser, selectedPatientId,patientId]);

  // Auto-calculate trimester based on gestation week
  useEffect(() => {
    const week = formData.gestationWeek;
    let trimester = 1;
    if (week >= 14 && week <= 27) trimester = 2;
    else if (week >= 28) trimester = 3;

    setFormData((prev) => ({ ...prev, trimester }));
  }, [formData.gestationWeek]);



  const fetchPatientName = async (patientId) => {
    if (!patientId) return;

    setFetchingPatient(true);
    try {
      const response = await fetch(`${SERVER}/patients/${patientId}`, {
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }), // Add token header if available
          // ...options.headers,
        },
      });

      if (response.ok) {
        const patient = await response.json();
        setPatientName(patient.name || "Unknown Patient");
        setFormData(prev => ({
          ...prev,
          gestationWeek : parseInt(
            patient?.visits[patient.visits.length - 1]?.gestationWeek ?? 0,
            10
          )
        }));
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
      const response = await fetch(`${SERVER}/patients/medical/medication`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }), // Add token header if available
        },        
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
      }

      const result = await response.json();
      console.log("Prescription created:", result);

      // Show success message
      showSuccessMessage({
        title: "Prescription Added Successfully!",
        message: `${formData.medicine} has been prescribed for ${
          patientName || "the patient"
        }.`,
        showRedoButton: true,
        showScreeningButton: true,
        showNextButton: true,
        nextButtonText: "Add Another Prescription",
        nextButtonAction: () => {
          clearForm();
        },
        patientId: formData.patientId,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const medicationPurposes = [
    { value: "", label: "Select Purpose" },
    { value: "Prenatal Vitamins", label: "Prenatal Vitamins" },
    { value: "Iron Deficiency", label: "Iron Deficiency" },
    { value: "Nausea/Vomiting", label: "Nausea/Vomiting" },
    { value: "Hypertension", label: "Hypertension" },
    { value: "Diabetes", label: "Diabetes" },
    { value: "Infection", label: "Infection" },
    { value: "Pain Relief", label: "Pain Relief" },
    { value: "Thyroid", label: "Thyroid" },
    { value: "Other", label: "Other" },
  ];

  const getTrimesterName = (trimester) => {
    switch (trimester) {
      case 1:
        return "First Trimester (0-13 weeks)";
      case 2:
        return "Second Trimester (14-27 weeks)";
      case 3:
        return "Third Trimester (28+ weeks)";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="form">
      {showSuccess && <SuccessMessage {...successConfig} setInternalTab={setInternalTab}/>}
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Prescription</h2>

        <div className="form-grid-group">
          {/* Grid 0 - Basic Info */}
          {grid === 0 && (
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
                  <label>Gestation Week</label>
                  <input
                    type="number"
                    name="gestationWeek"
                    value={formData.gestationWeek}
                    onChange={handleChange}
                    min="0"
                    max="42"
                  />
                </div>
                <div className="form-group">
                  <label>Trimester (Auto-calculated)</label>
                  <input
                    type="text"
                    value={getTrimesterName(formData.trimester)}
                    readOnly
                    className="read-only-field"
                  />
                </div>
                <div className="form-group">
                  <label>Medicine *</label>
                  <input
                    type="text"
                    name="medicine"
                    value={formData.medicine}
                    onChange={handleChange}
                    placeholder="e.g., Paracetamol"
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
                  <label>Medication Purpose *</label>
                  <div className="select-container">
                    <select
                      name="medicationPurpose"
                      value={formData.medicationPurpose}
                      onChange={handleChange}
                      required
                    >
                      {medicationPurposes.map((purpose) => (
                        <option key={purpose.value} value={purpose.value}>
                          {purpose.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Dosage *</label>
                  <input
                    type="text"
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleChange}
                    placeholder="e.g., 500mg twice daily"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid 1 - Prescription Details */}
          {grid === 1 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Stop Date</label>
                  <input
                    type="date"
                    name="stopDate"
                    value={formData.stopDate}
                    onChange={handleChange}
                  />
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    Leave empty for ongoing medication
                  </small>
                </div>
                <div className="form-group">
                  <label>Prescription Instructions</label>
                  <textarea
                    name="prescription"
                    value={formData.prescription}
                    onChange={handleChange}
                    placeholder="Detailed prescription instructions, warnings, and patient guidance..."
                    rows="4"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-navigation">
          {grid !== 0 && (
            <div className="button" onClick={() => setGrid(grid - 1)}>
              Previous
            </div>
          )}
          {grid === 0 && (
            <div className="button" onClick={() => setGrid(grid + 1)}>
              Next
            </div>
          )}
          {grid === 1 && (
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : "Submit"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Prescription;
