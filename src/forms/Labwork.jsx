import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";

const Labwork = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    gestationweek: "",
    diagnosis_id: "",

    // Blood work
    alp: "",
    alt: "",
    ast: "",
    albumin: "",
    bicarbonate: "",
    bilirubin: "",
    calcium: "",
    chloride: "",
    creatinine: "",
    fbs: "",
    fbs1: "",
    fbs2: "",
    glutamyl: "",
    ht: "",
    leukocyte: "",
    haemoglobin: "",
    hba1c: "",
    hba1c_value: "",
    mch: "",
    mchc: "",
    mcv: "",
    platelets: "",
    potassium: "",
    rbc: "",
    randombloodsugar: "",
    sodium: "",
    t3: "",
    t4: "",
    tsh: "",
    uric: "",
    wbc: "",
    bun: "",

    // Urine analysis
    ketones: "",
    urine_color: "",
    urine_glucose: "",
    urine_nitrite: "",
    urine_odor: "",
    urine_protein: "",
    clarity: "",
    sg: "",
    ph: "",

    diagnosis: "",
  });

  const clearForm = () => {
    setFormData({});
  };

  const [grid, setGrid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const [patient, setPatient] = useState(false);
  const { showSuccess, successConfig, showSuccessMessage } =
    useSuccessMessage(clearForm);

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
        setPatient(patient);
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

  // Function to validate required fields
  const validateForm = () => {
    const requiredFields = [
      'patientId', 'date', 'gestationweek', 'alp', 'alt', 'ast', 'albumin',
      'bicarbonate', 'bilirubin', 'calcium', 'chloride', 'creatinine', 'fbs',
      'fbs1', 'fbs2', 'glutamyl', 'ht', 'leukocyte', 'haemoglobin', 'hba1c',
      'hba1c_value', 'mch', 'mchc', 'mcv', 'platelets', 'potassium', 'rbc',
      'randombloodsugar', 'sodium', 't3', 't4', 'tsh', 'uric', 'wbc', 'bun',
      'ketones', 'urine_color', 'urine_glucose', 'urine_nitrite', 'urine_odor',
      'urine_protein', 'clarity', 'sg', 'ph'
    ];

    const emptyFields = [];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        emptyFields.push(field);
      }
    });

    if (emptyFields.length > 0) {
      alert(`Please fill in all required fields. Missing: ${emptyFields.join(', ')}`);
      return false;
    }
    return true;
  };

  // Function to transform numeric fields for submission
  const transformFormDataForSubmission = (data) => {
    const numericFields = [
      'gestationweek', 'alp', 'alt', 'ast', 'albumin', 'bicarbonate', 'bilirubin',
      'calcium', 'chloride', 'creatinine', 'fbs1', 'fbs2', 'glutamyl', 'ht',
      'leukocyte', 'haemoglobin', 'hba1c_value', 'mch', 'mchc', 'mcv', 'platelets',
      'potassium', 'rbc', 'randombloodsugar', 'sodium', 't3', 't4', 'tsh', 'uric',
      'wbc', 'bun', 'sg', 'ph'
    ];

    const transformedData = { ...data };

    numericFields.forEach(field => {
      const value = transformedData[field];
      if (value && value.toString().toLowerCase() !== 'unknown') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          transformedData[field] = numValue;
        }
      }
    });

    return transformedData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields are filled
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    // Transform data before submission
    const transformedData = transformFormDataForSubmission(formData);
    await addData(transformedData);
  };

  const fbsOptions = [
    { value: "", label: "Select FBS Result" },
    { value: "Normal", label: "Normal" },
    { value: "Elevated", label: "Elevated" },
    { value: "Low", label: "Low" },
  ];

  const hba1cOptions = [
    { value: "", label: "Select HbA1c Result" },
    { value: "Normal", label: "Normal (<5.7%)" },
    { value: "Prediabetic", label: "Prediabetic (5.7-6.4%)" },
    { value: "Diabetic", label: "Diabetic (≥6.5%)" },
  ];

  const urineOptions = [
    { value: "", label: "Select" },
    { value: "Negative", label: "Negative" },
    { value: "Trace", label: "Trace" },
    { value: "1+", label: "1+" },
    { value: "2+", label: "2+" },
    { value: "3+", label: "3+" },
    { value: "4+", label: "4+" },
  ];

  const addData = async (formData) => {
    const newFormData = {
      ...formData,
      edema:
        patient?.currentPregnancies[patient?.currentPregnancies.length - 1]
          ?.edema || "Unknown",
      systolic: patient?.triages?.length
        ? patient?.triages[patient?.triages.length - 1]?.systolic
        : "unknown",
      diastolic: patient?.triages?.length
        ? patient?.triages[patient?.triages.length - 1]?.diastolic
        : "unknown",
      amniotic:
        patient?.ultrasounds[patient?.ultrasounds.length - 1]?.amniotic ||
        "unknown",
    };

    submitData({
      data: newFormData,
      user_id: currentUser?.id,
      schema_name: "public",
    });
  };

  const submitData = async (submissionData) => {
    try {
      setLoading(true);
      console.log(submissionData)

      // First API call
      const primaryURL = "https://diagnosis-864851114868.europe-west4.run.app";

      const primaryResponse = await fetch(primaryURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!primaryResponse.ok) {
        const errorText = await primaryResponse.text();
        throw new Error(`Primary submission failed: ${errorText}`);
      }

      const primaryResult = await primaryResponse.json();
      console.log("✅ Primary submission successful:", primaryResult);

      // Show success message
      showSuccessMessage({
        title: "Labwork Completed Successfully!",
        message: `Lab results recorded for ${formData.name || "the patient"}.`,
        showRedoButton: true,
        showScreeningButton: true,
        showNextButton: true,
        setInternalTab: setInternalTab,
        nextButtonText: "Add Another Lab Test",
        nextButtonAction: () => {
          clearForm();
        },
        patientId: formData.patientId,
      });
      // Only show success if we get here
      alert("Form submitted successfully!");

      setLoading(false);
      setFormData({});
    } catch (error) {
      console.error("❌ Critical submission error:", error);
      alert(`Submission failed: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="form">
      {showSuccess && <SuccessMessage {...successConfig} />}

      <form onSubmit={handleSubmit} className="form-container">
        <h2>Laboratory Work</h2>

        <div className="form-grid-group">
          {/* Grid 0 - Basic Info & Key Blood Tests */}
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
                    type="text"
                    name="gestationweek"
                    value={formData.gestationweek}
                    onChange={handleChange}
                    placeholder="e.g 12, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Haemoglobin (g/dL) *</label>
                  <input
                    type="text"
                    name="haemoglobin"
                    value={formData.haemoglobin}
                    onChange={handleChange}
                    placeholder="e.g., 12, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>FBS Result *</label>
                  <div className="select-container">
                    <select
                      name="fbs"
                      value={formData.fbs}
                      onChange={handleChange}
                      required
                    >
                      {fbsOptions.map((option) => (
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
                  <label>Date *</label>
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
                  <label>Random Blood Sugar (mg/dL) *</label>
                  <input
                    type="text"
                    name="randombloodsugar"
                    value={formData.randombloodsugar}
                    onChange={handleChange}
                    placeholder="e.g., 120, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>HbA1c Result *</label>
                  <div className="select-container">
                    <select
                      name="hba1c"
                      value={formData.hba1c}
                      onChange={handleChange}
                      required
                    >
                      {hba1cOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Platelets (×10³/μL) *</label>
                  <input
                    type="text"
                    name="platelets"
                    value={formData.platelets}
                    onChange={handleChange}
                    placeholder="e.g., 250, unknown"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid 1 - Complete Blood Count */}
          {grid === 1 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>WBC (×10³/μL) *</label>
                  <input
                    type="text"
                    name="wbc"
                    value={formData.wbc}
                    onChange={handleChange}
                    placeholder="e.g., 7, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>RBC (×10⁶/μL) *</label>
                  <input
                    type="text"
                    name="rbc"
                    value={formData.rbc}
                    onChange={handleChange}
                    placeholder="e.g., 4.5, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>MCH (pg) *</label>
                  <input
                    type="text"
                    name="mch"
                    value={formData.mch}
                    onChange={handleChange}
                    placeholder="e.g., 30, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>MCHC (g/dL) *</label>
                  <input
                    type="text"
                    name="mchc"
                    value={formData.mchc}
                    onChange={handleChange}
                    placeholder="e.g., 34, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>MCV (fL) *</label>
                  <input
                    type="text"
                    name="mcv"
                    value={formData.mcv}
                    onChange={handleChange}
                    placeholder="e.g., 85, unknown"
                    required
                  />
                </div>
              </div>
              <div className="column-2">
                <div className="form-group">
                  <label>Hematocrit (%) *</label>
                  <input
                    type="text"
                    name="ht"
                    value={formData.ht}
                    onChange={handleChange}
                    placeholder="e.g., 38, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Leukocyte Count *</label>
                  <input
                    type="text"
                    name="leukocyte"
                    value={formData.leukocyte}
                    onChange={handleChange}
                    placeholder="e.g., 6000, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>FBS1 (mg/dL) *</label>
                  <input
                    type="text"
                    name="fbs1"
                    value={formData.fbs1}
                    onChange={handleChange}
                    placeholder="e.g., 90, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>FBS2 (mg/dL) *</label>
                  <input
                    type="text"
                    name="fbs2"
                    value={formData.fbs2}
                    onChange={handleChange}
                    placeholder="e.g., 95, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>HbA1c Value (%) *</label>
                  <input
                    type="text"
                    name="hba1c_value"
                    value={formData.hba1c_value}
                    onChange={handleChange}
                    placeholder="e.g., 5.5, unknown"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid 2 - Chemistry Panel */}
          {grid === 2 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Creatinine (mg/dL) *</label>
                  <input
                    type="text"
                    name="creatinine"
                    value={formData.creatinine}
                    onChange={handleChange}
                    placeholder="e.g., 0.8, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>BUN (mg/dL) *</label>
                  <input
                    type="text"
                    name="bun"
                    value={formData.bun}
                    onChange={handleChange}
                    placeholder="e.g., 15, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Sodium (mEq/L) *</label>
                  <input
                    type="text"
                    name="sodium"
                    value={formData.sodium}
                    onChange={handleChange}
                    placeholder="e.g., 140, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Potassium (mEq/L) *</label>
                  <input
                    type="text"
                    name="potassium"
                    value={formData.potassium}
                    onChange={handleChange}
                    placeholder="e.g., 4.0, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Chloride (mEq/L) *</label>
                  <input
                    type="text"
                    name="chloride"
                    value={formData.chloride}
                    onChange={handleChange}
                    placeholder="e.g., 100, unknown"
                    required
                  />
                </div>
              </div>
              <div className="column-2">
                <div className="form-group">
                  <label>Bicarbonate (mEq/L) *</label>
                  <input
                    type="text"
                    name="bicarbonate"
                    value={formData.bicarbonate}
                    onChange={handleChange}
                    placeholder="e.g., 24, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Calcium (mg/dL) *</label>
                  <input
                    type="text"
                    name="calcium"
                    value={formData.calcium}
                    onChange={handleChange}
                    placeholder="e.g., 9.5, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Uric Acid (mg/dL) *</label>
                  <input
                    type="text"
                    name="uric"
                    value={formData.uric}
                    onChange={handleChange}
                    placeholder="e.g., 4.5, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Albumin (g/dL) *</label>
                  <input
                    type="text"
                    name="albumin"
                    value={formData.albumin}
                    onChange={handleChange}
                    placeholder="e.g., 4.0, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bilirubin (mg/dL) *</label>
                  <input
                    type="text"
                    name="bilirubin"
                    value={formData.bilirubin}
                    onChange={handleChange}
                    placeholder="e.g., 1.0, unknown"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid 3 - Liver Function & Thyroid */}
          {grid === 3 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>ALT (U/L) *</label>
                  <input
                    type="text"
                    name="alt"
                    value={formData.alt}
                    onChange={handleChange}
                    placeholder="e.g., 25, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>AST (U/L) *</label>
                  <input
                    type="text"
                    name="ast"
                    value={formData.ast}
                    onChange={handleChange}
                    placeholder="e.g., 30, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ALP (U/L) *</label>
                  <input
                    type="text"
                    name="alp"
                    value={formData.alp}
                    onChange={handleChange}
                    placeholder="e.g., 100, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>GGT (U/L) *</label>
                  <input
                    type="text"
                    name="glutamyl"
                    value={formData.glutamyl}
                    onChange={handleChange}
                    placeholder="e.g., 20, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>TSH (mIU/L) *</label>
                  <input
                    type="text"
                    name="tsh"
                    value={formData.tsh}
                    onChange={handleChange}
                    placeholder="e.g., 2.5, unknown"
                    required
                  />
                </div>
              </div>
              <div className="column-2">
                <div className="form-group">
                  <label>T3 (ng/dL) *</label>
                  <input
                    type="text"
                    name="t3"
                    value={formData.t3}
                    onChange={handleChange}
                    placeholder="e.g., 120, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>T4 (μg/dL) *</label>
                  <input
                    type="text"
                    name="t4"
                    value={formData.t4}
                    onChange={handleChange}
                    placeholder="e.g., 8.5, unknown"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Grid 4 - Urine Analysis & Diagnosis */}
          {grid === 4 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Urine Color *</label>
                  <input
                    type="text"
                    name="urine_color"
                    value={formData.urine_color}
                    onChange={handleChange}
                    placeholder="e.g., Yellow, Clear, unknown"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Urine Clarity *</label>
                  <input
                    type="text"
                    name="clarity"
                    value={formData.clarity}
                    onChange={handleChange}
                    placeholder="e.g., Clear, Cloudy, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Specific Gravity *</label>
                  <input
                    type="text"
                    name="sg"
                    value={formData.sg}
                    onChange={handleChange}
                    placeholder="e.g., 1.020, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>pH *</label>
                  <input
                    type="text"
                    name="ph"
                    value={formData.ph}
                    onChange={handleChange}
                    placeholder="e.g., 6.0, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Urine Protein *</label>
                  <div className="select-container">
                    <select
                      name="urine_protein"
                      value={formData.urine_protein}
                      onChange={handleChange}
                      required
                    >
                      {urineOptions.map((option) => (
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
                  <label>Urine Odor *</label>
                  <input
                    type="text"
                    name="urine_odor"
                    value={formData.urine_odor}
                    onChange={handleChange}
                    placeholder="e.g., Ammonia-like, unknown"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Urine Glucose *</label>
                  <div className="select-container">
                    <select
                      name="urine_glucose"
                      value={formData.urine_glucose}
                      onChange={handleChange}
                      required
                    >
                      {urineOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ketones *</label>
                  <div className="select-container">
                    <select
                      name="ketones"
                      value={formData.ketones}
                      onChange={handleChange}
                      required
                    >
                      {urineOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Nitrites *</label>
                  <div className="select-container">
                    <select
                      name="urine_nitrite"
                      value={formData.urine_nitrite}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Positive">Positive</option>
                      <option value="Negative">Negative</option>
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
          {grid < 4 && (
            <div className="button" onClick={() => setGrid(grid + 1)}>
              Next
            </div>
          )}
          {grid === 4 && (
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

export default Labwork;
