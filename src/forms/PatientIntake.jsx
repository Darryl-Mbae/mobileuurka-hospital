import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";
import useSuccessMessage from "../hooks/useSuccessMessage";
import SuccessMessage from "../components/SuccessMessage";

const PatientIntake = ({ setInternalTab }) => {
  // Initialize form state to match your desired output structure
  const [formData, setFormData] = useState({
    patientId: "",
    name: "",
    firstName: "",
    lastName: "",
    dob: "",
    address: "",
    hospital: "",
    email: "",
    phone: "",
    emergencyContact: null,
    insurance: "None",
    occupation: "",
    bloodgroup: "",
    rh: "",
    race: "",
    age: 0,
    editor: "",
  });

  const [grid, setGrid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [ids, setIds] = useState([]);
  const clearForm = () => {
    setFormData({});
  };
  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);



  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      editor: currentUser?.name || "",
    }));
  }, [currentUser]);

  useEffect(() => {
    fetchHospitals();
    getIds();
  }, []);

  const getIds = async ()=>{
    try {
      const response = await fetch(`${SERVER}/patients/ids`, {
        credentials: 'include',
      });
      const data = await response.json();
      console.log(data);
      setIds(data);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
  } 
}

  const fetchHospitals = async () => {
    try {
      const response = await fetch(`${SERVER}/tenants/names`, {
        credentials: 'include',
      });
      const data = await response.json();
      console.log(data);
      setHospitals(data);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  };
  

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-update age when DOB changes
      if (name === "dob") {
        updated.age = calculateAge(value);
      }

      // Auto-split full name into first/last names
      if (name === "name") {
        const [firstName, ...lastNameParts] = value.split(" ");
        updated.firstName = firstName || "";
        updated.lastName = lastNameParts.join(" ") || "";
      }

      return updated;
    });
  };


  const handleSubmit = async (e) => {
    setLoading(true);

    console.log(formData)
    try {
      const response = await fetch(`${SERVER}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData })
      });

      if (!response.ok) throw new Error("Submission failed");

      // Show success message
      showSuccessMessage({
        title: "Registration Completed Successfully!",
        message: `Vital signs recorded for ${formData.name || 'the patient'}.`,
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
      alert("Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="form">
             {showSuccess && <SuccessMessage {...successConfig} />}

      <form action={handleSubmit} className="form-container">
        <h2>Patient Registration</h2>

        <div className="form-grid-group">
          {grid === 0 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>User Name</label>
                  <input
                    type="text"
                    value={currentUser?.name || "Loading..."}
                    readOnly
                    className="read-only-field"
                  />
                </div>
                <div className="form-group">
                  <label>Patient National ID</label>
                  <input
                    type="text"
                    name="patientId"
                    value={formData?.patientId}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Patient Name</label>
                  <input
                    type="text"
                    value={formData?.name}
                    onChange={handleChange}
                    name="name"
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData?.dob}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData?.age}
                    readOnly
                  />
                </div>
              </div>
              <div className="column-2">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    name="phone"
                    type="text"
                    value={formData?.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    name="email"
                    type="email"
                    value={formData?.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData?.occupation}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Race</label>
                  <div className="select-container">
                    <select
                      name="race"
                      value={formData?.race}
                      onChange={handleChange}
                    >
                      <option value="" disabled selected>
                        Select Race
                      </option>
                      <option value="African">African</option>
                      <option value="Asian">Asian</option>
                      <option value="Caucasian">Caucasian</option>
                      <option value="Latin">Latin</option>
                      <option value="Mixed African">Mixed African</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
              </div>
            </div>
          )}
          {grid === 1 && (
            <div className="form-grid">
              <div className="column-1">

                <div className="form-group">
                  <label>Blood Group</label>
                  <div className="select-container">
                    <select
                      name="bloodgroup"
                      value={formData?.bloodgroup}
                      onChange={handleChange}
                    >
                      <option value="" disabled selected>
                        Select blood group
                      </option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Rhesus Factor</label>
                  <div className="select-container">
                    <select
                      name="rh"
                      value={formData?.rh}
                      onChange={handleChange}
                    >
                      <option value="" disabled selected>
                        Select Rhesus Factor
                      </option>
                      <option value="+">+</option>
                      <option value="-">-</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
                                <div className="form-group">
                  <label>Hospital</label>
                  <div className="select-container">
                    <select
                      name="hospital"
                      value={formData?.hospital || ""}
                      onChange={handleChange}
                    >
                      <option value="" disabled>
                        Select a Hospital
                      </option>
                      {hospitals.map((hospital) => (
                        <option key={hospital.name} value={hospital.name}>
                          {hospital.name}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="select-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Insurance</label>
                  <div className="select-container">
                    <select
                      name="insurance"
                      value={formData?.insurance}
                      onChange={handleChange}
                    >
                      <option value="None">None</option>
                      <option value="AAR Insurance">AAR Insurance</option>
                      <option value="Jubilee Insurance">
                        Jubilee Insurance
                      </option>
                      <option value="Britam Insurance">Britam Insurance</option>
                      <option value="APA Insurance">APA Insurance</option>
                      <option value="CIC Insurance">CIC Insurance</option>
                      <option value="Madison Insurance">
                        Madison Insurance
                      </option>
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
          {grid === 0 && (
            <div className="button" onClick={() => setGrid(grid + 1)}>
              Next
            </div>
          )}
          {grid === 1 && (
            <button
              type="submit"
              className="button primary"
              onClick={() => setLoading(true)}
            >
              {loading ? <div className="spinner"></div> : "Submit"}
            </button>
          )}
          {grid === 1 && success && (
            <div className="button primary" onClick={() => setInternalTab(2.6)}>
              Proceed to Visits
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default PatientIntake;
