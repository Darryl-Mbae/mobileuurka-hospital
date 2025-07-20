import React from "react";
import "../css/Chart.css";
import { TbPillFilled } from "react-icons/tb";
import { FaInfo } from "react-icons/fa6";
import { IoFlagSharp } from "react-icons/io5";
import { Tooltip } from "react-tooltip";

const Medications = ({ patient, setActiveTab }) => {
  const colors = {
    green: {
      color: "#008540",
      backgroundColor: "rgba(133, 198, 154, 0.16)",
    },
    red: {
      color: "#E31C23",
      backgroundColor: "rgba(255, 73, 79, .1)",
    },
    yellow: {
      color: "#EFA65C",
      backgroundColor: "rgba(239, 166, 92, 0.13)",
    },
  };

  // Extract medications and allergies from patient prop
  const allMedications = patient?.medications || [];
  const allergies = patient?.allergies || [];

  console.log("Allergies:", allergies);
  console.log("Medications:", allMedications);

  // Filter medications where stop date is in the future
  const currentDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
  const activeMedications = allMedications.filter((med) => {
    return med.stopDate >= currentDate;
  });

  return (
    <div className="xchart">
      <div className="title-block" style={{ margin: "0px" }}>
        <h3>Medication</h3>
      </div>

      <div className="medication">
        <div className="line-container">
          {activeMedications.length > 0 ? (
            activeMedications.slice(0, 3).map((med, index) => {
              const isAllergic = allergies.some(
                (allergy) =>
                  allergy.allergies.toLowerCase() === med.medicine.toLowerCase()
              );

              return (
                <div className="results" key={index}>
                  <div
                    className="med-icon"
                    style={{
                      color: isAllergic ? colors.red.color : colors.green.color,
                      backgroundColor: isAllergic
                        ? colors.red.backgroundColor
                        : colors.green.backgroundColor,
                    }}
                  >
                    <TbPillFilled />
                  </div>
                  <div className="med-details">
                    <div className="med">{med.medicine}</div>
                    <div className="dosage">{med.dosage}</div>
                  </div>
                  {isAllergic ? (
                    <div className="med-flag righty">
                      <IoFlagSharp
                        color={colors.red.color}
                        data-tooltip-id="allergy-tooltip"
                        data-tooltip-content="Patient has an allergic reaction to medication"
                      />
                      <Tooltip
                        id="allergy-tooltip"
                        style={{ fontSize: ".8em", zIndex: "9999" }}
                      />
                    </div>
                  ) : (
                    <div
                      className="med-info righty"
                      data-tooltip-id="normal-tooltip"
                      data-tooltip-content={med.medication_purpose}
                    >
                      <FaInfo />
                      <Tooltip
                        id="normal-tooltip"
                        style={{ fontSize: "1.8em", zIndex: "9999" }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="no-medications">
              <div className="results">
                <div
                  className="med-icon"
                  style={{
                    color: "#008540",
                    backgroundColor: "rgba(133, 198, 154, 0.16)",
                  }}
                >
                  <TbPillFilled />
                </div>
                <div className="med-details">
                  <div className="med">No medications </div>
                  <div className="dosage">Availabale</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="button" onClick={() => setActiveTab("medication")}>
          View Medications
        </div>
      </div>
    </div>
  );
};

export default Medications;
