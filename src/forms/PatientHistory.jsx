import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";

const PatientHistory = ({ setInternalTab, selectedPatientId }) => {
  // Initialize form state to match PatientHistory model
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],

    // Most Important - Previous Pregnancy History
    preeclampsiaHistory: "",
    gestationalDiabetesHistory: "",
    gestationalHypertensionHistory: "",
    eclampsiaHistory: "",
    gravida: 0,
    parity: 0,

    // Critical Medical History
    chronicHypertension: "",
    diabetesMelitus: "",
    chronicRenalDisease: "",
    cardiacDisease: "",
    autoimmune: "",

    // Family History - High Risk
    famHistoryPreeclampsia: "",
    famHistoryGestationalHypertension: "",
    famHistoryGestationalDiabetes: "",
    famHistoryCardiacDisease: "",
    famHistoryDiabetes: "null",

    // Obstetric Details
    lastPeriodDate: "",
    estimatedDueDate: "",
    miscarriage: "",
    miscarriageNum: 0,
    csection: "",
    csectionNum: 0,
    stillbirth: "",
    stillbirthNum: 0,
    pph: "",

    // Additional Medical History
    anemia: "",
    thyroid: "",
    hypothyroidism: "",
    liver: "",
    kidney: "",
    rheumatoidArthritis: "",
    pcos: "",
    uterineFibroids: "",
    menorrhagia: "",

    // Additional Family History
    famHistoryAnemia: "",
    famObeseHistory: "",
    famHistoryAutoimmune: "",
    famHistoryHypertension: "",
    famSickleCell: "",
    famThalassemia: "",

    // Other Details
    maleAge: 0,
    malePreeclampsiaPrevHistory: "",
    interval: 0,
    infertility: "",
    ivf: "",
    firstPreeclampsiaHistory: "null",
    prevChildWeight: 0,
    prevGynaSurgery: "",
    prolongedLabour: "",
    prolongedLabourHours: 0,
    contraceptives: "",
    pregnancyHistoryAnemia: "",
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
    if (!patientId || patientId.length < 6) return;
    console.log(patientId);
    setFetchingPatient(true);
    try {
      const response = await fetch(`${SERVER}/patients/${patientId}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const patient = await response.json();
        console.log(patient);
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

  const calculateDueDate = (lmpDate) => {
    if (!lmpDate) return "";

    // Naegele's Rule: LMP + 280 days (40 weeks)
    const lmp = new Date(lmpDate);
    const dueDate = new Date(lmp);
    dueDate.setDate(dueDate.getDate() + 280);

    return dueDate.toISOString().split("T")[0];
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "number" ? parseInt(value) || 0 : value,
      };

      // Auto-calculate due date when last period date changes
      if (name === "lastPeriodDate" && value) {
        updated.estimatedDueDate = calculateDueDate(value);
      }

      return updated;
    });

    // Fetch patient name when patientId changes
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
      const response = await fetch(
        `${SERVER}/patients/medical/patientHistory`,
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
      console.log("PatientHistory created:", result);
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

  return (
    <div className="form">
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Patient History</h2>

        <div className="form-grid-group">
          {/* Grid 0 - Patient Info & Critical Previous Pregnancy History */}
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
                  <label>Previous Preeclampsia History</label>
                  <div className="select-container">
                    <select
                      name="preeclampsiaHistory"
                      value={formData.preeclampsiaHistory}
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
                  <label>Previous Gestational Diabetes</label>
                  <div className="select-container">
                    <select
                      name="gestationalDiabetesHistory"
                      value={formData.gestationalDiabetesHistory}
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
                  <label>Previous Gestational Hypertension</label>
                  <div className="select-container">
                    <select
                      name="gestationalHypertensionHistory"
                      value={formData.gestationalHypertensionHistory}
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
                  <label>Previous Eclampsia History</label>
                  <div className="select-container">
                    <select
                      name="eclampsiaHistory"
                      value={formData.eclampsiaHistory}
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
                  <label>Gravida (Total Pregnancies)</label>
                  <input
                    type="number"
                    name="gravida"
                    value={formData.gravida}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Parity (Live Births)</label>
                  <input
                    type="number"
                    name="parity"
                    value={formData.parity}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid 1 - Critical Medical History */}
          {grid === 1 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Chronic Hypertension</label>
                  <div className="select-container">
                    <select
                      name="chronicHypertension"
                      value={formData.chronicHypertension}
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
                  <label>Diabetes Mellitus</label>
                  <div className="select-container">
                    <select
                      name="diabetesMelitus"
                      value={formData.diabetesMelitus}
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
                  <label>Chronic Renal Disease</label>
                  <div className="select-container">
                    <select
                      name="chronicRenalDisease"
                      value={formData.chronicRenalDisease}
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
                  <label>Cardiac Disease</label>
                  <div className="select-container">
                    <select
                      name="cardiacDisease"
                      value={formData.cardiacDisease}
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
                  <label>Autoimmune Disease</label>
                  <div className="select-container">
                    <select
                      name="autoimmune"
                      value={formData.autoimmune}
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
                  <label>Family History - Preeclampsia</label>
                  <div className="select-container">
                    <select
                      name="famHistoryPreeclampsia"
                      value={formData.famHistoryPreeclampsia}
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
                  <label>Family History - Gestational Hypertension</label>
                  <div className="select-container">
                    <select
                      name="famHistoryGestationalHypertension"
                      value={formData.famHistoryGestationalHypertension}
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
                  <label>Family History - Gestational Diabetes</label>
                  <div className="select-container">
                    <select
                      name="famHistoryGestationalDiabetes"
                      value={formData.famHistoryGestationalDiabetes}
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
                  <label>Family History - Cardiac Disease</label>
                  <div className="select-container">
                    <select
                      name="famHistoryCardiacDisease"
                      value={formData.famHistoryCardiacDisease}
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
                  <label>Family History - Diabetes</label>
                  <div className="select-container">
                    <select
                      name="famHistoryDiabetes"
                      value={formData.famHistoryDiabetes}
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

          {/* Grid 2 - Obstetric Details */}
          {grid === 2 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Last Period Date</label>
                  <input
                    type="date"
                    name="lastPeriodDate"
                    value={formData.lastPeriodDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Due Date</label>
                  <input
                    type="date"
                    name="estimatedDueDate"
                    value={formData.estimatedDueDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>History of Miscarriage</label>
                  <div className="select-container">
                    <select
                      name="miscarriage"
                      value={formData.miscarriage}
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
                  <label>Number of Miscarriages</label>
                  <input
                    type="number"
                    name="miscarriageNum"
                    value={formData.miscarriageNum}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>History of C-Section</label>
                  <div className="select-container">
                    <select
                      name="csection"
                      value={formData.csection}
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
                  <label>Number of C-Sections</label>
                  <input
                    type="number"
                    name="csectionNum"
                    value={formData.csectionNum}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>History of Stillbirth</label>
                  <div className="select-container">
                    <select
                      name="stillbirth"
                      value={formData.stillbirth}
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
                  <label>Number of Stillbirths</label>
                  <input
                    type="number"
                    name="stillbirthNum"
                    value={formData.stillbirthNum}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Postpartum Hemorrhage (PPH)</label>
                  <div className="select-container">
                    <select
                      name="pph"
                      value={formData.pph}
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
                  <label>Previous Child Weight (grams)</label>
                  <input
                    type="number"
                    name="prevChildWeight"
                    value={formData.prevChildWeight}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid 3 - Additional Medical History */}
          {grid === 3 && (
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
                  <label>Thyroid Disease</label>
                  <div className="select-container">
                    <select
                      name="thyroid"
                      value={formData.thyroid}
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
                  <label>Hypothyroidism</label>
                  <div className="select-container">
                    <select
                      name="hypothyroidism"
                      value={formData.hypothyroidism}
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
                  <label>Liver Disease</label>
                  <div className="select-container">
                    <select
                      name="liver"
                      value={formData.liver}
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
                  <label>Kidney Disease</label>
                  <div className="select-container">
                    <select
                      name="kidney"
                      value={formData.kidney}
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
                  <label>Rheumatoid Arthritis</label>
                  <div className="select-container">
                    <select
                      name="rheumatoidArthritis"
                      value={formData.rheumatoidArthritis}
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
                  <label>PCOS</label>
                  <div className="select-container">
                    <select
                      name="pcos"
                      value={formData.pcos}
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
                  <label>Uterine Fibroids</label>
                  <div className="select-container">
                    <select
                      name="uterineFibroids"
                      value={formData.uterineFibroids}
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
                  <label>Menorrhagia (Heavy Periods)</label>
                  <div className="select-container">
                    <select
                      name="menorrhagia"
                      value={formData.menorrhagia}
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
                  <label>Infertility History</label>
                  <div className="select-container">
                    <select
                      name="infertility"
                      value={formData.infertility}
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

          {/* Grid 4 - Additional Family History & Other Details */}
          {grid === 4 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Family History - Anemia</label>
                  <div className="select-container">
                    <select
                      name="famHistoryAnemia"
                      value={formData.famHistoryAnemia}
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
                  <label>Family History - Obesity</label>
                  <div className="select-container">
                    <select
                      name="famObeseHistory"
                      value={formData.famObeseHistory}
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
                  <label>Family History - Hypertension</label>
                  <div className="select-container">
                    <select
                      name="famHistoryHypertension"
                      value={formData.famHistoryHypertension}
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
                  <label>Family History - Sickle Cell</label>
                  <div className="select-container">
                    <select
                      name="famSickleCell"
                      value={formData.famSickleCell}
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
                  <label>IVF Treatment</label>
                  <div className="select-container">
                    <select
                      name="ivf"
                      value={formData.ivf}
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
                  <label>Family History - Thalassemia</label>
                  <div className="select-container">
                    <select
                      name="famThalassemia"
                      value={formData.famThalassemia}
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
                  <label>Family History - Autoimmune</label>
                  <div className="select-container">
                    <select
                      name="famHistoryAutoimmune"
                      value={formData.famHistoryAutoimmune}
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
                  <label>Partner Age</label>
                  <input
                    type="number"
                    name="maleAge"
                    value={formData.maleAge}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Partner Preeclampsia History</label>
                  <div className="select-container">
                    <select
                      name="malePreeclampsiaPrevHistory"
                      value={formData.malePreeclampsiaPrevHistory}
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
                  <label>Interval Between Pregnancies (months)</label>
                  <input
                    type="number"
                    name="interval"
                    value={formData.interval}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid 5 - Final Details */}
          {grid === 5 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Previous Gynecological Surgery</label>
                  <div className="select-container">
                    <select
                      name="prevGynaSurgery"
                      value={formData.prevGynaSurgery}
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
                  <label>Prolonged Labour History</label>
                  <div className="select-container">
                    <select
                      name="prolongedLabour"
                      value={formData.prolongedLabour}
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
                  <label>Prolonged Labour Hours</label>
                  <input
                    type="number"
                    name="prolongedLabourHours"
                    value={formData.prolongedLabourHours}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Contraceptive Use</label>
                  <div className="select-container">
                    <select
                      name="contraceptives"
                      value={formData.contraceptives}
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
                  <label>Pregnancy History - Anemia</label>
                  <div className="select-container">
                    <select
                      name="pregnancyHistoryAnemia"
                      value={formData.pregnancyHistoryAnemia}
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
                  <label>First Preeclampsia History</label>
                  <div className="select-container">
                    <select
                      name="firstPreeclampsiaHistory"
                      valulue={formData.menorrhagia}
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
                  <label>Infertility History</label>
                  <div className="select-container">
                    <select
                      name="infertility"
                      value={formData.infertility}
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
                  <label>Prolonged Labour History</label>
                  <div className="select-container">
                    <select
                      name="prolongedLabour"
                      value={formData.prolongedLabour}
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
                  <label>Contraceptive Use</label>
                  <div className="select-container">
                    <select
                      name="contraceptives"
                      value={formData.contraceptives}
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
                  <label>Previous Gynecological Surgery</label>
                  <div className="select-container">
                    <select
                      name="prevGynaSurgery"
                      value={formData.prevGynaSurgery}
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
          {grid < 5 && (
            <div className="button" onClick={() => setGrid(grid + 1)}>
              Next
            </div>
          )}
          {grid === 5 && (
            <button type="submit" className="button primary" disabled={loading}>
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

export default PatientHistory;
