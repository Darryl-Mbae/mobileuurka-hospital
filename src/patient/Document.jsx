import React, { useState, useRef, useEffect } from "react";
import "../patient/css/Doc.css";
import "../css/MobileFixes.css";
import { IoArrowBack, IoPrintOutline } from "react-icons/io5";
import FormTemplate from "../components/FormTemplate";
import { FaRegCommentAlt } from "react-icons/fa";

// Format object keys into readable labels
const formatKey = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (l) => l.toUpperCase());

// Helper function to format values, converting -1 to "Unknown"
const formatValue = (value) => {
  if (value === -1 || value === "-1") {
    return "Unknown";
  }
  if (value === null || value === "" || value === undefined) {
    return "Not provided";
  }
  return String(value);
};

// Format ISO date into readable string
const formatDate = (iso) => {
  if (!iso) return "Not provided";
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Format "updated_at" and similar fields to exact human readable dates
const formatHumanDate = (key, value) => {
  if (
    key.toLowerCase().includes("updated") ||
    key.toLowerCase().includes("created") ||
    key.toLowerCase().includes("date") ||
    key.toLowerCase().includes("time")
  ) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      // Always return exact date and time for printing purposes
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  }
  return value;
};

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

const Document = ({ document, title, patient ,srcolltoTop}) => {
  const [useFormTemplate, setUseFormTemplate] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const componentRef = useRef();
  const token = localStorage.getItem("access_token");
  const isMobile = useIsMobile();
  const [activateComment, setActivateComment] = useState(false);
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const [selection, setSelection] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [comments, setComments] = useState([]);
  const commentsRef = useRef(null);
  const [editingComment, setEditingComment] = useState(null);
  const [commentedSelections, setCommentedSelections] = useState(new Set());
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  // Mobile long press state
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [longPressStarted, setLongPressStarted] = useState(false);

  // Track which comment is being edited
  useEffect(() => {
    const handleClick = (e) => {
      // Don't clear selection if clicking on context menu
      if (e.target.closest(".context-menu")) {
        return;
      }

      setSelection(null);
      setContextMenuPosition(null);
    };

    window.document.addEventListener("click", handleClick);
    return () => window.document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    console.log(patient);
    const loadComments = async () => {
      if (!document?.id || !patient?.id) return;

      setIsLoadingComments(true);
      try {
        // Use the centralized API function for consistent auth handling
        const { fetchWithAuth } = await import("../config/api.js");
        const response = await fetchWithAuth(
          `${SERVER}/patients/${patient.id}/medical/comments`
        );

        if (response.ok) {
          const loadedComments = await response.json();
          console.log("Comments loaded:", loadedComments);

          setComments(loadedComments.records);

          // Rebuild commentedSelections set
          const selections = new Set(
            loadedComments.records.map((comment) => comment.selection)
          );
          setCommentedSelections(selections);
        } else {
          console.error("Failed to load comments");
          setComments([]);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    };

    loadComments();
  }, [document?.id, patient]);




  // Mobile long press handlers
  const handleTouchStart = (e) => {
    if (!isMobile) return;

    setLongPressStarted(true);
    const timer = setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        const touch = e.touches[0];
        handleContextMenu(selectedText, touch.clientX, touch.clientY);
        setLongPressStarted(false);
      }
    }, 800); // Increased to 800ms for easier mobile interaction

    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressStarted(false);
  };

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressStarted(false);
  };

  // Handle text selection and context menu positioning
  const handleContextMenu = (selectedText, clientX, clientY) => {
    if (selectedText && componentRef.current) {
      const containerRect = componentRef.current.getBoundingClientRect();
      const relativeY =
        clientY - containerRect.top + componentRef.current.scrollTop;

      setSelection(selectedText);
      setContextMenuPosition({
        x: clientX,
        y: clientY, // Keep viewport coordinates for context menu
        relativeY: relativeY, // Store relative position for comment placement
      });
    }
  };

  // Desktop right-click handler
  const handleRightClick = (e) => {
    if (isMobile) return; // Skip on mobile

    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
      handleContextMenu(selectedText, e.clientX, e.clientY);
    }
  };

  // Fixed add comment handler
  const handleAddComment = (e) => {
    e.stopPropagation();

    if (selection && contextMenuPosition && componentRef.current) {
      // Calculate relative Y position within the document
      const containerRect = componentRef.current.getBoundingClientRect();
      const relativeY = contextMenuPosition.relativeY;

      // Calculate percentage-based position for better persistence across different screen sizes
      const documentHeight = componentRef.current.scrollHeight;
      const yPercentage = (relativeY / documentHeight) * 100;

      const newComment = {
        id: Date.now(),
        text: "",
        selection: selection.trim(),
        y: relativeY, // Absolute position for current session
        yPercentage: yPercentage, // Percentage for persistence
        documentId: document?.id,
        patientId: patient?.id,
        isEditing: true,
        createdAt: new Date().toISOString(),
      };

      console.log("Creating comment with coordinates:", {
        selection: newComment.selection,
        absoluteY: relativeY,
        percentageY: yPercentage,
        documentHeight,
      });

      setComments((prev) => [...prev, newComment]);
      setEditingComment(newComment.id);
      setCommentedSelections((prev) => new Set([...prev, selection.trim()]));
      setSelection(null);
      setContextMenuPosition(null);



      // On mobile, auto-open comments panel and scroll to top
      if (isMobile) {

        setActivateComment(true);
        srcolltoTop()

      }
    }
  };

  // Remove comment handler
  const handleRemoveComment = async (commentId) => {
    try {
      console.log("Deleting comment:", commentId);

      // Use the centralized API function for consistent auth handling
      const { fetchWithAuth } = await import("../config/api.js");
      const response = await fetchWithAuth(
        `${SERVER}/patients/medical/comments/${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }

      console.log("Comment deleted successfully");

      setComments((prev) => {
        const commentToRemove = prev.find(
          (comment) => comment.id === commentId
        );
        if (commentToRemove) {
          setCommentedSelections((prevSet) => {
            const newSet = new Set(prevSet);
            newSet.delete(commentToRemove.selection);
            return newSet;
          });
        }
        return prev.filter((comment) => comment.id !== commentId);
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert(error.message || "Failed to delete comment. Please try again.");
    }
  };

  const handleSaveComment = async (commentId, text) => {
    try {
      const comment = comments.find((c) => c.id === commentId);

      console.log(comment);
      const isNewComment = !comment.createdAt;

      const commentData = {
        patientId: patient?.id,
        documentId: document?.history_id || document?.id || "default-doc-id",
        selection: comment.selection,
        text: text.trim(),
        y: comment.y,
        yPercentage: comment.yPercentage,
      };

      console.log("Document object:", document);
      console.log("Document ID:", document?.id);
      console.log("Comment data:", commentData);

      const url = !isNewComment
        ? `${SERVER}/patients/medical/comments`
        : `${SERVER}/patients/medical/comments/${commentId}`;

      // Use the centralized API function for consistent auth handling
      const { fetchWithAuth } = await import("../config/api.js");
      const response = await fetchWithAuth(url, {
        method: !isNewComment ? "POST" : "PUT",
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save comment");
      }

      const result = await response.json();
      console.log("Comment saved:", result);

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                text: text.trim(),
                isEditing: false,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
      setEditingComment(null);
    } catch (error) {
      console.error("Error saving comment:", error);
      alert(error.message || "Failed to save comment. Please try again.");
    }
  };

  const handleCancelComment = (commentId) => {
    const comment = comments.find((c) => c.id === commentId);

    console.log(comment, comments);
    if (comment && comment.text === "" && comment?.editor) {
      // If it's a new empty comment, remove it
      handleRemoveComment(commentId);
    } else {
      // If it has existing text, just exit edit mode
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, isEditing: false } : c))
      );
      setEditingComment(null);
    }
  };

  const handleEditComment = async (commentId) => {
    try {
      console.log("Starting edit for comment:", commentId);

      // Optional: Call API to lock comment for editing
      // await fetch(`/api/comments/${commentId}/edit`, { method: 'POST' });

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? { ...comment, isEditing: true } : comment
        )
      );
      setEditingComment(commentId);
    } catch (error) {
      console.error("Error starting edit:", error);
    }
  };

  // Update comment text handler
  const handleCommentTextChange = (commentId, newText) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, text: newText } : comment
      )
    );
  };

  // Handle comment button click with auto-scroll on mobile
  const handleCommentButtonClick = () => {
    const newActivateComment = !activateComment;
    setActivateComment(newActivateComment);
    if(isMobile){
    srcolltoTop()}

  };

  // Optimized items per page for A4 layout - conservative to prevent overflow
  const ITEMS_FIRST_PAGE = 6; // First page has patient info, so fewer items
  const ITEMS_OTHER_PAGES = 18; // Reduced to prevent page overflow and header misplacement

  // PDF download handler - opens new window with instruction to save as PDF
  const handlePrint = () => {
    // Check if mobile device
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobileDevice) {
      // For mobile devices, use a different approach
      alert(
        "PDF download is not supported on mobile devices. Please use a desktop browser to download documents."
      );
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow popups to download PDF");
      return;
    }

    // Generate all pages HTML
    const generateAllPagesHTML = () => {
      let allPagesHTML = "";

      for (let page = 1; page <= totalPages; page++) {
        let pageItems;
        if (page === 1) {
          pageItems = allItems.slice(0, ITEMS_FIRST_PAGE);
        } else {
          const startIndex = ITEMS_FIRST_PAGE + (page - 2) * ITEMS_OTHER_PAGES;
          const endIndex = startIndex + ITEMS_OTHER_PAGES;
          pageItems = allItems.slice(startIndex, endIndex);
        }

        if (useFormTemplate) {
          // Form Template view - each page is a complete document with proper page breaks
          allPagesHTML += `
            <div style="${styles.formTemplate}" class="print-page">
              <!-- Header Section - Show on every page -->
              <div style="${styles.header}">
                <div style="${styles.logo}">
                  <div style="${styles.logoImage}">
                    <img src="/logo.png" alt="logo" style="width: 100%; height: 100%; object-fit: contain;" />
                  </div>
                  <div>
                    <h3 style="${styles.orgInfoH3}">Mobileuurka</h3>
                    <p style="${styles.orgInfoP}">Healthcare Services</p>
                  </div>
                </div>
                <div style="${styles.documentInfo}">
                  <h2 style="${styles.documentInfoH2}">${title}</h2>
                  <p style="${styles.recordDate}">Date: ${new Date(
            formData.recordDate
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
                  ${
                    totalPages > 1
                      ? `<p style="${styles.pageNumber}">Page ${page} of ${totalPages}</p>`
                      : ""
                  }
                </div>
              </div>

              <!-- Patient Information Section - Only on first page -->
              ${
                page === 1
                  ? `
              <div style="${styles.section}">
                <h3 style="${styles.sectionTitle}">Patient Information</h3>
                <div style="${styles.patientGrid}">
                  <div style="${styles.fieldGroup}">
                    <label style="${styles.fieldLabel}">Full Name</label>
                    <div style="${styles.fieldValue}">${patientData.name}</div>
                  </div>
                  <div style="${styles.fieldGroup}">
                    <label style="${styles.fieldLabel}">Patient ID</label>
                    <div style="${styles.fieldValue}">${patientData.patientId}</div>
                  </div>
                  <div style="${styles.fieldGroup}">
                    <label style="${styles.fieldLabel}">Phone Number</label>
                    <div style="${styles.fieldValue}">${patientData.phone}</div>
                  </div>
                  <div style="${styles.fieldGroup}">
                    <label style="${styles.fieldLabel}">Email Address</label>
                    <div style="${styles.fieldValue}">${patientData.email}</div>
                  </div>
                </div>
                <div style="${styles.fieldGroupFullWidth}">
                  <label style="${styles.fieldLabel}">Address</label>
                  <div style="${styles.fieldValue}">${patientData.address}</div>
                </div>
              </div>
              `
                  : ""
              }

              <!-- Document Details Section -->
              ${
                isSymptomReasoningReport
                  ? `
                ${(() => {
                  // Handle both direct record and nested records structure
                  const record = documentData.records?.[0] || documentData;

                  return `
                    <!-- Risk Assessment Section -->
                    <div style="${styles.section}">
                      <h3 style="${styles.sectionTitle}">Risk Assessment</h3>
                      <div style="${styles.documentGrid}">
                        <div style="${styles.fieldGroup}">
                          <label style="${styles.fieldLabel}">Risk Level</label>
                          <div style="${styles.fieldValue}; ${
                    styles.riskCritical
                  }">
                            ${record.risk_level || "N/A"}
                          </div>
                        </div>
                        <div style="${styles.fieldGroup}">
                          <label style="${styles.fieldLabel}">Risk Score</label>
                          <div style="${styles.fieldValue}">${
                    record.risk_score || "N/A"
                  }</div>
                        </div>
                        <div style="${styles.fieldGroup}">
                          <label style="${styles.fieldLabel}">Gestation</label>
                          <div style="${styles.fieldValue}">
                            ${record.gestation_weeks_int || "N/A"} weeks (of ${
                    record.gestation_weeks_total || "N/A"
                  })
                          </div>
                        </div>
                      </div>
                    </div>

                    ${Object.entries(record)
                      .filter(
                        ([key, value]) =>
                          typeof value === "string" &&
                          value.length > 50 &&
                          ![
                            "id",
                            "patient_id",
                            "risk_score",
                            "risk_score_raw",
                            "risk_level",
                            "gestation_weeks_int",
                            "gestation_weeks_total",
                            "prompt_version",
                            "raw_model_response",
                            "input_hash",
                            "created_at",
                            "recommendations",
                            "recommendation",
                            "recommended_actions",
                            "next_steps",
                          ].includes(key)
                      )
                      .map(([key, value]) => {
                        const formattedKey = key
                          .replace(/_/g, " ")
                          .replace(/([a-z])([A-Z])/g, "$1 $2")
                          .replace(/\b\w/g, (l) => l.toUpperCase());
                        return `
                          <div style="${styles.section}">
                            <h3 style="${styles.sectionTitle}">${formattedKey}</h3>
                            <div style="${styles.contentArea}">
                              <p>${value}</p>
                            </div>
                          </div>
                        `;
                      })
                      .join("")}
                  `;
                })()}
              `
                  : `
                <div style="${styles.section}">
                  <h3 style="${styles.sectionTitle}">
                    Document Details
                    ${
                      totalPages > 1
                        ? `<span style="${styles.pageIndicator}">(Page ${page} of ${totalPages})</span>`
                        : ""
                    }
                  </h3>
                  <div style="${styles.documentGrid}">
                    ${pageItems
                      .map(
                        (item) => `
                      <div style="${styles.fieldGroup}">
                        <label style="${styles.fieldLabel}">${
                          item.label
                        }</label>
                        <div style="${styles.fieldValue}">
                          ${
                            item.value === "Not provided"
                              ? `<span style="${styles.emptyValue}">${item.value}</span>`
                              : item.value
                          }
                        </div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
              }

              ${
                page === 1
                  ? `
              <div style="${styles.footer}">
                <div style="${styles.signatureSection}">
                  <div style="${styles.signatureBox}">
                    <div style="${styles.signatureLine}"></div>
                    <label style="${
                      styles.signatureLabel
                    }">Healthcare Provider Signature</label>
                  </div>
                  <div style="${styles.signatureBox}">
                    <div style="${styles.signatureLine}"></div>
                    <label style="${styles.signatureLabel}">Date</label>
                  </div>
                </div>
                <div style="${styles.footerInfo}">
                  <p style="${
                    styles.footerInfoP
                  }">This document is confidential and contains protected health information.</p>
                  <p style="${
                    styles.footerInfoP
                  }">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
              </div>
              `
                  : ""
              }
          `;
        } else {
          // Legacy view
          allPagesHTML += `
            <div class="doc-main" style="page-break-after: ${
              page < totalPages ? "always" : "auto"
            };">
              <h3>${title} ${
            totalPages > 1 ? `(Page ${page} of ${totalPages})` : ""
          }</h3>
              <section>
                <div class="container">
                  ${pageItems
                    .map(
                      (item) => `
                    <div class="list">
                      <div class="label">${item.label}</div>
                      <div class="value">
                        ${
                          item.value === "Not provided"
                            ? '<span class="placeholder">' +
                              item.value +
                              "</span>"
                            : item.value
                        }
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </section>
            </div>
          `;
        }
      }

      return allPagesHTML;
    };

    // Use inline styles for perfect consistency
    const getInlineStyles = () => {
      const baseFormTemplate = isSymptomReasoningReport
        ? "max-width: 800px; margin: 30px auto; padding: 20px 0; background: transparent; border: none; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #2d3748; page-break-after: always;"
        : "max-width: 800px; margin: 30px auto; padding: 40px; background: #ffffff; border-radius: 12px; border: 1px solid rgba(0, 0, 0, 0.06); font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #2d3748; page-break-after: always;";

      return {
        formTemplate: baseFormTemplate,
        pageNumber:
          "margin: 3px 0 0 0; font-size: 0.8rem; color: #718096; font-weight: normal;",
        header:
          "display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 30px; border-bottom: 1px solid #e2e8f0; margin-bottom: 30px;",
        logo: "display: flex; align-items: center; gap: 15px;",
        logoImage:
          "width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background: #f7fafc; border-radius: 8px; overflow: hidden;",
        orgInfoH3:
          "margin: 0; font-size: 1.25rem; font-weight: 600; color: #1a202c;",
        orgInfoP: "margin: 2px 0 0 0; font-size: 0.875rem; color: #718096;",
        documentInfo: "text-align: right;",
        documentInfoH2:
          "margin: 0; font-size: 1.5rem; font-weight: 700; color: #2d3748;",
        recordDate: "margin: 5px 0 0 0; font-size: 0.875rem; color: #718096;",
        section: "margin-bottom: 25px;",
        sectionTitle: isSymptomReasoningReport
          ? "margin: 0 0 10px 0; font-size: 1.1rem; font-weight: 600; color: #1a202c; padding-bottom: 0; border-bottom: none;"
          : "margin: 0 0 15px 0; font-size: 0.95rem; font-weight: 600; color: #2d3748; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;",
        grid: "display: grid; gap: 12px;",
        patientGrid:
          "display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr);",
        documentGrid:
          "display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr);",
        fieldGroup: "display: flex; flex-direction: column; gap: 6px;",
        fieldGroupFullWidth:
          "display: flex; flex-direction: column; gap: 6px; grid-column: 1 / -1; margin-top: 8px;",
        fieldLabel:
          "font-size: 0.75rem; font-weight: 500; color: #4a5568; text-transform: uppercase; letter-spacing: 0.025em;",
        fieldValue: isSymptomReasoningReport
          ? "padding: 0; background: transparent; border: none; font-size: 0.9rem; color: #2d3748; display: flex; align-items: center;"
          : "padding: 8px 12px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.85rem; color: #2d3748; min-height: 16px; display: flex; align-items: center;",
        emptyValue: "color: #a0aec0; font-style: italic;",
        riskCritical: isSymptomReasoningReport
          ? "background: transparent; color: #e53e3e; font-weight: 600; padding: 0;"
          : "background: #fed7d7; color: #742a2a; font-weight: 600; padding: 4px 8px; border-radius: 4px;",
        riskHigh:
          "background: #fef5e7; color: #744210; font-weight: 600; padding: 4px 8px; border-radius: 4px;",
        riskModerate:
          "background: #e6fffa; color: #234e52; font-weight: 600; padding: 4px 8px; border-radius: 4px;",
        riskLow:
          "background: #c6f6d5; color: #22543d; font-weight: 600; padding: 4px 8px; border-radius: 4px;",
        contentArea: isSymptomReasoningReport
          ? "background: transparent; border: none; padding: 0; font-size: 0.9rem; line-height: 1.6; color: #2d3748; text-align: justify;"
          : "background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; line-height: 1.6;",
        footer:
          "margin-top: 50px; padding-top: 40px; border-top: 1px solid #e2e8f0;",
        signatureSection:
          "display: grid; grid-template-columns: 1fr 250px; gap: 40px; margin-bottom: 20px;",
        signatureBox: "display: flex; flex-direction: column; gap: 15px;",
        signatureLine:
          "height: 1px; background: #2d3748; margin-bottom: 8px; margin-top: 15px;",
        signatureLabel:
          "font-size: 0.875rem; color: #4a5568; text-align: center;",
        footerInfo:
          "text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;",
        footerInfoP: "margin: 5px 0; font-size: 0.75rem; color: #718096;",
        pageIndicator:
          "font-size: 0.75rem; color: #718096; font-weight: normal; margin-left: 10px;",
      };
    };

    const styles = getInlineStyles();

    // Write the document with PDF download instruction
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${
      patient?.name || "Patient"
    } - ${new Date().toLocaleDateString()}</title>
          <meta charset="UTF-8">
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white;
            }
            
            .pdf-instruction {
              position: fixed;
              top: 10px;
              right: 10px;
              background: #008540;
              color: white;
              padding: 15px 20px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              z-index: 1000;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            @media print {
              .pdf-instruction {
                display: none !important;
              }
              body {
                padding: 0 !important;
              }
            }
            
            @page {
              margin: 0.5in;
              size: A4;
            }
          </style>
        </head>
        <body>
          <div class="pdf-instruction">
            Press Ctrl+P (Cmd+P on Mac) and select "Save as PDF" to download
          </div>
          ${generateAllPagesHTML()}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Show instruction and auto-trigger print dialog
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  if (!document) return null;

  // Check if this is a SymptomReasoningReport
  const isSymptomReasoningReport = title === "AI Analysis";

  // Prepare data for FormTemplate
  const prepareDocumentData = () => {
    if (isSymptomReasoningReport) {
      return document;
    }

    const transformed = { ...document };

    // Clean up unwanted fields first
    delete transformed.user_id;
    delete transformed.id; // Remove id to avoid duplication with patient_id
    if (transformed.infections_id) {
      delete transformed.infections_id;
    }

    return transformed;
  };

  const documentData = prepareDocumentData();

  // Prepare patient data for FormTemplate
  const patientData = {
    name: patient?.name || "N/A",
    patientId: patient?.patientId || patient?.id || "N/A",
    phone: patient?.phone || "N/A",
    email: patient?.email || "N/A",
    address: patient?.address || "N/A",
  };

  // Prepare form data - fix date handling
  const getRecordDate = () => {
    if (document?.date) {
      // Check if it's already a valid date string
      const testDate = new Date(document.date);
      if (!isNaN(testDate.getTime())) {
        return document.date;
      }
    }
    return new Date().toISOString();
  };

  // Only highlight text that has been commented on
  const highlightText = (text, comments, commentedSelections) => {
    if (!text) return text;

    let highlighted = text;

    // Only process selections that are in our commented set
    comments.forEach((comment) => {
      if (comment.selection && commentedSelections.has(comment.selection)) {
        const cleanSelection = comment.selection.trim();
        if (!cleanSelection) return;

        // Escape regex special chars
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

  const formData = {
    recordDate: getRecordDate(),
    recordType: title || "Health Record",
    provider: documentData.editor || "Healthcare Provider",
  };

  // Legacy view data preparation with human-readable dates
  const allItems = isSymptomReasoningReport
    ? [] // SymptomReasoningReport doesn't use the table format
    : Object.entries(documentData).map(([key, value]) => ({
        label: formatKey(key),
        value: formatValue(formatHumanDate(key, value)),
      }));

  // Calculate pagination with different page sizes
  const calculatePagination = () => {
    if (allItems.length <= ITEMS_FIRST_PAGE) {
      return { totalPages: 1, currentItems: allItems };
    }

    const remainingItems = allItems.length - ITEMS_FIRST_PAGE;
    const additionalPages = Math.ceil(remainingItems / ITEMS_OTHER_PAGES);
    const totalPages = 1 + additionalPages;

    let currentItems;
    if (currentPage === 1) {
      currentItems = allItems.slice(0, ITEMS_FIRST_PAGE);
    } else {
      const startIndex =
        ITEMS_FIRST_PAGE + (currentPage - 2) * ITEMS_OTHER_PAGES;
      const endIndex = startIndex + ITEMS_OTHER_PAGES;
      currentItems = allItems.slice(startIndex, endIndex);
    }

    return { totalPages, currentItems };
  };

  const { totalPages, currentItems } = calculatePagination();

  // Render SymptomReasoningReport as a summary
  const renderSymptomReasoningSummary = () => {
    if (!isSymptomReasoningReport) return null;

    // Handle both direct record and nested records structure
    const record = documentData.records?.[0] || documentData;

    return (
      <>
        {/* Risk Assessment Section */}
        <div className="section">
          <h3 className="section-title">Risk Assessment</h3>
          <div className="grid document-grid">
            <div className="field-group">
              <label>Risk Level</label>
              <div
                className={`field-value risk-${record.risk_level?.toLowerCase()}`}
              >
                {record.risk_level}
              </div>
            </div>
            <div className="field-group">
              <label>Risk Score</label>
              <div className="field-value">{record.risk_score}</div>
            </div>
            <div className="field-group">
              <label>Gestation</label>
              <div className="field-value">
                {record.gestation_weeks_int} weeks (of{" "}
                {record.gestation_weeks_total})
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic sections for all text fields */}
        {Object.entries(record)
          .filter(
            ([key, value]) =>
              typeof value === "string" &&
              value.length > 50 && // Only show substantial text content
              ![
                "id",
                "patient_id",
                "risk_score",
                "risk_score_raw",
                "risk_level",
                "gestation_weeks_int",
                "gestation_weeks_total",
                "prompt_version",
                "raw_model_response",
                "input_hash",
                "created_at",
              ].includes(key)
          )
          .map(([key, value]) => (
            <div key={key} className="section">
              <h3 className="section-title">{formatKey(key)}</h3>
              <div className="content-area">
                <p>{value}</p>
              </div>
            </div>
          ))}
      </>
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="document-viewer">
      {/* Context Menu */}
      {selection && contextMenuPosition && (
        <div
          className="context-menu"
          style={{
            position: "fixed",
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            background: "#fff",
            border: "1px solid #ccc",
            padding: "6px 12px",
            borderRadius: "6px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            zIndex: 1000,
            cursor: "pointer",
          }}
          onClick={handleAddComment}
        >
          <div
            className="comment-btn"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FaRegCommentAlt />
            Add Comment
          </div>
        </div>
      )}

      {/* Header with controls */}
      <div className="document-header">
        <div className="header-left">
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2>{title}</h2>
            {document?.date && (
              <span style={{ fontSize: "0.875rem", color: "#718096" }}>
                {formatDate(document.date)}
              </span>
            )}
          </div>
        </div>
        <div
          className="header-right"
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <button className="download-button" onClick={handlePrint}>
            <IoPrintOutline />
            Download PDF
          </button>
          {isMobile && (
            <button
              className="comment-toggle-btn"
              onClick={handleCommentButtonClick}
              style={{
                background: activateComment ? "#008540" : "transparent",
                color: activateComment ? "white" : "#4a5568",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <FaRegCommentAlt size={14} />
              {comments.length > 0 && (
                <span
                  style={{
                    background: activateComment
                      ? "rgba(255,255,255,0.3)"
                      : "#008540",
                    color: activateComment ? "white" : "white",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {comments.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Document Content */}
      <div
        ref={componentRef}
        className={`document-content ${
          longPressStarted ? "selecting-text" : "selectable-text"
        }`}
        onContextMenu={handleRightClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        style={{ userSelect: "text", WebkitUserSelect: "text" }}
      >
        {useFormTemplate ? (
          <div className="doc-grid">
            <div className="doc-grid-left">
              {/* Pagination Controls - Outside the FormTemplate */}
              {totalPages > 1 && (
                <div className="pagination-controls document-pagination"
                >
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous Page
                  </button>

                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          className={`page-btn ${
                            page === currentPage ? "active" : ""
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next Page
                  </button>
                </div>
              )}

              {/* Complete FormTemplate for each page */}
              <FormTemplate
                title={title}
                patientData={patientData}
                showPatientInfo={currentPage === 1}
                className={isSymptomReasoningReport ? "ai-analysis" : ""}
                formData={formData}
                comments={comments}
                setSelection={setSelection}
                onContextMenu={handleContextMenu}
                organizationName="Mobileuurka"
                commentedSelections={commentedSelections}
                logoSrc="/logo.png"
              >
                {/* Custom content section for document data */}
                {isSymptomReasoningReport ? (
                  renderSymptomReasoningSummary()
                ) : (
                  <div className="section">
                    <h3 className="section-title">
                      Document Details
                      {totalPages > 1 && (
                        <span className="page-indicator">
                          (Page {currentPage} of {totalPages})
                        </span>
                      )}
                    </h3>
                    <div className="grid document-grid">
                      {currentItems.map((item, index) => (
                        <div key={index} className="field-group">
                          <label>{item.label}</label>
                          <div className="field-value">
                            {item.value === "Not provided" ? (
                              <span className="empty-value">{item.value}</span>
                            ) : (
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(
                                    item.value,
                                    comments,
                                    commentedSelections
                                  ),
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </FormTemplate>

              {/* Pagination Controls - Outside the FormTemplate */}
              {totalPages > 1 && (
                <div className="pagination-controls document-pagination">
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous Page
                  </button>

                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          className={`page-btn ${
                            page === currentPage ? "active" : ""
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next Page
                  </button>
                </div>
              )}
            </div>
            <div className="doc-grid-right">
              <div className="form-template" style={{ position: "relative" }}>
                {comments.map((comment) => (
                  <div
                    className="comment"
                    key={comment.id}
                    style={{
                      position: "absolute",
                      top: `${comment.y - 120}px`,
                      left: 0,
                      right: 0,
                      margin: "5px auto",
                      padding: "8px",
                      background: "var(--section)",
                      border: "1px solid var(--section)",
                      borderRadius: "6px",
                      zIndex: "99",
                    }}
                  >
                    {comment.isEditing ? (
                      <>
                        <textarea
                          value={comment.text}
                          onChange={(e) =>
                            handleCommentTextChange(comment.id, e.target.value)
                          }
                          placeholder="Write a comment..."
                          style={{
                            width: "100%",
                            minHeight: "40px",
                            border: "none",
                            outline: "none",
                            resize: "vertical",
                            background: "transparent",
                            marginBottom: "8px",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleSaveComment(comment.id, comment.text)
                            }
                            style={{
                              padding: "4px 12px",
                              background: "#008540",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => handleCancelComment(comment.id)}
                            style={{
                              padding: "4px 12px",
                              background: "#e53e3e",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            padding: "4px 0",
                            marginBottom: "8px",
                            minHeight: "20px",
                          }}
                        >
                          {comment.text || "No comment text"}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            style={{
                              padding: "4px 12px",
                              background: "#4299e1",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveComment(comment.id)}
                            style={{
                              padding: "4px 12px",
                              background: "#e53e3e",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {isMobile && (
              <div

                className={
                  activateComment
                    ? "doc-grid-comments active"
                    : "doc-grid-comments"
                }
              >
                <div
                  className="back"
                  onClick={() => setActivateComment((prev) => !prev)}
                >
                  <IoArrowBack />
                  Back
                </div>
                {comments.map((comment) => (
                  <div
                    className="comment"
                    key={comment.id}
                    style={{
                      margin: "5px auto 10px",
                      padding: "8px",
                      background: "var(--section)",
                      border: "1px solid var(--section)",
                      borderRadius: "6px",
                      zIndex: "99",
                    }}
                  >
                    {comment.isEditing ? (
                      <>
                        <textarea
                          value={comment.text}
                          onChange={(e) =>
                            handleCommentTextChange(comment.id, e.target.value)
                          }
                          placeholder="Write a comment..."
                          style={{
                            width: "100%",
                            minHeight: "40px",
                            border: "none",
                            outline: "none",
                            resize: "vertical",
                            background: "transparent",
                            marginBottom: "8px",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleSaveComment(comment.id, comment.text)
                            }
                            style={{
                              padding: "4px 12px",
                              background: "#008540",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => handleCancelComment(comment.id)}
                            style={{
                              padding: "4px 12px",
                              background: "#e53e3e",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            padding: "4px 0",
                            marginBottom: "8px",
                            minHeight: "20px",
                          }}
                        >
                          {comment.text || "No comment text"}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            style={{
                              padding: "4px 12px",
                              background: "#4299e1",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveComment(comment.id)}
                            style={{
                              padding: "4px 12px",
                              background: "#e53e3e",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Legacy view
          <div
            className="doc-main"
            style={{
              marginTop: "10vh",
            }}
          >
            <h3>
              {title}
              {totalPages > 1 && (
                <span className="page-indicator">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </h3>
            <section>
              <div className="container">
                {currentItems.map((item, index) => (
                  <div className="list" key={index}>
                    <div className="label">{item.label}</div>
                    <div className="value">
                      {item.value === "Not provided" ? (
                        <span className="placeholder">{item.value}</span>
                      ) : (
                        <span>{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls for Legacy View */}
              {totalPages > 1 && (
                <div className="pagination-controls legacy">
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          className={`page-btn ${
                            page === currentPage ? "active" : ""
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Document;
