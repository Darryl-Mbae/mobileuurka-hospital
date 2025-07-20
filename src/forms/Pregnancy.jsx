import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";

const Pregnancy = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    gestationWeek: 0,
    abnormalDoppler: "",
    anemia: "",
    bleeding: "",
    eclampsia: "",
    edema: "",
    malpresentation: "",
    multifetalGestation: "",
    pprom: "",
    prom: "",
    preeclampsia: "",
    gestationalDiabetes: "",
    gestHypertension: "",
    placentaPrevia: "",
    primiPaternity: "",
    sexOfFetus: "",
    spe: 0,
    malaria: "",
    hookworm: "",
    vitamindDeficiency: "",
    severAnemia: "",
    highHb: "",
  });

  const [grid, setGrid] = useState(0);
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
      const response = await fetch(`${SERVER}/patients/medical/currentPregnancyInfo`, {
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
      console.log("Current pregnancy info created:", result);
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
    { value: "Unknown", label: "Unknown" },
  ];

  const sexOptions = [
    { value: "", label: "Select Sex" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Unknown", label: "Unknown" },
  ];

  const presentationOptions = [
    { value: "", label: "Select Presentation" },
    { value: "Vertex", label: "Vertex (Normal)" },
    { value: "Breech", label: "Breech" },
    { value: "Transverse", label: "Transverse" },
    { value: "Oblique", label: "Oblique" },
  ];

  return (
    <div className="form">
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Current Pregnancy Information</h2>

        <div className="form-grid-group">
          {/* Grid 0 - Basic Info & High-Risk Conditions */}
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
                  <label>Gestation Week *</label>
                  <input
                    type="number"
                    name="gestationWeek"
                    value={formData.gestationWeek}
                    onChange={handleChange}
                    min="0"
                    max="42"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Preeclampsia</label>
                  <div className="select-container">
                    <select
                      name="preeclampsia"
                      value={formData.preeclampsia}
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
                  <label>Gestational Diabetes</label>
                  <div className="select-container">
                    <select
                      name="gestationalDiabetes"
                      value={formData.gestationalDiabetes}
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
                  <label>Gestational Hypertension</label>
                  <div className="select-container">
                    <select
                      name="gestHypertension"
                      value={formData.gestHypertension}
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
                  <label>Eclampsia</label>
                  <div className="select-container">
                    <select
                      name="eclampsia"
                      value={formData.eclampsia}
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
                  <label>Placenta Previa</label>
                  <div className="select-container">
                    <select
                      name="placentaPrevia"
                      value={formData.placentaPrevia}
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
          )}

          {/* Grid 1 - Pregnancy Complications */}
          {grid === 1 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Bleeding</label>
                  <div className="select-container">
                    <select
                      name="bleeding"
                      value={formData.bleeding}
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
                  <label>Edema</label>
                  <div className="select-container">
                    <select
                      name="edema"
                      value={formData.edema}
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
                  <label>PROM (Premature Rupture of Membranes)</label>
                  <div className="select-container">
                    <select
                      name="prom"
                      value={formData.prom}
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
                  <label>PPROM (Preterm PROM)</label>
                  <div className="select-container">
                    <select
                      name="pprom"
                      value={formData.pprom}
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
                  <label>Abnormal Doppler</label>
                  <div className="select-container">
                    <select
                      name="abnormalDoppler"
                      value={formData.abnormalDoppler}
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
              <div className="column-2">
                <div className="form-group">
                  <label>Malpresentation</label>
                  <div className="select-container">
                    <select
                      name="malpresentation"
                      value={formData.malpresentation}
                      onChange={handleChange}
                    >
                      {presentationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Multiple Gestation</label>
                  <div className="select-container">
                    <select
                      name="multifetalGestation"
                      value={formData.multifetalGestation}
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
                  <label>Sex of Fetus</label>
                  <div className="select-container">
                    <select
                      name="sexOfFetus"
                      value={formData.sexOfFetus}
                      onChange={handleChange}
                    >
                      {sexOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Primi Paternity</label>
                  <div className="select-container">
                    <select
                      name="primiPaternity"
                      value={formData.primiPaternity}
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
                  <label>SPE (Systolic Pressure Elevation)</label>
                  <input
                    type="number"
                    name="spe"
                    value={formData.spe}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g., 140"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid 2 - Additional Conditions */}
          {grid === 2 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Anemia</label>
                  <div className="select-container">
                    <select
                      name="anemia"
                      value={formData.anemia}
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
                  <label>Severe Anemia</label>
                  <div className="select-container">
                    <select
                      name="severAnemia"
                      value={formData.severAnemia}
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
                  <label>High Hemoglobin</label>
                  <div className="select-container">
                    <select
                      name="highHb"
                      value={formData.highHb}
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
                  <label>Malaria</label>
                  <div className="select-container">
                    <select
                      name="malaria"
                      value={formData.malaria}
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
                  <label>Hookworm</label>
                  <div className="select-container">
                    <select
                      name="hookworm"
                      value={formData.hookworm}
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
              <div className="column-2">

                <div className="form-group">
                  <label>Vitamin D Deficiency</label>
                  <div className="select-container">
                    <select
                      name="vitamindDeficiency"
                      value={formData.vitamindDeficiency}
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
          )}
        </div>

        <div className="form-navigation">
          {grid !== 0 && (
            <div className="button" onClick={() => setGrid(grid - 1)}>
              Previous
            </div>
          )}
          {grid < 2 && (
            <div className="button" onClick={() => setGrid(grid + 1)}>
              Next
            </div>
          )}
          {grid === 2 && (
            <button
              type="submit"
              className="button primary"
              disabled={loading}
            >
              {loading ? <div className="spinner"></div> : "Submit"}
            </button>
          )}
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

export default Pregnancy;