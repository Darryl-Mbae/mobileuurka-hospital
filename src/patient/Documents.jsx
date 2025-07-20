import React, { useEffect, useState } from "react";
import { RiSearchLine } from "react-icons/ri";
import { IoDocumentTextOutline, IoWarningOutline } from "react-icons/io5";
import "./css/Document.css";
import { IoIosWarning, IoMdAdd } from "react-icons/io";
import { useSelector } from "react-redux";
import { FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Document from "./Document";

const Documents = ({ setDocument, setActiveTitle, patient, document }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const users = useSelector((s) => s.user.users);
  const navigate = useNavigate();

  console.log(document.title);

  const riskLevelColors = {
    high: "#FF3B30",
    mid: "#FF9500",
    low: "#34C759",
    default: "#AEAEB2",
  };

  const formatDiagnosis = (raw) => {
    if (!raw || typeof raw !== "string") return "No diagnosis";

    // Extract quoted parts: "..." only
    const matches = raw.match(/"([^"]+)"/g);
    const diagnoses = matches?.map((m) => m.replace(/"/g, "")) || [];

    if (diagnoses.length === 0) return "No diagnosis";

    // Remove duplicates & trim
    const cleaned = [...new Set(diagnoses.map((d) => d.trim()))];

    // Normalize prefix if all start with "Suspected to have" or similar
    const prefix = "Suspected to have ";
    const prefixPattern = /^((Highly )?suspected to have\s)/i;

    const diseases = cleaned.map((d) =>
      d.replace(prefixPattern, "").replace(/\.$/, "").trim()
    );

    // Join disease names
    const joinedDiseases =
      diseases.length > 1
        ? diseases.slice(0, -1).join(", ") +
          " and " +
          diseases[diseases.length - 1]
        : diseases[0];

    return prefix + joinedDiseases;
  };

  const renderRiskLevel = (risk) => {
    const key = risk?.toLowerCase();
    const color = riskLevelColors[key] || riskLevelColors.default;
    const icon =
      key === "high" || key === "mid" ? <IoWarningOutline /> : <FaShieldAlt />;
    const label = risk?.charAt(0).toUpperCase() + risk?.slice(1).toLowerCase();

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        {/* <div className="dot" style={{ backgroundColor: color }}></div> */}
        <span>{`Risk level of patient is ${label}` || "Unknown"}</span>
      </div>
    );
  };

  // FINAL formatter to use in JSX
  const renderResult = (record) => {
    if (record.title === "Pregnancy Journey") {
      return renderRiskLevel(record.result);
    }

    if (record.title === "Lab Work") {
      return <span>{formatDiagnosis(record.result)}</span>;
    }

    return <span>{record.result}</span>;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleAddDocument = () => {
    // Navigate to Screening for adding documents
    navigate("/Screening", { 
      state: { 
        patientId: patient?.id,
        returnTo: 'documents'
      } 
    });
  };

  const getUserName = (user_id) => {
    const user = users.find((u) => u.user_id === user_id);
    return user ? user.name : "System";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  function generateInfectionMessage(item) {
    const infectionFields = {
      hiv: "HIV",
      syphilis: "Syphilis",
      hepB: "Hepatitis B",
      hepC: "Hepatitis C",
      rubella: "Rubella",
    };

    let positives = [];

    for (const key in infectionFields) {
      if (item[key] === "Positive") {
        positives.push(infectionFields[key]);
      }
    }

    if (positives.length > 0) {
      return `Positive Infections: ${positives.join(", ")}`;
    } else {
      return "✅ No positive infections";
    }
  }

  const buildRecord = (array, title) =>
    array?.map((item) => {
      let result = "";

      if (title === "Lab Work") {
        result = item.diagnosis || "No diagnosis";
      }

      if (title === "Infections") {
        const resultMessage = generateInfectionMessage(item);
        result = resultMessage || "No Positive infections";
      }

      if (title === "Pregnancy Journey") {
        // Match explanations by visit_id
        const relatedExplanations = patient?.explanations?.filter(
          (exp) => exp.visit_id === item.visit_id
        );

        // Join risk_levels found
        result = relatedExplanations?.length
          ? relatedExplanations
              .map((exp) => exp.risk_level || "No risk level")
              .join(", ")
          : "No explanations";
      }

      return {
        title,
        // visit_id: item.id || "-",
        date_of_visit: item.date || item.timestamp || "N/A",
        editor: getUserName(item.user_id),
        source: item,
        result,
      };
    }) || [];

  // Combine all patient data arrays into one flat record list
  const realRecords = [
    ...buildRecord(patient?.triages, "Triage"),
    ...buildRecord(patient?.labworks, "Lab Work"),
    ...buildRecord(patient?.pregnancies, "Pregnancy Journey"),
    ...buildRecord(patient?.infections, "Infections"),
  ];

  const filteredRecords = realRecords.filter((record) =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="notes" className="content">
      {document?.title ? (
        <>
        <Document document={document?.source} title={document?.title}/>
        </>
      ) : (
        <>
          <div className="con">
            <div className="search-input">
              <RiSearchLine />
              <input
                type="search"
                id="searchInputs"
                name="search"
                placeholder="Search Document"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="button">
              <IoMdAdd />
              Add Document
            </div>
          </div>

          <div className="documents new">
            <div className="title">
              <div className="title-name">Name</div>
              <div className="Editor">Editor</div>
              <div className="date">Date</div>
              <div className="date">Analysis</div>
            </div>

            {filteredRecords.map((record, index) => (
              <div
                key={index}
                className="record"
                onClick={() => setDocument(record)}
              >
                <div className="doc">
                  <div className="icon">
                    <IoDocumentTextOutline />
                  </div>
                  <div className="details">
                    <div className="doc-name">{record.title}</div>
                    <div className="doc-visit">{record.visit_id}</div>
                  </div>
                </div>
                <div className="doc-editor">{record.editor}</div>
                <div className="date">{formatDate(record.date_of_visit)}</div>
                <div className="result">
                  {record.result !== "" && (
                    <IoIosWarning
                      className="warn"
                      style={{
                        color: "#FF9500",
                        backgroundColor: "#FF950020",
                        borderRadius: "50%",
                        padding: "2px",
                        marginRight: "10px",
                      }}
                    />
                  )}
                  {renderResult(record)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Documents;
