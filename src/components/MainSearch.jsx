import React, { useEffect, useState } from "react";
import "../css/MainSearch.css";
import { IoIosWarning, IoMdSearch } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setPatients } from "../reducers/Slices/patientsSlice";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { Tooltip } from "react-tooltip";

const SERVER = import.meta.env.VITE_SERVER_URL;

function MainSearch({ user }) {
  const currentUser = user || useSelector((s) => s.user.currentUser);
  const patients = useSelector((s) => s.patient.patients);
  const dispatch = useDispatch();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    getPatients();
  }, [user]);

  const openMail = () => {
    window.location.href = "mailto:support@mobileuurka.com"; // Replace with your email
  };

  async function getPatients() {
    try {
      const { apiGet } = await import("../config/api.js");
      const patientsData = await apiGet("/patients/my");
      dispatch(setPatients(patientsData));
    } catch (error) {
      console.error("Error fetching patient data:", error);
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    console.log("Search Query:", value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    const filtered = patients.filter((u) => {
      const pid = u.patientId?.toLowerCase() || "";
      const name = u.name?.toLowerCase() || "";
      const searchTerm = value.toLowerCase();

      return pid.includes(searchTerm) || name.includes(searchTerm);
    });

    console.log("Filtered Results:", filtered);
    setResults(filtered);
  };

  const handleSelect = (patient) => {
    navigate(`/Patient/${patient.id}`);
  };

  const getFilteredResults = () => {
    if (activeFilter === "highRisk") {
      return results.filter(
        (patient) =>
          patient.explanations?.[patient.explanations.length - 1]?.risklevel ===
          "High"
      );
    }
    return results;
  };

  const displayResults = getFilteredResults();

  const riskLevelColors = {
    high: "#FF3B30",
    medium: "#FF9500",
    low: "#34C759",
    default: "#AEAEB2",
  };

  function cleanDiagnosisText(diagnosisText) {
    try {
      if (!diagnosisText) return null;
      if (typeof diagnosisText === "string") {
        try {
          const parsed = JSON.parse(
            diagnosisText.replace(/NULL/g, "null").replace(/'/g, '"')
          );
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          return extractDiagnosesFromString(diagnosisText);
        }
      }
      return null;
    } catch (error) {
      console.error("Error processing diagnosis text:", error);
      return null;
    }
  }

  function extractDiagnosesFromString(text) {
    const matches = text.match(/suspected to have (.+?)\./gi) || [];
    const diseases = matches.map((m) => {
      const diseaseMatch = m.match(/suspected to have (.+?)\./i);
      return diseaseMatch ? diseaseMatch[1] : m;
    });

    if (diseases.length === 0) return null;
    if (diseases.length === 1) return `Suspected to have ${diseases[0]}.`;

    return `${diseases.slice(0, -1).join(", ")} and ${diseases.slice(-1)}.`;
  }

  const getRiskColor = (riskLevel) => {
    if (!riskLevel) return riskLevelColors.default;
    const lowerCaseRisk = riskLevel.toLowerCase();
    if (lowerCaseRisk.includes("high")) return riskLevelColors.high;
    if (lowerCaseRisk.includes("medium") || lowerCaseRisk.includes("mid"))
      return riskLevelColors.medium;
    if (lowerCaseRisk.includes("low")) return riskLevelColors.low;
    return riskLevelColors.default;
  };

  return (
    <div className="main-search">
      <div className={displayResults.length > 0 ? "search active" : "search"}>
        <IoMdSearch className="icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search patient by ID or name"
          value={query}
          onChange={handleSearch}
        />

        {query && results.length > 0 && (
          <div className="filter">
            <div
              className={`filter-option ${
                activeFilter === "all" ? "active-filter" : ""
              }`}
              onClick={() => setActiveFilter("all")}
            >
              All ({results.length})
            </div>
            <div
              className={`filter-option ${
                activeFilter === "highRisk" ? "active-filter" : ""
              }`}
              onClick={() => setActiveFilter("highRisk")}
            >
              High Risk (
              {
                results.filter(
                  (p) =>
                    p.explanations?.[p.explanations.length - 1]?.risklevel ===
                    "High"
                ).length
              }
              )
            </div>
          </div>
        )}

        {displayResults.length > 0 && (
          <div className="search-results">
            {displayResults.map((patient) => {
              const latestRisk =
                patient?.explanations?.[patient.explanations.length - 1]
                  ?.risklevel;
              const riskColor = getRiskColor(latestRisk);

              const diagnosisText = cleanDiagnosisText(
                patient?.labworks?.[patient.labworks.length - 1]?.diagnosis
              );
              const hasDiagnosis =
                diagnosisText !== null &&
                diagnosisText !== "No suspected diseases";

              return (
                <div
                  key={patient.id}
                  className="search-result-item"
                  onClick={() => handleSelect(patient)}
                >
                  <div className="details">
                    <div className="result-name">{patient.name}</div>
                    <div className="result-id">{patient.patientId}</div>
                    <div
                      className="risk"
                      style={{
                        backgroundColor: `${riskColor}10`,
                        color: riskColor,
                      }}
                    >
                      <div
                        className="dot"
                        style={{ backgroundColor: riskColor }}
                      ></div>
                      {latestRisk || "Pending"}
                    </div>
                    <IoIosWarning
                      className="warn"
                      style={{
                        color: hasDiagnosis ? riskColor : "#FF9500",
                        backgroundColor: hasDiagnosis
                          ? "transparent"
                          : "#FF950020",
                        borderRadius: "50%",
                        padding: "2px",
                        margin: "auto",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* <div
        className="notification"
        style={{ cursor: "pointer" }}
        onClick={openMail}
        data-tooltip-id="my-search-tooltip"
        data-tooltip-content="Email us for feedback at support@mobileuurka.com"
      >
        <IoChatbubbleEllipsesOutline />
      </div>
      <Tooltip
        id="my-search-tooltip"
        style={{ fontSize: ".8em", zIndex: "9999" }}
      /> */}

      <div className="profile">
        <div className="circle">
          <div className="profile-image">
            {currentUser?.profile ? (
              <img
                src={`${SERVER}${currentUser.profile}`}
                alt="Profile"
                crossOrigin="use-credentials"
              />
            ) : (
              <div>
                {currentUser?.name &&
                  currentUser.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="details">
          <div className="name">{currentUser?.name}</div>
          <div className="role">{currentUser?.role}</div>
        </div>
      </div>
    </div>
  );
}

export default MainSearch;
