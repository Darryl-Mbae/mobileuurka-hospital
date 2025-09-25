import React, { useEffect, useState } from "react";
import { RiSearchLine } from "react-icons/ri";
import { IoDocumentTextOutline, IoWarningOutline, IoClose } from "react-icons/io5";
import "./css/Document.css";
import { IoIosWarning, IoMdAdd } from "react-icons/io";
import { useSelector } from "react-redux";
import { FaShieldAlt, FaImage } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Document from "./Document";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
};

const Documents = ({ setDocument, setActiveTitle, patient, document }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const users = useSelector((s) => s.user.users);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const riskLevelColors = {
    high: "#FF3B30",
    mid: "#FF9500",
    low: "#34C759",
    default: "#AEAEB2",
  };

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

  const handleAddDocument = () => {
    // Navigate to Screening for adding documents
    navigate("/Screening", {
      state: {
        patientId: patient?.id,
        returnTo: "documents",
        // internalTab: 1, // Documents/screening tab
      },
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

  // Helper function to get the correct date field based on document type
  const getDocumentDate = (item, title) => {
    if (title === "AI Analysis") {
      // SymptomReasoningReport uses created_at or updated_at
      return item.created_at || item.updated_at || item.date || item.timestamp;
    } else {
      // Triage, Lab Work, Pregnancy Journey, Infections use date or updatedAt
      return item.date || item.updatedAt || item.updated_at || item.timestamp;
    }
  };

  const buildRecord = (array, title) => {
    // Handle case where array might not be an array (like SymptomReasoningReport)
    if (!array) return [];

    // If it's not an array, make it an array
    const dataArray = Array.isArray(array) ? array : [array];

    return (
      dataArray.map((item) => {
        let result = "";

        if (title === "Lab Work") {
          result = item.diagnosis || "No diagnosis";
        }

        if (title === "Infections") {
          const resultMessage = generateInfectionMessage(item);
          result = resultMessage || "No Positive infections";
        }
        if (title === "AI Analysis") {
          // For AI Analysis, show a summary of the risk level and key findings
          const record = item.records?.[0] || item;
          if (record.risk_level) {
            result = `Risk Level: ${record.risk_level}`;
          } else {
            result = "AI Analysis Available";
          }
        }

        if (title === "Ultrasound") {
          if (item.imageUrl) {
            result += "";
          }
        }

        if (title === "Pregnancy Journey") {
          // Match explanations by visit_id
          const relatedExplanations = patient?.explanations?.filter((exp) => {
            const expDate = new Date(exp.date).toISOString().split("T")[0];
            const itemDate = new Date(item.date).toISOString().split("T")[0];
            return expDate === itemDate;
          });

          // Join risk_levels found
          result = relatedExplanations?.length
            ? relatedExplanations
                .map((exp) => exp.risklevel || "No risk level")
                .join(", ")
            : "No explanations";
        }

        // Get the appropriate date field for this document type
        const documentDate = getDocumentDate(item, title);

        return {
          title,
          // visit_id: item.id || "-",
          date_of_visit: documentDate || "N/A",
          editor: item.editor || getUserName(item.user_id),
          source: item,
          result,
          // Add raw date for sorting
          sortDate: documentDate ? new Date(documentDate) : new Date(0),
          // Add image info for ultrasounds
          hasImage: title === "Ultrasound" && item.imageUrl,
          imageUrl: item.imageUrl,
        };
      }) || []
    );
  };
  // Combine all patient data arrays into one flat record list
  const realRecords = [
    ...buildRecord(patient?.triages, "Triage"),
    ...buildRecord(patient?.labworks, "Lab Work"),
    ...buildRecord(patient?.currentPregnancies, "Pregnancy Journey"),
    ...buildRecord(patient?.infections, "Infections"),
    ...buildRecord(patient?.ultrasounds, "Ultrasound"),
    ...buildRecord(patient?.SymptomReasoningReport, "AI Analysis"),
  ];

  // Sort records by date (latest first) and then filter
  const sortedRecords = realRecords.sort((a, b) => {
    // Sort by date descending (latest first)
    return b.sortDate - a.sortDate;
  });

  const filteredRecords = sortedRecords.filter((record) =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase())
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
    totalItems: filteredRecords.length,
    initialItemsPerPage: 7,
    initialPage: 1,
  });

  const currentPageRecords = getPaginatedData(filteredRecords);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    handlePageChange(1); // Reset to first page when searching
  };

  const handleImageClick = (imageUrl, e) => {
    e.stopPropagation(); // Prevent document click
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <div id="notes" className="content doc">
      {document?.title ? (
        <>
          <Document
            document={document?.source}
            title={document?.title}
            patient={patient}
            onBack={() => setDocument(null)}
          />
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
            <div className="button" onClick={handleAddDocument}>
              <IoMdAdd />
              {isMobile ? "" : "Add Document"}
            </div>
          </div>
          <div
            className="med-grid"
            style={{
              overflowX: "scroll",
            }}
          >
            <div className="documents new">
              <div className="title">
                <div className="title-name">Name</div>
                <div className="Editor">Editor</div>
                <div className="date">Date</div>
                <div className="date">Analysis</div>
              </div>

              {currentPageRecords.map((record, index) => (
                <div
                  key={index}
                  className="record"
                  onClick={() => setDocument(record)}
                >
                  <div className="doc">
                    <div className="icon">
                      {record.title === "Ultrasound" && record.hasImage ? (
                        <IoDocumentTextOutline />
                      ) : (
                        <IoDocumentTextOutline />
                      )}
                    </div>
                    <div className="details">
                      <div className="doc-name">
                        {record.title}

                      </div>
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
                                            {record.hasImage && (
                          <span 
                            style={{ 
                              marginLeft: "8px", 
                              fontSize: "12px",
                              display:"flex",
                              flexDirection:"row",
                              alignItems:"center",
                              gap:"10px", 
                              cursor: "pointer"
                              

                            }}
                            onClick={(e) => handleImageClick(record.imageUrl, e)}
                          >
                            <FaImage />

                            View Image
                          </span>
                        )}
                    {/* {renderResult(record)} */}
                    {/* {record.hasImage && (
                      <img
                        src={record.imageUrl}
                        alt="Ultrasound thumbnail"
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          marginLeft: "10px",
                          cursor: "pointer",
                          border: "1px solid #ddd"
                        }}
                        onClick={(e) => handleImageClick(record.imageUrl, e)}
                      />
                    )} */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Pagination Component */}
          {filteredRecords?.length > 0 && (
            <Pagination
              width="125%"
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
        </>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="image-modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
            padding: "20px"
          }}
          onClick={closeImageModal}
        >
          <div 
            className="image-modal-content"
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#666",
                zIndex: 1001
              }}
            >
              <IoClose />
            </button>
            <img
              src={selectedImage}
              alt="Ultrasound"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "4px"
              }}
            />
            <div style={{
              marginTop: "10px",
              textAlign: "center",
              color: "#666",
              fontSize: "14px"
            }}>
              Ultrasound Image - Click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
