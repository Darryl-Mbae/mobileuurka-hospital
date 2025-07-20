import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const Notepad = ({ patient, user }) => {
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const [loading, setLoading] = useState(false);

  // State for storing form data
  const [formData, setFormData] = useState({
    nurseDoctor: user ? user.name : "",
    patient_id: patient ? patient.patient_id : "",
    patientName: patient ? patient.name : "",
    visitNumber: patient?.notes?.length
      ? patient.notes[patient.notes.length]
      : "1",
    notes: "",
    gestationweek: "",
    date: new Date().toISOString().split("T")[0],
    visit_id: "",
    user_id: user ? user.user_id : "",
    title: "",
  });

  useEffect(() => {
    if (formData.patient_id && formData.visitNumber) {
      setFormData((prevData) => ({
        ...prevData,
        visit_id: `${prevData.patient_id}-${prevData.visitNumber}`,
      }));
    }
  }, [formData.patient_id, formData.visitNumber]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = (e) => {
    setLoading(true);
    e.preventDefault();
    const payload = {
      patient_id: formData.patient_id,
      user_id: user?.user_id,
      date: new Date().toISOString().split("T")[0], // or use formData.date if already set
      visit_id: formData.visit_id,
      gestationweek: Number(formData.gestationweek) || undefined,
      notes: formData.notes,
      title: formData.title,
    };
    sendToDB(payload);
  };

  async function sendToDB(formData) {
    const response = await fetch(`${SERVER}/patient/${patient?.patient_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        data: formData,
        title: "notes",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error submitting form:", errorData);
      alert("Failed to submit form. Please try again.");
      setLoading(false);
      return;
    }
    const data = await response.json();
    console.log("Form submitted successfully:", data);
    alert("Form submitted successfully!");
    setFormData({}); // Reset form data on error

    setLoading(false);
  }

  return (
    <div className="notepad-container">
      <form
        id="form"
        className="form"
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "45% 45%",
          gap: "10%",
          width: "100%",
        }}
      >
        {/* Left Side Form Fields */}
        <div className="grid1">
          <h3>Patient Information</h3>
          <div className="form-group">
            <label htmlFor="nurseDoctor">Nurse | Doctor</label>
            <input
              className="sname"
              type="text"
              id="nurseDoctor"
              name="nurseDoctor"
              required
              value={formData.nurseDoctor}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="patientId">Patient's ID Number</label>
            <input
              className="sname"
              type="number"
              id="patient_id"
              name="patient_id"
              required
              value={formData.patient_id}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="patientName">Patient's Name</label>
            <input
              className="sname"
              type="text"
              id="patientName"
              name="patientName"
              required
              value={formData.patientName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="visitNumber">Visit Number</label>
            <input
              className="sname"
              type="number"
              id="visitNumber"
              name="visitNumber"
              required
              value={formData.visitNumber}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="visitNumber">Gestation Week</label>
            <input
              className="sname"
              type="number"
              id="gestationweek"
              name="gestationweek"
              required
              value={formData.gestationweek || ""}
              onChange={handleChange}
            />
          </div>
          {/* Submit Button */}
          <button type="submit" className="button primary">
            {loading ? <div className="spinner"></div> : "Submit"}
          </button>{" "}
        </div>

        {/* Right Side Form Fields */}
        <div
          className="grid2"
          style={{ marginLeft: "-80px", paddingTop: "60px" }}
        >
          
          <div className="form-group">
            <label htmlFor="visitNumber">Note Title</label>
            <input
              className="sname"
              type="text"
              id="title"
              name="title"
              required
              value={formData.title || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="note">Note</label>
            <textarea
              className="txt"
              name="notes"
              id="notes"
              // rows="20"
              style={{
                borderRadius: "5px",
                border: "solid rgba(144, 144, 144, 0.56) 1px",
                paddingLeft: "10px",
                background: "transparent",
                paddingTop: "10px",
                minHeight: "200px",
                fontFamily: "'Inter', sans-serif", // ✅ no !important
              }}
              value={formData.notes}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Notepad;
