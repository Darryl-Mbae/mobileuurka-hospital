import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import useSuccessMessage from "../hooks/useSuccessMessage";
import SuccessMessage from "../components/SuccessMessage";
import { useScreeningFlow } from "../hooks/useScreeningFlow";

const Triage = ({ setInternalTab, selectedPatientId }) => {
  const { navigateToNextStep, getCurrentStepInfo, getScreeningContext } = useScreeningFlow(setInternalTab);
  const screeningInfo = getCurrentStepInfo('Triage');
  
  const screeningContext = getScreeningContext();
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || screeningContext.patientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    gestationWeek: "",
    height: "",
    heartRate: "",
    diastolic: "",
    systolic: "",
    map: "",
    temperature:"",
    weight: "",
    bmi: "",
  });



  const [grid, setGrid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientGweek, setPatientGweek] = useState("");
  const [success, setSuccess] = useState(false); 
  const [fetchingPatient, setFetchingPatient] = useState(false);

  // Clear form function
  const clearForm = () => {
    setFormData({
      patientId: selectedPatientId || "",
      editor: currentUser?.name || "",
      date: new Date().toISOString().split("T")[0],
      gestationWeek: 0,
      height: 0,
      heartRate: 0,
      diastolic: 0,
      systolic: 0,
      map: 0,
      temperature: 0.0,
      weight: 0,
      bmi: 0,
    });
    setGrid(0);
    setPatientName("");
  };

  // Use success message hook
  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const patientId = selectedPatientId || screeningContext.patientId || "";
    setFormData((prev) => ({
      ...prev,
      editor: currentUser?.name || "",
      patientId: patientId,
    }));

    if (patientId) {
      fetchPatientName(patientId);
    }
  }, [currentUser, selectedPatientId, screeningContext.patientId]);


  // Calculate BMI when height or weight changes
  useEffect(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const heightInMeters = formData.height / 100;
      const bmi =
        Math.round((formData.weight / (heightInMeters * heightInMeters)) * 10) /
        10;
      setFormData((prev) => ({ ...prev, bmi }));
    }
  }, [formData.height, formData.weight]);

  // Calculate MAP when systolic and diastolic change
  useEffect(() => {
    if (formData.systolic > 0 && formData.diastolic > 0) {
      const map = Math.round(
        formData.diastolic + (formData.systolic - formData.diastolic) / 3
      );
      setFormData((prev) => ({ ...prev, map }));
    }
  }, [formData.systolic, formData.diastolic]);

  const fetchPatientName = async (patientId) => {
    if (!patientId) return;

    setFetchingPatient(true);
    try {
      const response = await fetch(`${SERVER}/patients/${patientId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const patient = await response.json();
        setFormData(prev => ({
          ...prev,
          gestationWeek : parseInt(
            patient?.visits[patient.visits.length - 1]?.gestationWeek ?? 0,
            10
          )
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
      [name]:
        type === "number"
          ? name === "temperature"
            ? parseFloat(value) || 0
            : parseInt(value) || 0
          : value,
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
      const response = await fetch(`${SERVER}/patients/medical/triage`, {
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
      console.log("Triage created:", result);
      
      // Show success message with next screening step
      showSuccessMessage({
        title: "Triage Completed Successfully!",
        message: `Vital signs recorded for ${patientName || 'the patient'}.`,
        showNextScreening: true,
        flowId: screeningInfo.flowId,
        currentStepId: screeningInfo.stepId,
        patientId: formData.patientId,
        onNextScreening: navigateToNextStep,
      });
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form">
       {showSuccess && <SuccessMessage {...successConfig} />}
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Patient Triage</h2>

        <div className="form-grid-group">
          {/* Grid 0 - Basic Vitals */}
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
                    placeholder="e.g., 28"
                    min="0"
                    max="42"
                  />
                </div>
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g., 165"
                  />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g., 65"
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
                  <label>Heart Rate (bpm)</label>
                  <input
                    type="number"
                    name="heartRate"
                    value={formData.heartRate}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g., 72"
                  />
                </div>
                <div className="form-group">
                  <label>Temperature (°C)</label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    placeholder="e.g., 36.5"
                  />
                </div>
                <div className="form-group">
                  <label>BMI (calculated)</label>
                  <input
                    type="number"
                    value={formData.bmi}
                    readOnly
                    className="read-only-field"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid 1 - Blood Pressure */}
          {grid === 1 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Systolic (mmHg)</label>
                  <input
                    type="number"
                    name="systolic"
                    value={formData.systolic}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g., 120"
                  />
                </div>
                <div className="form-group">
                  <label>Diastolic (mmHg)</label>
                  <input
                    type="number"
                    name="diastolic"
                    value={formData.diastolic}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g., 80"
                  />
                </div>

                <div className="form-group">
                  <label>MAP (calculated)</label>
                  <input
                    type="number"
                    value={formData.map}
                    readOnly
                    className="read-only-field"
                  />
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    Mean Arterial Pressure = Diastolic + (Systolic - Diastolic)
                    / 3
                  </small>
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

export default Triage;
