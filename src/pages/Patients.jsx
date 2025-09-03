import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "../css/Patients.css";
import SearchContainer from "../components/SearchContainer";
import { useNavigate } from "react-router-dom";
import { IoIosWarning } from "react-icons/io";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";
import { setPatients } from "../reducers/Slices/patientsSlice";

const columns = [
  { label: "Name", key: "name" },
  { label: "ID", key: "id" },
  {
    label: "National ID",
    key: "patientId",
    render: ({ patient }) => {
      // If no National ID or National ID is "NA", show phone number (unmasked)
      if (!patient.patientId || patient.patientId === "NA" || patient.patientId === "na") {
        return patient.phone || "—";
      }
      return maskId(patient.patientId);
    },
  },
  {
    label: "Hospital",
    key: "hospital",
    render: ({ patient }) => patient.hospital || "—",
  },
  {
    label: "Risk",
    key: "risk",
    render: ({ patient }) => {
      const lastExplanation =
        patient?.explanations?.[patient.explanations.length - 1];

      if (!lastExplanation?.risklevel) return "—";

      const risk = lastExplanation.risklevel.toLowerCase();

      // Modern transparentish colors
      const colors = {
        high: {
          text: "rgba(220, 38, 38, 0.9)", // red-600
          bg: "rgba(220, 38, 38, 0.08)",
        },
        mid: {
          text: "rgba(251, 191, 36, 0.9)", // yellow-400
          bg: "rgba(251, 191, 36, 0.08)",
        },
        low: {
          text: "rgba(34, 197, 94, 0.9)", // green-500
          bg: "rgba(34, 197, 94, 0.08)",
        },
        default: {
          text: "rgba(107, 114, 128, 0.9)", // gray-500
          bg: "rgba(107, 114, 128, 0.08)",
        },
      };

      const { text, bg } = colors[risk] || colors.default;

      return (
        <span
          className="risk-color"
          style={{
            background: bg,
            color: text,
          }}
        >
          <div
            className="dot"
            style={{
              background: text,
            }}
          ></div>
          {risk.charAt(0).toUpperCase() + risk.slice(1)}
        </span>
      );
    },
  },

  {
    label: "Suspected Diagnosed Diseases",
    key: "suspected",
    render: ({ patient }) => {
      const lastLab = patient?.labworks?.[patient.labworks.length - 1];
      const rawDiagnosis = lastLab?.diagnosis;
      const formatted = formatDiagnosis(rawDiagnosis);

      const isEmpty =
        !rawDiagnosis ||
        formatted === "No diagnosis" ||
        formatted === "Suspected to have ";

      return (
        <span style={{ display: "flex", alignItems: "center" }}>
          {!isEmpty && (
            <IoIosWarning
              style={{
                color: "#FF9500",
                backgroundColor: "#FF950020",
                borderRadius: "50%",
                padding: "2px",
                marginRight: "8px",
                fontSize: "1.1rem",
              }}
            />
          )}
          {isEmpty ? "—" : formatted}
        </span>
      );
    },
  },
];

function formatDiagnosis(raw) {
  if (!raw) return "No diagnosis records";

  const parsePostgresArray = (str) => {
    return str
      .replace(/^{|}$/g, "") // remove surrounding braces
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/) // split on commas outside quotes
      .map((item) => item.replace(/^"(.*)"$/, "$1").trim()); // remove surrounding quotes
  };

  const parsed = parsePostgresArray(raw);

  const cleaned = parsed
    .filter((x) => x && x !== "NULL")
    .map((entry) =>
      entry
        .replace(/Highly\s+/i, "")
        .replace(/Suspected to have\s+/i, "")
        .replace(/\.$/, "")
        .trim()
    );

  if (cleaned.length === 0) return "No diagnosis data found";

  // 🧠 Check for "No specific conditions detected" as first item
  if (/^no specific conditions detected/i.test(cleaned[0])) {
    return cleaned[0];
  }

  return `Suspected to have ${cleaned.join(" & ")}`;
}

function maskId(id) {
  if (!id) return "—"; // fallback for missing/null/undefined
  if (typeof id !== "string") id = String(id);

  const lastFour = id.slice(-4);
  return `*****${lastFour}`;
}

function maskPhone(phone) {
  if (!phone) return "—"; // fallback for missing/null/undefined
  if (typeof phone !== "string") phone = String(phone);

  // Remove any non-digit characters for processing
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 4) return phone; // Don't mask if too short

  const lastFour = digits.slice(-4);
  const maskedPart = '*'.repeat(Math.max(0, digits.length - 4));

  // Try to preserve original formatting if it exists
  if (phone.includes('-') || phone.includes(' ') || phone.includes('(')) {
    return `${maskedPart}${lastFour}`;
  }

  return `${maskedPart}${lastFour}`;
}

