import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";

const FetalUltrasound = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    gestationWeek: "",
    // Fetal measurements
    fhr: "", // Fetal Heart Rate
    femurHeight: "",
    headCircumference: "",
    // Ultrasound findings
    amniotic: "", // Amniotic fluid level
    imageUrl: "",
  });

  const token = localStorage.getItem("access_token");
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [success, setSuccess] = useState(false);
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const clearForm = () => {
    setFormData({
      patientId: selectedPatientId || "",
      editor: currentUser?.name || "",
      date: new Date().toISOString().split("T")[0],
      gestationWeek: "",
      fhr: "",
      femurHeight: "",
      headCircumference: "",
      amniotic: "",
      imageUrl: "",
    });
    setPatientName("");
    setImageFile(null);
    setImagePreview("");
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
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const patient = await response.json();
        setPatientName(patient.name || "Unknown Patient");

        // Auto-fill gestation week from latest visit if available
        if (patient?.visits && patient.visits.length > 0) {
          setFormData((prev) => ({
            ...prev,
            gestationWeek: parseInt(
              patient?.visits[patient.visits.length - 1]?.gestationWeek ?? 0,
              10
            ),
          }));
        }
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return "";

    const uploadFormData = new FormData();
    uploadFormData.append("file", imageFile);

    try {
      const response = await fetch(`${SERVER}/upload`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: uploadFormData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.url || result.imageUrl || result.filePath || "";
      } else {
        // If upload fails, we'll continue without the image
        console.warn("Image upload failed, continuing without image");
        return "";
      }
    } catch (error) {
      console.warn("Error uploading image, continuing without image:", error);
      return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.imageUrl;

      // Upload image if file is selected
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Prepare data for Fetal API
      const fetalData = {
        patientId: formData.patientId,
        editor: formData.editor,
        date: formData.date,
        gestationWeek: formData.gestationWeek,
        fhr: formData.fhr,
        femurHeight: formData.femurHeight,
        headCircumference: formData.headCircumference,
      };

      // Prepare data for Ultrasound API
      const ultrasoundData = {
        patientId: formData.patientId,
        editor: formData.editor,
        date: formData.date,
        gestationWeek: formData.gestationWeek,
        amniotic: formData.amniotic,
        imageUrl: imageUrl,
      };

      // Submit to Fetal API
      const fetalResponse = await fetch(
        `${SERVER}/patients/medical/fetalInfo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: "include",
          body: JSON.stringify(fetalData),
        }
      );

      if (!fetalResponse.ok) {
        const errorData = await fetalResponse.json();
        throw new Error(
          `Fetal submission failed: ${errorData.error || "Unknown error"}`
        );
      }

      // Submit to Ultrasound API
      const ultrasoundResponse = await fetch(
        `${SERVER}/patients/medical/ultrasound`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: "include",
          body: JSON.stringify(ultrasoundData),
        }
      );

      if (!ultrasoundResponse.ok) {
        const errorData = await ultrasoundResponse.json();
        throw new Error(
          `Ultrasound submission failed: ${errorData.error || "Unknown error"}`
        );
      }

      const fetalResult = await fetalResponse.json();
      const ultrasoundResult = await ultrasoundResponse.json();

      console.log("Fetal info created:", fetalResult);
      console.log("Ultrasound record created:", ultrasoundResult);

      showSuccessMessage({
        title: "Fetal & Ultrasound Assessment Completed Successfully!",
        message: `Fetal measurements and ultrasound findings recorded for ${
          patientName || "the patient"
        }.`,
        showRedoButton: true,
        showScreeningButton: true,
        showNextButton: true,
        setInternalTab: setInternalTab,
        nextButtonText: "Add Another Assessment",
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
    if (fhr === 0 || fhr === "") return "";
    const fhrNum = parseInt(fhr);
    const gestWeek = parseInt(gestationWeek);

    if (gestWeek < 20) {
      if (fhrNum >= 120 && fhrNum <= 160) return "Normal";
      return "Abnormal - Consult specialist";
    } else {
      if (fhrNum >= 110 && fhrNum <= 160) return "Normal";
      if (fhrNum < 110) return "Bradycardia - Monitor closely";
      if (fhrNum > 160) return "Tachycardia - Monitor closely";
    }
    return "";
  };

  // Helper function to assess amniotic fluid level
  const getAmnioticAssessment = (level) => {
    if (level === 0 || level === "") return "";
    const levelNum = parseInt(level);

    if (levelNum < 5) return "Oligohydramnios (Low) - Monitor closely";
    if (levelNum >= 5 && levelNum <= 25) return "Normal";
    if (levelNum > 25) return "Polyhydramnios (High) - Monitor closely";
    return "";
  };

  const fhrAssessment = getFHRAssessment(formData.fhr, formData.gestationWeek);
  const amnioticAssessment = getAmnioticAssessment(formData.amniotic);

  return (
    <div className="form">
      {showSuccess && (
        <SuccessMessage {...successConfig} setInternalTab={setInternalTab} />
      )}

      <form onSubmit={handleSubmit} className="form-container">
        <h2>Fetal & Ultrasound Assessment</h2>

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
              <label>Amniotic Fluid Level (cm)</label>
              <input
                type="number"
                name="amniotic"
                value={formData.amniotic}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 15"
              />
              {amnioticAssessment && (
                <small
                  style={{
                    color: amnioticAssessment.includes("Normal")
                      ? "#27ae60"
                      : "#e74c3c",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  Assessment: {amnioticAssessment}
                </small>
              )}
            </div>
            <div className="form-group">
              <label>Upload Ultrasound Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid rgba(144, 144, 144, 0.56)",
                  borderRadius: "5px",
                }}
              />
              <small style={{ color: "#666", fontSize: "12px" }}>
                Supported formats: JPG, PNG, GIF (Max 5MB)
              </small>
            </div>
            {imagePreview && (
              <div className="form-group">
                <label>Image Preview</label>
                <img
                  src={imagePreview}
                  alt="Ultrasound Preview"
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    background: "#f8f9fa",
                  }}
                />
              </div>
            )}
          </div>
        </div>

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

export default FetalUltrasound;
