import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";

const Ultrasound = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    gestationWeek: 0,
    amniotic: 0, // Amniotic fluid level
    imageUrl: "",
  });

  const clearForm = () => {
    setFormData({});
  }

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);


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
    uploadFormData.append('file', imageFile);
    uploadFormData.append('type', 'ultrasound');

    try {
      const response = await fetch(`${SERVER}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.url || result.imageUrl || result.filePath || "";
      } else {
        // If upload fails, we'll continue without the image
        console.warn('Image upload failed, continuing without image');
        return "";
      }
    } catch (error) {
      console.warn('Error uploading image, continuing without image:', error);
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

      const submitData = {
        ...formData,
        imageUrl: imageUrl
      };

      const response = await fetch(`${SERVER}/patients/medical/ultrasound`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
      }

      const result = await response.json();
      console.log("Ultrasound record created:", result);
      // Show success message
      showSuccessMessage({
        title: "Ultrasound Completed Successfully!",
        message: `Vitals recorded for ${patientName || 'the patient'}.`,
        showRedoButton: true,
        showScreeningButton: true,
        showNextButton: true,
        setInternalTab: setInternalTab,
        nextButtonText: "Add Another Triage",
        nextButtonAction: () => {
          clearForm();
        },
        patientId: formData.patientId
      });
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to assess amniotic fluid level
  const getAmnioticAssessment = (level) => {
    if (level === 0) return "";
    if (level < 5) return "Oligohydramnios (Low) - Monitor closely";
    if (level >= 5 && level <= 25) return "Normal";
    if (level > 25) return "Polyhydramnios (High) - Monitor closely";
    return "";
  };

  const amnioticAssessment = getAmnioticAssessment(formData.amniotic);

  return (
    <div className="form">
             {showSuccess && <SuccessMessage {...successConfig} />}

      <form onSubmit={handleSubmit} className="form-container">
        <h2>Ultrasound Examination</h2>

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
                <small style={{ 
                  color: amnioticAssessment.includes('Normal') ? '#27ae60' : '#e74c3c',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
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
                  width: '100%',
                  padding: '10px',
                  border: '1px solid rgba(144, 144, 144, 0.56)',
                  borderRadius: '5px'
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Supported formats: JPG, PNG, GIF (Max 5MB)
              </small>
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
            {imagePreview && (
              <div className="form-group">
                <label>Image Preview</label>
                <img 
                  src={imagePreview} 
                  alt="Ultrasound Preview" 
                  style={{ 
                    width: '100%',
                    height: '270px',
                    objectFit: 'cover',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: '#f8f9fa'
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

export default Ultrasound;