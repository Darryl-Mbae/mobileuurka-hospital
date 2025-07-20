import React, { useEffect, useState } from "react";
import "./css/Medication.css";
import { RiSearchLine } from "react-icons/ri";
import { IoMdAdd } from "react-icons/io";
import { IoDocumentTextOutline, IoWarningOutline } from "react-icons/io5";
import "./css/Document.css";
import { useNavigate } from "react-router-dom";

const Medication = ({ setActiveTab, patient, setTab }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllergyButton, setShowAllergyButton] = useState(false);
  const navigate = useNavigate();

  console.log("Patient Data:", patient);

  const medicationAllergies = patient.allergies
    .filter((item) => item.allergy_type === "Medication")
    .map((item) => item.allergies)
    .join(", ");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function handleAddMedication() {
    // Navigate to Screening prescription form
    navigate("/Screening", { 
      state: { 
        patientId: patient?.id,
        formType: 'prescription',
        returnTo: 'medication',
        internalTab: 2.9 // Prescription form tab
      } 
    });
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="medication">
      <div className="con">
        <div className="search-input">
          <RiSearchLine />
          <input
            type="search"
            id="searchInputs"
            name="search"
            placeholder="Search Medicines"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="buttonz" onClick={handleAddMedication}>
          <IoMdAdd />
          Add Medicine
        </div>
      </div>

      <div className="med-grid">
        <div className="meds documents">
          <div className="title">
            <div className="title-name">Name</div>
            <div className="Editor">Dosage</div>
            <div className="date">Duration</div>
          </div>
          {patient.medications
            .filter((med) =>
              med.medicine.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((med, index) => (
              <div className="record" key={index}>
                <div className="doc">
                  <div className="icon">
                    <IoDocumentTextOutline />
                  </div>
                  <div className="details">
                    <div className="doc-name">{med.medicine}</div>

                    {/* <div className="doc-visit">{med.dosage}</div> */}
                  </div>
                </div>
                <div className="doc-editor">{med.dosage}</div>
                <div className="date">
                  {formatDate(med.startDate)} - {formatDate(med.stopDate)}
                </div>
              </div>
            ))}
        </div>

        {medicationAllergies && medicationAllergies.trim() !== "" && (
          <div className="warning">
            <div className="icon">
              <IoWarningOutline />
            </div>
            <div className="details">
              <div className="title">Medication Alert</div>

              <p>
                The patient has a known adverse reaction to{" "}
                {medicationAllergies}. Please review the allergy history and
                consider alternative medications.
              </p>

              <div
                className="allergy-button active"
                onClick={() => setActiveTab("profile")}
              >
                View Allergies
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Medication;
