import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";

const Pregnancy = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    gestationweek: 0,
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
    spe: 0,
    malaria: "",
    hookworm: "",
    vitamind_deficiency: "",
    sever_anemia: "",
    high_hb: "",
  });

  const [grid, setGrid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patient, setPatient] = useState(null);
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
        setPatient(patient)
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

    if (name === "patientId" && value) {
      fetchPatientName(value);
    } else if (name === "patientId" && !value) {
      setPatientName("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await addData(formData);
  };
  const getLatest = (array, property, defaultValue) => {
    return array?.length ? array[array.length - 1][property] : defaultValue;
  };

  const addData = async (formData) => {
    const newFormData = {
      ...formData,
      patient_id:patient.patientId,
      visit_id:"testing",

      // ─── Triage Data ───────────────────────────────────────────
      bmi: getLatest(patient?.triages, "bmi", "Unkown"),
      systolic: getLatest(patient?.triages, "systolic", "Unkown"),
      diastolic: getLatest(patient?.triages, "diastolic", "Unkown"),
      MAP: getLatest(patient?.triages, "map", "Unkown"),
      amniotic: getLatest(patient?.ultrasounds, "amniotic", "Unkown"),

      // ─── Medical History ───────────────────────────────────────
      GESTATIONALDIABETESHISTORY: getLatest(
        patient?.patientHistories,
        "gestationalDiabetesHistory",
        "Unkown"
      ),
      FAMHISTORYGESTATIONALDIABETES: getLatest(
        patient?.patientHistories,
        "famHistoryGestationalDiabetes",
        "Unkown"
      ),
      FAMHISTORYDIABETES: getLatest(
        patient?.patientHistories,
        "famHistoryDiabetes",
        "Unkown"
      ),
      firstpreeclampsiahistory: getLatest(
        patient?.patientHistories,
        "firstPreeclampsiaHistory",
        "Unkown"
      ),
      FAMOBESEHISTORY: "Unkown", // Not in schema
      DIABETESMELITUS: getLatest(
        patient?.patientHistories,
        "diabetesMelitus",
        "Unkown"
      ),
      PREVCHILDWEIGHT: getLatest(
        patient?.patientHistories,
        "prevChildWeight",
        "Unkown"
      ),
      ANEMIAHISTORY: getLatest(patient?.patientHistories, "anemia", "Unkown"),
      MISCARRIAGE: getLatest(
        patient?.patientHistories,
        "miscarriage",
        "Unkown"
      ),
      MISCARRIAGENUM: getLatest(
        patient?.patientHistories,
        "miscarriageNum",
        "Unkown"
      ),
      FAMANEMIAHISTORY: getLatest(
        patient?.patientHistories,
        "famHistoryAnemia",
        "Unkown"
      ),
      FAM_SICKLE_CELL_HISTORY: getLatest(
        patient?.patientHistories,
        "famSickleCell",
        "Unkown"
      ),
      FAM_THALASSEMIA_HISTORY: getLatest(
        patient?.patientHistories,
        "famThalassemia",
        "Unkown"
      ),

      // ─── Lifestyle ─────────────────────────────────────────────
      DIET: getLatest(patient?.patient_lifestyles, "diet", "Balanced"),
      EXERCISE: getLatest(patient?.patient_lifestyles, "excercise", "Unkown"),

      // ─── Gynecological History ────────────────────────────────
      MENORRHAGIA: getLatest(
        patient?.patientHistories,
        "menorrhagia",
        "Unkown"
      ),
      PREG_HIST_ANEMIA: getLatest(
        patient?.patientHistories,
        "pregnancyHistoryAnemia",
        "Unkown"
      ),
      PREGNANCYHISTORYANEMIA: getLatest(
        patient?.patientHistories,
        "pregnancyHistoryAnemia",
        "Unkown"
      ),
      PARITY: getLatest(patient?.patientHistories, "parity", "Unkown"),
      RACE: patient?.race || "Unknown",
      INTERVAL: getLatest(patient?.patientHistories, "interval", "Unkown"),
      IVF: getLatest(patient?.patientHistories, "ivf", "Unkown"),
      CONTRACEPETIVES: getLatest(
        patient?.patientHistories,
        "contraceptives",
        "Unkown"
      ),
      PCOS: getLatest(patient?.patientHistories, "pcos", "Unkown"),
      INFERTILITY: getLatest(
        patient?.patientHistories,
        "infertility",
        "Unkown"
      ),

      // ─── Cardiovascular ────────────────────────────────────────
      FAMHYPERTENSIONHISTORY: getLatest(
        patient?.patientHistories,
        "famHistoryHypertension",
        "Unkown"
      ),
      HYPERTENSIONHISTORY: getLatest(
        patient?.patientHistories,
        "chronicHypertension",
        "Unkown"
      ),
      GESTATIONALHYPERTENSIONHISTORY: getLatest(
        patient?.patientHistories,
        "gestationalHypertensionHistory",
        "Unkown"
      ),
      famhistorygestationalhypertension: getLatest(
        patient?.patientHistories,
        "famHistoryGestationalHypertension",
        "Unkown"
      ),
      CARDIACDISEASE: getLatest(
        patient?.patientHistories,
        "cardiacDisease",
        "Unkown"
      ),

      // ─── Pregnancy Complications ───────────────────────────────
      FAMHISTORYPREECLAMPSIA: getLatest(
        patient?.patientHistories,
        "famHistoryPreeclampsia",
        "Unkown"
      ),
      PREECLAMPSIAHISTORY: getLatest(
        patient?.patientHistories,
        "preeclampsiaHistory",
        "Unkown"
      ),
      ECLAMPSIAHISTORY: getLatest(
        patient?.patientHistories,
        "eclampsiaHistory",
        "Unkown"
      ),
      PPH: getLatest(patient?.patientHistories, "pph", "Unkown"),
      STILLBIRTH: getLatest(patient?.patientHistories, "stillbirth", "Unkown"),

      // ─── Other Medical Conditions ──────────────────────────────
      AUTOIMMUNE: getLatest(patient?.patientHistories, "autoimmune", "Unkown"),
      FAMHISTORYAUTOIMMUNE: "Unkown", // Not in schema
      LIVER: getLatest(patient?.patientHistories, "liver", "Unkown"),
      CHRONICRENALDISEASE: getLatest(
        patient?.patientHistories,
        "chronicRenalDisease",
        "Unkown"
      ),
      RHEUMATOID_ARTHRITIS: getLatest(
        patient?.patientHistories,
        "rheumatoidArthritis",
        "Unkown"
      ),
      THYROID: getLatest(patient?.patientHistories, "thyroid", "Unkown"),

      // ─── Lab Results ───────────────────────────────────────────
      BLOODGROUP: patient?.bloodgroup || "Unknown",
      RH: patient?.rh || "Unknown",
      HAEMOGLOBIN: getLatest(patient?.labworks, "haemoglobin", "Unkown"),
      URINE_GLUCOSE: getLatest(patient?.labworks, "urine_glucose", "Negative"),
      URINE_PROTEIN: getLatest(patient?.labworks, "urine_protein", "Negative"),
      CHRONICHYPERTENSION: getLatest(
        patient?.patientHistories,
        "chronicHypertension",
        "Unkown"
      ),

      // ─── Obstetric History ─────────────────────────────────────
      PREVGYNASURGERY: getLatest(
        patient?.patientHistories,
        "prevGynaSurgery",
        "Unkown"
      ),
      PROLONGEDLABOUR: getLatest(
        patient?.patientHistories,
        "prolongedLabour",
        "Unkown"
      ),
      CSECTION: getLatest(patient?.patientHistories, "csection", "Unkown"),
      CSECTIONNUM: getLatest(
        patient?.patientHistories,
        "csectionNum",
        "Unkown"
      ),

      // ─── Demographics ──────────────────────────────────────────
      AGE: calculateAge(patient?.dob) || "Unknown",
      MALE_AGE: getLatest(patient?.patientHistories, "maleAge", "Unkown"),
      KIDNEY: getLatest(patient?.patientHistories, "kidney", "Unkown"),
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
      const primaryURL =
        "https://prediction-api-864851114868.europe-west4.run.app";

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
        }
      } catch (secondaryError) {
        console.warn(
          "⚠️ Secondary submission error (non-critical):",
          secondaryError
        );
        // Continue despite this error
      }

     
      // Only show success if we get here
      alert("Form submitted successfully!");
      setLoading(false);
      setFormData([]);
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
                    name="gestationweek"
                    value={formData.gestationweek}
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
