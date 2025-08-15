import React, { useEffect, useState } from "react";
import "./css/Medication.css";
import { RiSearchLine } from "react-icons/ri";
import { IoMdAdd } from "react-icons/io";
import { IoDocumentTextOutline, IoWarningOutline } from "react-icons/io5";
import "./css/Document.css";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

const Medication = ({ setActiveTab, patient }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  console.log("Patient Data:", patient);

  const medicationAllergies = (patient?.allergies || [])
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
        formType: "prescription",
        returnTo: "medication",
        internalTab: 2.9, // Prescription form tab
      },
    });
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredMedications = (patient?.medications || []).filter((med) =>
    med.medicine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add pagination hook
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
    getPaginatedData,
  } = usePagination({
    totalItems: filteredMedications.length,
    initialItemsPerPage: 10,
    initialPage: 1,
  });

  const currentPageMedications = getPaginatedData(filteredMedications);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    handlePageChange(1); // Reset to first page when searching
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
        <div
          className="buttonz"
          onClick={handleAddMedication}
          data-tooltip-id="test-tooltip"
          data-tooltip-content="Click to add a new medication"
        >
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
          {currentPageMedications.map((med, index) => (
            <div className="record" key={index}>
              <div className="doc">
                <div
                  className="icon"
                  style={{ position: "relative", zIndex: 1 }}
                >
                  <IoDocumentTextOutline
                    data-tooltip-id="medication-tooltip"
                    data-tooltip-content={`${med.medicine} - Click for more information about this medication.`}
                    style={{ cursor: "pointer" }}
                  />
                </div>
                <div className="details">
                  <div className="doc-name">{med.medicine}</div>
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
            <div className="icon" style={{ position: "relative", zIndex: 1 }}>
              <IoWarningOutline
                data-tooltip-id="allergy-warning-tooltip"
                data-tooltip-content={`Patient has known medication allergies: ${medicationAllergies}. Please review before prescribing.`}
                style={{ cursor: "pointer" }}
              />
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

      {/* Add Pagination Component */}
      {filteredMedications?.length > 0 && (
        <Pagination
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showPageInfo={true}
          showItemsPerPageSelector={true}
          itemsPerPageOptions={[5, 10, 15, 20]}
        />
      )}

      {/* Tooltips */}
      <Tooltip
        id="medication-tooltip"
        style={{
          fontSize: ".8em",
          zIndex: "99999",
          backgroundColor: "#333",
          color: "white",
          padding: "8px 12px",
          borderRadius: "4px",
        }}
      />

      <Tooltip
        id="allergy-warning-tooltip"
        style={{
          fontSize: ".8em",
          zIndex: "99999",
          backgroundColor: "#333",
          color: "white",
          padding: "8px 12px",
          borderRadius: "4px",
        }}
      />

      <Tooltip
        id="test-tooltip"
        style={{
          fontSize: ".8em",
          zIndex: "99999",
          backgroundColor: "#333",
          color: "white",
          padding: "8px 12px",
          borderRadius: "4px",
        }}
      />
    </div>
  );
};

export default Medication;
