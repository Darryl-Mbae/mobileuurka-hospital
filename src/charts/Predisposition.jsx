import React from "react";
import "../css/Chart.css";
import { IoIosWarning } from "react-icons/io";
import { MdBubbleChart } from "react-icons/md";
import { FaChartSimple } from "react-icons/fa6";

const Predisposition = ({ patient, setActiveTab }) => {
  function parseDiagnosis(raw) {
    if (!raw) return "No diagnosis records";

    // Helper to parse PostgreSQL array-style strings
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
          .replace(/Highly\s+/i, "") // remove "Highly"
          .replace(/Suspected to have\s+/i, "") // remove leading phrase
          .replace(/\.$/, "") // remove trailing period
          .trim()
      );

    return cleaned.length > 0
      ? `Suspected to have ${cleaned.join(" & ")}`
      : "No diagnosis data found";
  }
  const checkPredisposition = (riskAssessment) => {
    if (!riskAssessment) return "";

    try {
      let assessment = riskAssessment;

      // Try to parse if it's a JSON-like string
      if (typeof assessment === "string") {
        try {
          assessment = JSON.parse(assessment);
        } catch {
          // If parsing fails, fallback to manual cleaning
          assessment = assessment
            .replace(/[{}"]/g, "") // Remove brackets and quotes
            .split(/[,;]/); // Split manually
        }
      }

      // Normalize to array if it's not already
      const list = Array.isArray(assessment) ? assessment : [assessment];

      // Clean each item
      const cleaned = list
        .map((item) =>
          item
            .toString()
            .replace(/predispositioned to\s*/i, "") // Remove "Predispositioned to"
            .replace(/\.$/, "") // Remove trailing period
            .trim()
        )
        .filter(
          (item) =>
            item.length > 0 && !item.toLowerCase().includes("no disease")
        );

      if (cleaned.length === 0) return "no signs of predisposition";

      // Capitalize first letter of each condition
      const formatted = cleaned.map(
        (d) => d.charAt(0).toUpperCase() + d.slice(1)
      );

      return `signs of predisposition to ${formatted.join(", ")}`;
    } catch (error) {
      console.error("Error parsing risk assessment:", error);
      return "undetermined predisposition status";
    }
  };

  return (
    <div className="xchart">
      <div className="predisposition">
        <div className="icon">
          <IoIosWarning />
        </div>
        <p className="pred">
          {!patient?.riskAssessments?.[patient?.riskAssessments?.length - 1]?.riskassessment ? "No risk assessment records available":  "Patient exhibits"}
         
          {checkPredisposition(
            patient?.riskAssessments?.[patient?.riskAssessments?.length - 1]
              ?.riskassessment
          )}
        </p>
        <div className="line-container">
          <div className="results">
            <div className="r-icon">
              <FaChartSimple />
            </div>
            <div className="r-details">
              <div className="title">Diagnosis</div>
              <div className="value">
                {parseDiagnosis(
                  patient?.labworks?.[patient?.labworks?.length - 1]?.diagnosis
                )}
              </div>
            </div>
          </div>
          <div className="results">
            <div className="r-icon">
              <MdBubbleChart />
            </div>
            <div className="r-details">
              <div className="title">Risk</div>
              <div className="value">
                Patient risk{" "}
                <span style={{ textTransform: "capitalize" }}>
                  {[
                    patient?.explanations?.[patient?.explanations?.length - 1]
                      ?.risklevel || "unavailable",
                  ]}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="button" onClick={() => setActiveTab("documents")}>
          Documents
        </div>
      </div>
    </div>
  );
};

export default Predisposition;
