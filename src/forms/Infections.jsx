import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";

const Infections = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    hiv: "",
    syphilis: "",
    hepB: "",
    rubella: "",
    hepC: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
      const response = await fetch(`${SERVER}/patients/medical/infection`, {
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
      console.log("Infection record created:", result);
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const testResults = [
    { value: "", label: "Select Result" },
    { value: "Positive", label: "Positive" },
    { value: "Negative", label: "Negative" },
    { value: "Pending", label: "Pending" },
    { value: "Not Tested", label: "Not Tested" },
    { value: "Unknown", label: "Unknown" },
  ];

  return (
    <div className="form">
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Infection Screening</h2>

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
              <label>HIV Test Result</label>
              <div className="select-container">
                <select
                  name="hiv"
                  value={formData.hiv}
                  onChange={handleChange}
                >
                  {testResults.map((result) => (
                    <option key={result.value} value={result.value}>
                      {result.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-icon" />
              </div>
            </div>
            <div className="form-group">
              <label>Syphilis Test Result</label>
              <div className="select-container">
                <select
                  name="syphilis"
                  value={formData.syphilis}
                  onChange={handleChange}
                >
                  {testResults.map((result) => (
                    <option key={result.value} value={result.value}>
                      {result.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-icon" />
              </div>
            </div>
            <div className="form-group">
              <label>Hepatitis B Test Result</label>
              <div className="select-container">
                <select
                  name="hepB"
                  value={formData.hepB}
                  onChange={handleChange}
                >
                  {testResults.map((result) => (
                    <option key={result.value} value={result.value}>
                      {result.label}
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
                  background: patientName === "Patient not found" ? "#ffe6e6" : "#f8f9fa",
                  color: patientName === "Patient not found" ? "#d32f2f" : "inherit"
                }}
              />
            </div>
            <div className="form-group">
              <label>Rubella Test Result</label>
              <div className="select-container">
                <select
                  name="rubella"
                  value={formData.rubella}
                  onChange={handleChange}
                >
                  {testResults.map((result) => (
                    <option key={result.value} value={result.value}>
                      {result.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-icon" />
              </div>
            </div>
            <div className="form-group">
              <label>Hepatitis C Test Result</label>
              <div className="select-container">
                <select
                  name="hepC"
                  value={formData.hepC}
                  onChange={handleChange}
                >
                  {testResults.map((result) => (
                    <option key={result.value} value={result.value}>
                      {result.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes Section */}
        {/* <div className="form-section">
          <div style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '4px', 
            padding: '15px',
            marginTop: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>Important Notes:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
              <li>All test results should be based on recent laboratory reports</li>
              <li>Positive results require immediate follow-up and specialist consultation</li>
              <li>Ensure patient confidentiality and proper counseling for positive results</li>
              <li>Update results when pending tests are completed</li>
            </ul>
          </div>
        </div> */}

        <div className="form-navigation">
          <div className="button" onClick={() => setInternalTab(0)}>
            Cancel
          </div>
          <button
            type="submit"
            className="button primary"
            disabled={loading}
          >
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

export default Infections;