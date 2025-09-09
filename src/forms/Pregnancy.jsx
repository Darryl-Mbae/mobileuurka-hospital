import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";
import useSuccessMessage from "../hooks/useSuccessMessage";
import SuccessMessage from "../components/SuccessMessage";
import cuid from "cuid";
import { alertService } from "../services/alertService.js";
import { setPatients } from "../reducers/Slices/patientsSlice";
import { useSocket } from "../hooks/useSocket";

const Pregnancy = ({ setInternalTab, selectedPatientId }) => {
  const dispatch = useDispatch();
  const { emitMedicalRecordCreated } = useSocket();
  const id = cuid();
  const PREDICTION_API_URL = import.meta.env.VITE_PREDICTION_API_URL;
  const MAXDAYS = import.meta.env.VITE_FORM_EXPIRY_DAYS;
  const [formData, setFormData] = useState({
    patient_id: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    gestationweek: "",
    abnormaldoppler: "",
    anemia: "",
    bleeding: "",
    eclampsia: "",
    edema: "",
    malpresentation: "",
    multifetalgestation: "",
    pprom: "",
    prom: "",
    preeclampsia: "",
    gestationaldiabetes: "",
    gesthypertension: "",
    placentaprevia: "",
    primipaternity: "",
    sex_of_fetus: "",
    spe: "",
    malaria: "",
    hookworm: "",
    vitamind_deficiency: "",
    sever_anemia: "",
    high_hb: "",
  });

  const clearForm = () => {
    setFormData({});
  };

  const [grid, setGrid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patient, setPatient] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const { showSuccess, successConfig, showSuccessMessage } =
    useSuccessMessage(clearForm);
  const [notSet, setNotSet] = useState(null);
  const MS_IN_A_DAY = 24 * 60 * 60 * 1000;

  const outdated = []; // this will store "Labwork", "Triage", or "Ultrasound"

  // Function to refetch patients data
  const refetchPatients = async () => {
    try {
      const { apiGet } = await import("../config/api.js");
      const patientsData = await apiGet("/patients/my");
      dispatch(setPatients(patientsData));
      console.log("Patients data refreshed after pregnancy form submission");
    } catch (error) {
      console.error("Error refreshing patients data:", error);
    }
  };

  // Helper function to check if date is older than MAXDAYS
  const isOlderThanMaxDays = (dateStr) => {
    if (!dateStr) return true; // If no date, treat as outdated
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff > MAXDAYS * MS_IN_A_DAY;
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      editor: currentUser?.name || "",
      patient_id: selectedPatientId || "",
    }));

    if (selectedPatientId) {
      fetchPatientName(selectedPatientId);
    }
  }, [currentUser, selectedPatientId]);

  useEffect(() => {
    if (!patient) return;

    const missing = [];

    if (!patient?.patientHistories || patient.patientHistories.length === 0) {
      missing.push("Patient History");
    }

    if (!patient?.triages || patient.triages.length === 0) {
      missing.push("Triage");
    }
    setNotSet(missing.length ? missing : null);
  }, [patient]);

  useEffect(() => {
    if (!notSet) return;

    const hasMissing = Array.isArray(notSet) && notSet.length > 0;

    console.log(notSet[0]);
    const formatMissingItems = (items) => {
      if (items.length === 1) return items[0];
      return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
    };

    const missingItems = hasMissing ? formatMissingItems(notSet) : "";

    // Dynamic button label
    let nextButtonText = "Add Another Triage";
    if (hasMissing) {
      if (notSet.length > 0) {
        nextButtonText =
          notSet[0] === "Patient History"
            ? "Add Patient History"
            : "Add Triage";
      } else {
        nextButtonText = "Complete Missing Inf";
      }
    }

    showSuccessMessage({
      title: hasMissing ? "Action Needed" : "Success",
      message: hasMissing
        ? `${missingItems} ${
            patientName ? `for ${patientName}` : "for the patient"
          } still needs to be completed.`
        : `Vital signs recorded for ${patientName || "the patient"}.`,
      closeAction: () => {
        setFormData((prev) => ({
          ...prev,
          editor: currentUser?.name,
          patient_id: "",
        }));
        setPatientName("");
      },
      showScreeningButton: true,

      patientId: formData.patient_id,
    });

    setSuccess(true);
  }, [notSet]);

  function changeScreening() {
    if (notSet[0] === "Patient History") {
      setInternalTab(2.2);
    } else if (notSet[0] === "Triage") {
      setInternalTab(2.6);
    } else {
      setInternalTab(0);
    }
  }

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
        setFormData(prev => ({
          ...prev,
          gestationweek : parseInt(
            patient?.visits[patient.visits.length - 1]?.gestationWeek ?? 0,
            10
          )
        }));
        
      }
      else{
        setPatientName("Patient not found");
      }
    } catch (error) {
      console.error("Error fetching patient:", error);
      setPatientName("Error fetching patient");
    } finally {
      setFetchingPatient(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));

    if (name === "patient_id" && value) {
      fetchPatientName(value);
    } else if (name === "patient_id" && !value) {
      setPatientName("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await addData(formData);
  };

  const getLatest = (array, property, defaultValue = "Unknown") => {
    if (!Array.isArray(array) || array.length === 0) return defaultValue;

    const lastItem = array[array.length - 1];
    const value = lastItem?.[property];

    // Auto-detect type from array content properties
    let type = "";
    if (lastItem) {
      // Check for triage-specific properties
      if (
        "bmi" in lastItem ||
        "systolic" in lastItem ||
        "diastolic" in lastItem
      ) {
        type = "triages";
      }
      // Check for ultrasound-specific properties
      else if ("amniotic" in lastItem || "biparietal" in lastItem) {
        type = "ultrasound";
      }
      // Check for labwork-specific properties
      else if ("hemoglobin" in lastItem || "glucose" in lastItem) {
        type = "labworks";
      }
    }

    // Check age only for specific types
    const shouldCheckDate = ["labworks", "triages", "ultrasound"].includes(
      type.toLowerCase()
    );
    const recordDate = lastItem?.date;

    if (shouldCheckDate && recordDate) {
      // Parse the date more reliably
      const recordTime = new Date(recordDate).getTime();
      const currentTime = Date.now();
      const diff = currentTime - recordTime;

      if (diff > MAXDAYS * MS_IN_A_DAY) {
        console.log("Record too old, returning Unknown");
        return "Unknown";
      }
    }

    if (typeof value === "string") {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    if (value !== undefined && value !== null) {
      return value;
    }

    return defaultValue;
  };

  // Usage example:
  // bmi: getLatest(patient?.triages, "bmi", "Unknown", "triages")

  const addData = async (formData) => {
    const newFormData = {
      ...formData,

      // ─── Triage Data ───────────────────────────────────────────
      bmi: getLatest(patient?.triages, "bmi", "Unknown"),
      systolic: getLatest(patient?.triages, "systolic", "Unknown"),
      diastolic: getLatest(patient?.triages, "diastolic", "Unknown"),
      MAP: getLatest(patient?.triages, "map", "Unknown"),
      amniotic: getLatest(patient?.ultrasounds, "amniotic", "Unknown"),

      // ─── Medical History ───────────────────────────────────────
      GESTATIONALDIABETESHISTORY: getLatest(
        patient?.patientHistories,
        "gestationalDiabetesHistory",
        "Unknown"
      ),
      FAMHISTORYGESTATIONALDIABETES: getLatest(
        patient?.patientHistories,
        "famHistoryGestationalDiabetes",
        "Unknown"
      ),
      FAMHISTORYDIABETES: getLatest(
        patient?.patientHistories,
        "famHistoryDiabetes",
        "Unknown"
      ),
      firstpreeclampsiahistory: getLatest(
        patient?.patientHistories,
        "firstPreeclampsiaHistory",
        "Unknown"
      ),
      FAMOBESEHISTORY: "Unknown", // Not in schema
      DIABETESMELITUS: getLatest(
        patient?.patientHistories,
        "diabetesMelitus",
        "Unknown"
      ),
      PREVCHILDWEIGHT: getLatest(
        patient?.patientHistories,
        "prevChildWeight",
        "Unknown"
      ),
      ANEMIAHISTORY: getLatest(patient?.patientHistories, "anemia", "Unknown"),
      MISCARRIAGE: getLatest(
        patient?.patientHistories,
        "miscarriage",
        "Unknown"
      ),
      MISCARRIAGENUM: getLatest(
        patient?.patientHistories,
        "miscarriageNum",
        "Unknown"
      ),
      FAMANEMIAHISTORY: getLatest(
        patient?.patientHistories,
        "famHistoryAnemia",
        "Unknown"
      ),
      FAM_SICKLE_CELL_HISTORY: getLatest(
        patient?.patientHistories,
        "famSickleCell",
        "Unknown"
      ),
      FAM_THALASSEMIA_HISTORY: getLatest(
        patient?.patientHistories,
        "famThalassemia",
        "Unknown"
      ),

      // ─── Lifestyle ─────────────────────────────────────────────
      DIET: getLatest(patient?.lifestyles, "diet", "Balanced"),
      EXERCISE: getLatest(patient?.lifestyles, "excercise", "Unknown"),

      // ─── Gynecological History ────────────────────────────────
      MENORRHAGIA: getLatest(
        patient?.patientHistories,
        "menorrhagia",
        "Unknown"
      ),
      PREG_HIST_ANEMIA: getLatest(
        patient?.patientHistories,
        "pregnancyHistoryAnemia",
        "Unknown"
      ),
      PREGNANCYHISTORYANEMIA: getLatest(
        patient?.patientHistories,
        "pregnancyHistoryAnemia",
        "Unknown"
      ),
      PARITY: getLatest(patient?.patientHistories, "parity", "Unknown"),
      RACE: patient?.race || "Unknown",
      INTERVAL: getLatest(patient?.patientHistories, "interval", "Unknown"),
      IVF: getLatest(patient?.patientHistories, "ivf", "Unknown"),
      CONTRACEPETIVES: getLatest(
        patient?.patientHistories,
        "contraceptives",
        "Unknown"
      ),
      PCOS: getLatest(patient?.patientHistories, "pcos", "Unknown"),
      INFERTILITY: getLatest(
        patient?.patientHistories,
        "infertility",
        "Unknown"
      ),

      // ─── Cardiovascular ────────────────────────────────────────
      FAMHYPERTENSIONHISTORY: getLatest(
        patient?.patientHistories,
        "famHistoryHypertension",
        "Unknown"
      ),
      HYPERTENSIONHISTORY: getLatest(
        patient?.patientHistories,
        "chronicHypertension",
        "Unknown"
      ),
      GESTATIONALHYPERTENSIONHISTORY: getLatest(
        patient?.patientHistories,
        "gestationalHypertensionHistory",
        "Unknown"
      ),
      famhistorygestationalhypertension: getLatest(
        patient?.patientHistories,
        "famHistoryGestationalHypertension",
        "Unknown"
      ),
      CARDIACDISEASE: getLatest(
        patient?.patientHistories,
        "cardiacDisease",
        "Unknown"
      ),

      // ─── Pregnancy Complications ───────────────────────────────
      FAMHISTORYPREECLAMPSIA: getLatest(
        patient?.patientHistories,
        "famHistoryPreeclampsia",
        "Unknown"
      ),
      PREECLAMPSIAHISTORY: getLatest(
        patient?.patientHistories,
        "preeclampsiaHistory",
        "Unknown"
      ),
      ECLAMPSIAHISTORY: getLatest(
        patient?.patientHistories,
        "eclampsiaHistory",
        "Unknown"
      ),
      PPH: getLatest(patient?.patientHistories, "pph", "Unknown"),
      STILLBIRTH: getLatest(patient?.patientHistories, "stillbirth", "Unknown"),

      // ─── Other Medical Conditions ──────────────────────────────
      AUTOIMMUNE: getLatest(patient?.patientHistories, "autoimmune", "Unknown"),
      FAMHISTORYAUTOIMMUNE: getLatest(
        patient?.patientHistories,
        "famHistoryAutoimmune",
        "Unknown"
      ), // Not in schema
      LIVER: getLatest(patient?.patientHistories, "liver", "Unknown"),
      CHRONICRENALDISEASE: getLatest(
        patient?.patientHistories,
        "chronicRenalDisease",
        "Unknown"
      ),
      RHEUMATOID_ARTHRITIS: getLatest(
        patient?.patientHistories,
        "rheumatoidArthritis",
        "Unknown"
      ),
      THYROID: getLatest(patient?.patientHistories, "thyroid", "Unknown"),

      BLOODGROUP: patient?.bloodgroup || "Unknown",
      RH: patient?.rh || "Unknown",
      // ─── Lab Results ───────────────────────────────────────────

      HAEMOGLOBIN: getLatest(patient?.labworks, "haemoglobin", "Unknown"),
      URINE_GLUCOSE: getLatest(patient?.labworks, "urine_glucose", "Unkown"),
      URINE_PROTEIN: getLatest(patient?.labworks, "urine_protein", "Unknown"),

      // ─── Obstetric History ─────────────────────────────────────
      PREVGYNASURGERY: getLatest(
        patient?.patientHistories,
        "prevGynaSurgery",
        "Unknown"
      ),
      CHRONICHYPERTENSION: getLatest(
        patient?.patientHistories,
        "chronicHypertension",
        "Unknown"
      ),

      PROLONGEDLABOUR: getLatest(
        patient?.patientHistories,
        "prolongedLabour",
        "Unknown"
      ),
      CSECTION: getLatest(patient?.patientHistories, "csection", "Unknown"),
      CSECTIONNUM: getLatest(
        patient?.patientHistories,
        "csectionNum",
        "Unknown"
      ),

      // ─── Demographics ──────────────────────────────────────────
      AGE: calculateAge(patient?.dob) || "Unknown",
      MALE_AGE: getLatest(patient?.patientHistories, "maleAge", "Unknown"),
      KIDNEY: getLatest(patient?.patientHistories, "kidney", "Unknown"),
    };
    // Get latest dates
    const labworkDate = patient?.labworks?.[patient.labworks.length - 1]?.date;
    const triageDate = patient?.triages?.[patient.triages.length - 1]?.date;
    const ultrasoundDate =
      patient?.ultrasounds?.[patient.ultrasounds.length - 1]?.date;

    // Compare and collect
    if (isOlderThanMaxDays(labworkDate)) outdated.push("Labwork");
    if (isOlderThanMaxDays(triageDate)) outdated.push("Triage");
    if (isOlderThanMaxDays(ultrasoundDate)) outdated.push("Ultrasound");

    if (outdated.length > 1) {
      showSuccessMessage({
        title: "Action Needed",
        message: `Recent ${outdated.join(
          ", "
        )} records are required for AI risk score calculation, but they are older than ${MAXDAYS} days.\n\nProceeding will mark these values as 'unknown' to prevent the use of outdated clinical data.\n\nNote: This may affect the accuracy of the AI-generated score.`,

        showProceedButton: true,
        showScreeningButton: false,
        proceedButtonText: "Proceed",
        closeAction: () => {
          setLoading(false);
        },
        proceedButtonAction: () => {
          submitData({
            data: newFormData,
            user_id: currentUser?.id,
            schema_name: "public",
          });
          console.log(newFormData);
        },
        patientId: formData.patient_id,
      });
    } else {
      submitData({
        data: newFormData,
        user_id: currentUser?.id,
        schema_name: "public",
      });
    }
  };

  const submitData = async (submissionData) => {
    try {
      setLoading(true);

      // First API call
      const primaryURL = PREDICTION_API_URL;
      const primaryResponse = await fetch(primaryURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submissionData),
      });

      if (!primaryResponse.ok) {
        const errorText = await primaryResponse.text();
        throw new Error(`Primary submission failed: ${errorText}`);
      }

      const primaryResult = await primaryResponse.json();
      console.log("✅ Primary submission successful:", primaryResult);
      if (primaryResult.prediction) {
        let alert = "";
        let flag = false;

        if (primaryResult?.prediction == "High") {
          flag = true;
          alert = "Patient has been flagged as a High risk patient";
        }

        if (primaryResult?.prediction == "Low") {
          flag = true;
          alert = "Patient has been flagged as a Low risk patient";
        }
        if (primaryResult?.prediction == "Mid") {
          flag = true;
          alert = "Patient has been flagged as a Mid risk patient";
        }

        const alertData = {
          alert: alert,
          flagged: flag,
        };

        alertService.createAlert(formData.patient_id, alertData);
      }

      try {
        const secondaryResponse = await fetch(
          "https://diagnosis-factors-864851114868.europe-west4.run.app",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              data: submissionData.data,
              user_id: currentUser?.id,
              schema_name: "public",
            }),
          }
        );

        if (!secondaryResponse?.ok) {
          const errorText = await secondaryResponse.text();
          console.warn("⚠️ Secondary submission warning:", errorText);
          // Don't throw error here - we'll continue with success
        } else {
          const secondaryResult = await secondaryResponse.json();
          console.log("✅ Secondary submission successful:", secondaryResult);

          // Refetch patients data to update the list with new pregnancy info
          await refetchPatients();

          // Emit socket event for real-time updates to other clients
          if (emitMedicalRecordCreated) {
            emitMedicalRecordCreated({
              patientId: formData.patient_id,
              recordType: "currentpregnancyinfo",
              recordData: secondaryResult,
              eventType: "created",
            });
          }

          // Only show success if we get here
          showSuccessMessage({
            title: "Pregnancy Information Completed Successfully!",
            message: `Pregnancy journey details recorded for ${
              formData.name || "the patient"
            }.`,
            showScreeningButton: true,
            showProceedButton: false,
            patientId: formData.patient_id,
          });
          setSuccess(true);

          setFormData([]);
        }
      } catch (secondaryError) {
        console.warn(
          "⚠️ Secondary submission error (non-critical):",
          secondaryError
        );
        // Continue despite this error
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Critical submission error:", error);
      alert(`Submission failed: ${error.message}`);
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
      {showSuccess && <SuccessMessage {...successConfig} />}

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
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleChange}
                    placeholder="Enter Patient ID"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gestation Week *</label>
                  <input
                    type="number"
                    name="gestationweek"
                    value={formData.gestationweek}
                    onChange={handleChange}
                    placeholder="e.g 12"
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
                      name="gestationaldiabetes"
                      value={formData.gestationaldiabetes}
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
                  <label>Gestational Hypertension</label>
                  <div className="select-container">
                    <select
                      name="gesthypertension"
                      value={formData.gesthypertension}
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
                      name="placentaprevia"
                      value={formData.placentaprevia}
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
                      name="abnormaldoppler"
                      value={formData.abnormaldoppler}
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
                      name="multifetalgestation"
                      value={formData.multifetalgestation}
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
                      name="sex_of_fetus"
                      value={formData.sex_of_fetus}
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
                      name="primipaternity"
                      value={formData.primipaternity}
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
                      name="sever_anemia"
                      value={formData.sever_anemia}
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
                      name="high_hb"
                      value={formData.high_hb}
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
                      name="vitamind_deficiency"
                      value={formData.vitamind_deficiency}
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
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : "Submit"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Pregnancy;