const Patients = ({ setActiveItem }) => {
  const dispatch = useDispatch();
  const patients = useSelector((state) => state.patient.patients);
  const [filteredPatients, setFilteredPatients] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
  const [filters, setFilters] = React.useState({
    risk: "",
    hospital: "",
  });
  const navigate = useNavigate();



  // Add pagination hook
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
    getPaginatedData,
  } = usePagination({
    totalItems: filteredPatients.length,
    initialItemsPerPage: 10,
    initialPage: 1,
  });

  const currentPagePatients = getPaginatedData(filteredPatients);

  useEffect(() => {
    if (patients) {
      const safeUsers = Array.isArray(patients)
        ? patients
        : patients
          ? [patients]
          : [];

      const filtered = safeUsers.filter((patient) => {
        // Search filter
        const matchesSearch =
          patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.hospital?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.reasonForVisit
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        // Risk filter
        const patientRisk = patient?.explanations?.[patient.explanations.length - 1]?.risklevel?.toLowerCase();
        const matchesRisk = !filters.risk || patientRisk === filters.risk.toLowerCase();

        // Hospital filter
        const matchesHospital = !filters.hospital || patient.hospital === filters.hospital;

        return matchesSearch && matchesRisk && matchesHospital;
      });

      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  }, [patients, searchTerm, filters]);

  const handleClick = (patientId) => {
    navigate(`/Patient/${patientId}`);
    // setSelectedPatientId(patientId);
    // setActiveItem("Patient");
  };

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    handlePageChange(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    handlePageChange(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      risk: "",
      hospital: "",
    });
    handlePageChange(1);
  };

  // Get unique values for filter dropdowns
  const getUniqueRiskLevels = () => {
    if (!patients) return [];
    const risks = patients
      .map(patient => patient?.explanations?.[patient.explanations.length - 1]?.risklevel)
      .filter(Boolean)
      .map(risk => risk.toLowerCase());
    return [...new Set(risks)];
  };

  const getUniqueHospitals = () => {
    if (!patients) return [];
    const hospitals = patients
      .map(patient => patient.hospital)
      .filter(Boolean);
    return [...new Set(hospitals)];
  };

  const uniqueRiskLevels = getUniqueRiskLevels();
  const uniqueHospitals = getUniqueHospitals();

  const handleAddPatient = () => {
    setActiveItem("PatientIntake");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { apiGet } = await import("../config/api.js");
      const patientsData = await apiGet("/patients/my");
      dispatch(setPatients(patientsData));
      console.log("Patients refreshed successfully");
    } catch (error) {
      console.error("Error refreshing patients:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="patients-page">
      <div className="toolbar">
        <div className="count">
          All Patients <span>{filteredPatients?.length || 0}</span>
        </div>
        <div className="search">
          <SearchContainer
            placeholder="Search patients..."
            onSearch={handleSearch}
            onAdd={handleAddPatient}
            addButtonText="Add Patient"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={handleRefresh}
            showRefresh={true}
            refreshing={refreshing}
          />
        </div>
      </div>

      {/* Modern Filters */}
      <div className="filters-container">
        <div className="filters-row">
          <div className="filter-group">
            <select
              value={filters.risk}
              onChange={(e) => handleFilterChange("risk", e.target.value)}
              className="filter-select"
            >
              <option value="">All Risk Levels</option>
              {uniqueRiskLevels.map((risk) => (
                <option key={risk} value={risk}>
                  {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.hospital}
              onChange={(e) => handleFilterChange("hospital", e.target.value)}
              className="filter-select"
            >
              <option value="">All Hospitals</option>
              {uniqueHospitals.map((hospital) => (
                <option key={hospital} value={hospital}>
                  {hospital}
                </option>
              ))}
            </select>
          </div>

          {(filters.risk || filters.hospital) && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        {(filters.risk || filters.hospital) && (
          <div className="active-filters">
            <span className="filter-label">Active filters:</span>
            {filters.risk && (
              <span className="filter-tag">
                Risk: {filters.risk.charAt(0).toUpperCase() + filters.risk.slice(1)}
                <button onClick={() => handleFilterChange("risk", "")}>×</button>
              </span>
            )}
            {filters.hospital && (
              <span className="filter-tag">
                Hospital: {filters.hospital}
                <button onClick={() => handleFilterChange("hospital", "")}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="lists">
        <div className="title">
          {columns.map((col) => (
            <div key={col.key} className={col.key}>
              {col.label}
            </div>
          ))}
        </div>

        {currentPagePatients?.length > 0 ? (
          currentPagePatients.map((patient) => (
            <div
              className="list"
              key={patient.id}
              onClick={() => handleClick(patient.id)}
            >
              {columns.map((col) => (
                <div key={col.key} className={col.key}>
                  {col.render
                    ? col.render({ patient })
                    : patient[col.key] || "—"}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="no-results">
            {searchTerm
              ? `No patients found matching "${searchTerm}"`
              : "No patients found."}
          </div>
        )}
      </div>

      {/* Add Pagination Component */}
      {filteredPatients?.length > 0 && (
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
    </div>
  );
};

export default Patients;
