import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addPatient, updatePatient } from "../reducers/Slices/patientsSlice.js";
import MainSearch from "../components/MainSearch";
import "../css/Patient.css";
import {
  validatePatientData,
  createEmptyPatient,
  safePatientFields,
  safeGet,
  safeArray,
} from "../utils/patientDataGuard.js";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { IoFlagSharp } from "react-icons/io5";
import defaultImg from "../assets/images/Default.png";
import { Tooltip } from "react-tooltip";
import { LuBell } from "react-icons/lu";
import Chat from "../components/Chat";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Overview from "../patient/Overview";
import Profile from "../patient/Profile";
import Medication from "../patient/Medication";
import Documents from "../patient/Documents";
import Notes from "../patient/Notes";
import Document from "../patient/Document";
import Note from "../patient/Note";
import Notepad from "./Notepad";
import { FaRegCopy } from "react-icons/fa";
import { TiTick } from "react-icons/ti";
import { HiBellAlert, HiMiniPencilSquare } from "react-icons/hi2";
import Alerts from "../dialog/Alerts.jsx";
import { FaRegBell } from "react-icons/fa6";
import { FiChevronDown } from "react-icons/fi";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

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

const Patient = ({ id }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [alerts, setAlerts] = useState();
  const currentUser = useSelector((s) => s.user.currentUser);
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState("Summary"); // "Sabi", "Summary", "Analytics"
  const [open, setOpen] = useState(false);

  const options = ["Sabi", "Summary", "Analytics"];
  const [profilePic, setProfilePic] = useState(defaultImg);
  const [chatActive, setChatActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [document, setDocument] = useState([]);
  const [note, setNote] = useState("");
  const [nextVisitChange, setNextVisitChange] = useState(false);
  const [nextVisitValue, setNextVisitValue] = useState(null);
  const SERVER = import.meta.env.VITE_SERVER_URL;

  // Get patient from Redux store with safety validation
  const rawPatient = useSelector((state) =>
    state.patient?.patients?.find((p) => p.id === id)
  );

  // Validate and ensure safe patient data
  const { isValid, safePatient } = validatePatientData(rawPatient);
  const patient = isValid ? safePatient : createEmptyPatient();

  useEffect(() => {
    if (id) {
      // Only fetch if patient is not in Redux store or is invalid
      if (!rawPatient || !isValid) {
        fetchPatientById(id);
      }
    }
  }, [id, rawPatient, isValid]);

  const alertsRef = useRef();

  const handleShowAlert = () => {
    alertsRef.current.show();
  };

  const handleNextVisitChange = (nextVisitValue) => {
    if (!nextVisitValue) return;

    // Format the date nicely: e.g., "Thursday, 9 September 2025"
    const formattedDate = new Date(nextVisitValue).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const confirmed = window.confirm(
      `Are you changing the next visit to ${formattedDate}?`
    );
    if (confirmed) {
      console.log(patient);
      console.log(patient.visits);
      console.log(patient.visits.length);

      const id = patient.visits[patient?.visits?.length - 1].id;
      handleSubmitVisit(id, nextVisitValue);
    }
  };

  const handleSubmitVisit = async (id, nextVisitValue) => {
    // Prepare data to send
    const updateData = {
      nextVisit: nextVisitValue, // you can send as ISO string or timestamp depending on backend
    };
    try {
      const response = await fetch(`${SERVER}/patients/medical/visit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
    }
  };

  const fetchPatientById = async (patientId) => {
    setLoading(true);
    setError(null);

    try {
      const { apiGet } = await import("../config/api.js");
      const patientData = await apiGet(`/patients/${patientId}`);

      // Check if patient already exists in store
      if (patient) {
        dispatch(updatePatient(patientData));
      } else {
        dispatch(addPatient(patientData));
      }
    } catch (err) {
      console.error("Error fetching patient:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Copy patient ID to clipboard
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(patient?.id?.toString() || "");
      setCopied(true);
      // Reset the tick icon after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy patient ID:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = patient?.id?.toString() || "";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Mobile Header Component
  const MobileHeader = () => (
    <div className="mobile-header">
      <div className="patient-info">
        <div className="patient-name">{patient?.name || "Loading..."}</div>
      </div>

      <div className="header-controls">
        {/* Tab switcher for Analytics view */}
        {mobileView === "Analytics" && (
          <div className="tab-switcher">
            <FormControl
              size="small"
              sx={{
                minWidth: 100,
                backgroundColor: "white",
                borderRadius: 1,

                "& .MuiInputBase-input": {
                  fontSize: ".9em",
                },
              }}
            >
              <Select
                value={activeTab}
                onChange={(e) => {
                  const value = e.target.value;
                  setActiveTab(value);
                  if (value === "documents") {
                    setDocument([]);
                  }
                }}
              >
                <MenuItem value="overview">Overview</MenuItem>
                <MenuItem value="profile">Profile</MenuItem>
                <MenuItem value="medication">Medication</MenuItem>
                <MenuItem value="documents">Documents</MenuItem>
                <MenuItem value="notes">Notes</MenuItem>
              </Select>
            </FormControl>
          </div>
        )}

        {/* Page switcher dropdown (converted to MUI Select) */}
        <div className="page-switcher">
          <FormControl
            size="small"
            sx={{
              minWidth: 100,
              backgroundColor: "white",
              borderRadius: 1,

              "& .MuiInputBase-input": {
                fontSize: ".9em",
              },
            }}
          >
            <Select
              value={mobileView}
              onChange={(e) => setMobileView(e.target.value)}
              IconComponent={FiChevronDown} // keep your chevron style
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="patient-page">
        <div className="loading">
          <div className="image">
            <img src="/logo.png" alt="" />
          </div>
          <DotLottieReact
            src="https://lottie.host/76c8d5c4-8758-498c-8e7c-6acce91d7032/utjeKB11PP.lottie"
            loop
            autoplay
            style={{ width: "70%", margin: "-20px auto" }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-page">
        <div className="error">
          <h3>Error Loading Patient</h3>
          <p>{error}</p>
          <button onClick={() => fetchPatientById(id)} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!rawPatient && !loading) {
    return (
      <div className="patient-page">
        <div className="no-patient">
          <p>No patient selected or patient not found</p>
        </div>
      </div>
    );
  }

  const calculateAge = (dob) => {
    return safePatientFields.age({ dob });
  };

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "short" }); // "Jul"
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  const patientMainDetails = [
    isMobile
      ? {
          label: "Patient ID",
          value: (
            <span style={{ display: "flex", alignItems: "center" }}>
              {patient?.id}
              <span
                onClick={handleCopyId}
                style={{
                  cursor: "pointer",
                  marginLeft: "8px",
                  color: copied ? "#4CAF50" : "#666",
                  transition: "color 0.3s ease",
                }}
                title={copied ? "Copied!" : "Copy ID"}
              >
                {copied ? <TiTick /> : <FaRegCopy />}
              </span>
            </span>
          ),
        }
      : null,
    { label: "Age", value: calculateAge(patient?.dob) },
    {
      label: "Gravida + Parity",
      value: patient?.patientHistories?.[0]
        ? `${patient.patientHistories[0].gravida}+${patient.patientHistories[0].parity}`
        : "Undefined",
    },
    {
      label: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            gap: "10px",
          }}
        >
          Blood Type{" "}
          {patient?.rh === "-" && (
            <IoFlagSharp
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Anti-D immunoglobulin should be administered between 28–30 weeks gestation if not already given."
              color="red"
            />
          )}
        </span>
      ),
      value: `${patient?.bloodgroup}${patient?.rh}`,
    },
    {
      label: "Visit Reason",
      value: patient?.visits?.[patient.visits.length - 1]?.visitReason ?? "-",
    },
    {
      label: "Last Visit",
      value: patient?.visits?.length
        ? formatDate(patient.visits[patient.visits.length - 1]?.date) || "-"
        : "-",
    },
    {
      label: "Visit Number",
      value: patient?.visits?.[patient.visits.length - 1]?.visitNumber ?? "-",
    },
    {
      label: "Next Visit",
      value:
        nextVisitValue || patient?.visits?.length
          ? formatDate(patient?.visits?.[patient.visits.length - 1]?.nextVisit)
          : "-",
    },
    {
      label: "Estimated Due date",
      value: new Date(
        patient?.patientHistories?.[patient.patientHistories.length - 1]
          ?.estimatedDueDate ?? "-"
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  ];

  const lifestyle = [
    {
      label: "Alcohol Consumption",
      value:
        patient?.lifestyles?.[patient?.lifestyles.length - 1]
          ?.alcoholConsumption || "None",
    },
    {
      label: "Smoking",
      value:
        patient?.lifestyles?.[patient?.lifestyles.length - 1]?.smoking ||
        "None",
    },
    {
      label: "Caffeine Intake",
      value:
        patient?.lifestyles?.[patient?.lifestyles.length - 1]?.caffeine ===
        "Yes"
          ? [
              `${
                patient?.lifestyles?.[
                  patient?.lifestyles.length - 1
                ]?.caffeineSources?.join(", ") || "Not specified"
              }`,
            ]
          : "None",
    },
    {
      label: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            gap: "10px",
          }}
        >
          Diet{" "}
          {patient?.lifestyles?.[patient?.lifestyles.length - 1]?.diet ===
            "Vegan" && (
            <IoFlagSharp
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Patient is vegan — consider testing for Vitamin B12"
              color="red"
            />
          )}
        </span>
      ),
      value:
        patient?.lifestyles?.[patient?.lifestyles.length - 1]?.diet ||
        "Not specified",
    },
    {
      label: "Exercise ",
      value:
        patient?.lifestyles?.[patient?.lifestyles.length - 1]?.exercise !==
        undefined
          ? `${patient.lifestyles[0].exercise} ${
              patient.lifestyles[0].exercise > 1 ? "hrs" : "hr"
            }`
          : "Not specified",
    },
    {
      label: "Sugary Drinks",
      value:
        patient?.lifestyles?.[patient?.lifestyles.length - 1]?.sugarDrink ||
        "None",
    },
  ];

  const defaultAllergies = [
    { label: "Medication", value: "None" },
    { label: "Food", value: "None" },
    { label: "Environment", value: "No reaction" },
  ];

  // Process the allergies from patient data
  const processAllergies = () => {
    const processedAllergies = JSON.parse(JSON.stringify(defaultAllergies));

    // Check if patient has allergies data
    if (patient?.allergies && Array.isArray(patient.allergies)) {
      patient.allergies.forEach((allergy) => {
        // Find if this allergy type already exists in our structure
        const existingType = processedAllergies.find(
          (item) => item.label === allergy.allergyType
        );

        if (existingType) {
          // If we find the type, update its value
          if (
            existingType.value === "None" ||
            existingType.value === "No reaction"
          ) {
            existingType.value = allergy.allergies;
          } else {
            existingType.value += `, ${allergy.allergies}`;
          }
        } else {
          // If it's a new allergy type, add it to the array
          processedAllergies.push({
            label: allergy.allergy_type,
            value: allergy.allergies,
          });
        }
      });
    }

    return processedAllergies;
  };

  const allergies = processAllergies();

  const renderSection = (title, items) => (
    <section>
      <h4>{title}</h4>
      <div className="container">
        {items.map((item, index) => (
          <div className="list" key={index}>
            <div
              className="label"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              {item.label}
              {item.label === "Next Visit" && (
                <HiMiniPencilSquare
                  style={{ cursor: "pointer", color: "#585858" }}
                  onClick={() => handleEditNextVisit(item.value)}
                  title="Edit Next Visit"
                />
              )}
            </div>
            <div className="value">
              {/* Add this conditional rendering */}
              {item.label === "Next Visit" && nextVisitChange ? (
                <input
                  type="date"
                  className="special-date"
                  style={{
                    border: "none",
                  }}
                  defaultValue={
                    new Date(
                      patient?.visits?.[patient.visits.length - 1]?.nextVisit
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                  onBlur={(e) => {
                    // Handle the date change here
                    setNextVisitValue(e.target.value);
                    setNextVisitChange(false); // Hide the input after editing
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setNextVisitValue(e.target.value);
                      setNextVisitChange(false);
                    }
                  }}
                  onChange={(e) => handleNextVisitChange(e.target.value)}
                  autoFocus
                />
              ) : (
                item.value
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // Handler function to handle the edit click
  const handleEditNextVisit = (currentValue) => {
    setNextVisitChange(true); // This will show the date input
  };

  return (
    <div className="patient-container">
      <Tooltip id="my-tooltip" style={{ fontSize: ".8em", zIndex: "9999" }} />
      <MainSearch />
      {isMobile ? (
        <div className="patient mobile-patient">
          {/* Mobile Header - Consistent across all views */}
          <MobileHeader />

          {/* Mobile Content */}
          <div className="mobile-content">
            {mobileView === "Analytics" && (
              <div className="detail">
                <div className="tabs">
                  {patient?.name ? (
                    <div className="tab">
                      {activeTab === "overview" && (
                        <Overview
                          patient={patient}
                          setActiveTab={setActiveTab}
                        />
                      )}
                      {activeTab === "profile" && <Profile patient={patient} />}
                      {activeTab === "medication" && (
                        <Medication
                          setActiveTab={setActiveTab}
                          patient={patient}
                        />
                      )}
                      {activeTab === "documents" && (
                        <Documents
                          setActiveTitle={setActiveTab}
                          setDocument={setDocument}
                          document={document}
                          patient={patient}
                        />
                      )}
                      {activeTab === "notes" && (
                        <Notes
                          setActiveTitle={setActiveTab}
                          setNotes={setNote}
                          patient={patient}
                        />
                      )}
                      {activeTab === "document" && (
                        <Document document={document} />
                      )}
                      {activeTab === "note" && (
                        <Note note={note} user={currentUser} />
                      )}
                      {activeTab === "notepad" && (
                        <Notepad patient={patient} user={currentUser} />
                      )}
                    </div>
                  ) : (
                    <div className="loading">
                      <div className="image">
                        <img src="/logo.png" alt="" />
                      </div>
                      <DotLottieReact
                        src="https://lottie.host/76c8d5c4-8758-498c-8e7c-6acce91d7032/utjeKB11PP.lottie"
                        loop
                        autoplay
                        style={{ width: "70%", margin: "-20px auto" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {mobileView === "Summary" && (
              <div className="profile mobile-summary">
                <div className="profile-container">
                  {renderSection("Patient Details", patientMainDetails)}

                  {renderSection("Allergies", allergies)}
                  {renderSection("Lifestyle", lifestyle)}
                </div>
              </div>
            )}

            {mobileView === "Sabi" && (
              <div className="chat mobile-chat">
                <Chat patient={patient} user={currentUser} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={chatActive ? "patient active" : "patient"}>
          <Alerts ref={alertsRef} patient={patient} />

          <div className="profile">
            <div className="profile-container">
              <div className="profile-pic">
                <div className="width">
                  <div className="circle">
                    <img src={profilePic} alt="default" />
                  </div>
                  <div className="row-end">
                    <div className="details">
                      <div className="name">{patient?.name}</div>
                      <div className="phone">
                        {patient?.id}
                        <span
                          onClick={handleCopyId}
                          style={{
                            cursor: "pointer",
                            marginLeft: "8px",
                            color: copied ? "#4CAF50" : "#666",
                            transition: "color 0.3s ease",
                          }}
                          title={copied ? "Copied!" : "Copy ID"}
                        >
                          {copied ? <TiTick /> : <FaRegCopy />}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {renderSection("Patient Details", patientMainDetails)}
              {renderSection("Allergies", allergies)}
              {renderSection("Lifestyle", lifestyle)}
            </div>
          </div>
          <div className="detail">
            <div className="tabs">
              <div className="lists">
                <ul className="tabs-list">
                  <li
                    className={activeTab === "overview" ? "active" : ""}
                    onClick={() => setActiveTab("overview")}
                  >
                    Overview
                  </li>
                  <li
                    className={activeTab === "profile" ? "active" : ""}
                    onClick={() => setActiveTab("profile")}
                  >
                    Profile
                  </li>
                  <li
                    className={activeTab === "medication" ? "active" : ""}
                    onClick={() => setActiveTab("medication")}
                  >
                    Medication
                  </li>
                  <li
                    className={activeTab === "documents" ? "active" : ""}
                    onClick={() => {
                      setActiveTab("documents"), setDocument([]);
                    }}
                  >
                    Documents
                  </li>
                  <li
                    className={activeTab === "notes" ? "active" : ""}
                    onClick={() => setActiveTab("notes")}
                  >
                    Notes
                  </li>
                </ul>
                <div className="ai-buttons">
                  <div
                    className="notification"
                    onClick={() => handleShowAlert()}
                  >
                    <FaRegBell style={{ color: "#333" }} />
                    {patient?.alerts?.filter((alert) => !alert.read).length >
                      0 && (
                      <span className="badge">
                        {patient?.alerts.filter((alert) => !alert.read).length}
                      </span>
                    )}
                  </div>
                  <div
                    className="notification"
                    onClick={() => setChatActive((prev) => !prev)}
                  >
                    <img src="/logo.png" alt="logo" />
                  </div>
                </div>
              </div>
              {patient?.name ? (
                <div className="tab">
                  {activeTab === "overview" && (
                    <Overview patient={patient} setActiveTab={setActiveTab} />
                  )}
                  {activeTab === "profile" && <Profile patient={patient} />}
                  {activeTab === "medication" && (
                    <Medication setActiveTab={setActiveTab} patient={patient} />
                  )}
                  {activeTab === "documents" && (
                    <Documents
                      setActiveTitle={setActiveTab}
                      setDocument={setDocument}
                      document={document}
                      patient={patient}
                    />
                  )}
                  {activeTab === "notes" && (
                    <Notes
                      setActiveTitle={setActiveTab}
                      setNotes={setNote}
                      patient={patient}
                    />
                  )}
                  {activeTab === "document" && <Document document={document} />}
                  {activeTab === "note" && (
                    <Note note={note} user={currentUser} />
                  )}
                  {activeTab === "notepad" && (
                    <Notepad patient={patient} user={currentUser} />
                  )}
                </div>
              ) : (
                <div className="loading">
                  <div className="image">
                    <img src="/logo.png" alt="" />
                  </div>
                  <DotLottieReact
                    src="https://lottie.host/76c8d5c4-8758-498c-8e7c-6acce91d7032/utjeKB11PP.lottie"
                    loop
                    autoplay
                    style={{ width: "70%", margin: "-20px auto" }}
                  />
                </div>
              )}
            </div>
            {chatActive && (
              <div className="chat">
                <Chat patient={patient} user={currentUser} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Patient;
