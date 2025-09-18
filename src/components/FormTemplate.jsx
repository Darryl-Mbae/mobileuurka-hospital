import React, { useEffect } from "react";
import "../css/FormTemplate.css";

const FormTemplate = ({
  title = "Health Record",
  patientData = {},
  setSelection,
  onContextMenu,
  formData = {},
  organizationName = "Mobileuurka",
  logoSrc = "/logo.png",
  children,
  comments = [],
  showPatientInfo = true,
  className = "",
}) => {

  console.log(comments)

  useEffect(() => {
    const handleMouseUp = (e) => {
      // 🚫 Don't clear if clicking inside the context menu
      if (e.target.closest(".context-menu")) return;

      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        setSelection(sel.toString()); // keep the selection
      } else {
        setSelection(null); // clear only if outside
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setSelection]);

  // Only highlight text that has been commented on
  const highlightText = (text, comments) => {
    if (!text) return "";

    let highlighted = text;

    comments.forEach((c) => {
      if (c.selection) {
        const cleanSelection = c.selection.trim();

        if (!cleanSelection) return;

        const safe = cleanSelection.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const regex = new RegExp(`(${safe})`, "gi");

        highlighted = highlighted.replace(
          regex,
          `<span class="highlighted-text">$1</span>`
        );
      }
    });

    return highlighted;
  };



  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to render field value
  const renderFieldValue = (value) => {
    if (!value) return <span className="empty-value">—</span>;

    const highlightText = (text, comments) => {
      let result = text;
      comments.forEach((c) => {
        if (c.selection) {
          const regex = new RegExp(c.selection, "g");
          result = result.replace(
            regex,
            `<span class="highlighted-text">${c.selection}</span>`
          );
        }
      });
      return result;
    };

    return (
      <span
        dangerouslySetInnerHTML={{
          __html: highlightText(String(value), comments),
        }}
      />
    );
  };


  // Sample data structure - you can pass real data via props
  const defaultPatientData = {
    name: "John Doe",
    patientId: "P-2024-001",
    dateOfBirth: "1985-06-15",
    gender: "Male",
    phone: "+1 (555) 123-4567",
    email: "john.doe@email.com",
    address: "123 Main Street, City, State 12345",
    emergencyContact: "Jane Doe - (555) 987-6543",
    ...patientData,
  };

  const defaultFormData = {
    recordDate: new Date().toISOString(),
    recordType: "General Health Assessment",
    provider: "Dr. Smith",
    department: "Internal Medicine",
    ...formData,
  };

  return (
    <div
      className={`form-template ${className}`}
      onContextMenu={(e) => {
        e.preventDefault(); // stop default browser menu

        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && onContextMenu) {
          onContextMenu(sel.toString(), e.clientX, e.clientY);
        }
      }}
    >
      {/* Header Section */}
      <div className="header">
        <div className="logo">
          <div className="image">
            <img src={logoSrc} alt="logo" />
          </div>
          <div className="org-info">
            <h3>{organizationName}</h3>
            <p>Healthcare Services</p>
          </div>
        </div>
        <div className="document-info">
          <h2>{title}</h2>
          <p className="record-date">
            Date: {formatDate(defaultFormData.recordDate)}
          </p>
        </div>
      </div>

      {/* Patient Information Section - Only show when requested */}
      {showPatientInfo && (
        <div className="section">
          <h3 className="section-title">Patient Information</h3>
          <div className="grid patient-grid">
            <div className="field-group">
              <label>Full Name</label>
              <div className="field-value">
                {renderFieldValue(defaultPatientData.name)}
              </div>
            </div>
            <div className="field-group">
              <label>Patient ID</label>
              <div className="field-value">
                {renderFieldValue(defaultPatientData.patientId)}
              </div>
            </div>
            <div className="field-group">
              <label>Phone Number</label>
              <div className="field-value">
                {renderFieldValue(defaultPatientData.phone)}
              </div>
            </div>
            <div className="field-group">
              <label>Email Address</label>
              <div className="field-value">
                {renderFieldValue(defaultPatientData.email)}
              </div>
            </div>
          </div>
          <div className="field-group full-width">
            <label>Address</label>
            <div className="field-value">
              {renderFieldValue(defaultPatientData.address)}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Content Section */}
      {children ? (
        children
      ) : (
        <div className="section">
          <h3 className="section-title">Health Information</h3>
          <div className="content-area">
            {/* This area can be populated with dynamic content based on the record type */}
            <div className="placeholder-content">
              <p>
                This section will display specific health information based on
                the record type and data provided.
              </p>
              <div className="grid health-grid">
                <div className="field-group">
                  <label>Blood Pressure</label>
                  <div className="field-value">120/80 mmHg</div>
                </div>
                <div className="field-group">
                  <label>Heart Rate</label>
                  <div className="field-value">72 bpm</div>
                </div>
                <div className="field-group">
                  <label>Temperature</label>
                  <div className="field-value">98.6°F</div>
                </div>
                <div className="field-group">
                  <label>Weight</label>
                  <div className="field-value">70 kg</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <div className="footer">
        <div className="signature-section">
          <div className="signature-box">
            <div className="signature-line"></div>
            <label>Healthcare Provider Signature</label>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <label>Date</label>
          </div>
        </div>
        <div className="footer-info">
          <p>
            This document is confidential and contains protected health
            information.
          </p>
          <p>
            Generated on {new Date().toLocaleDateString()} at{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormTemplate;