import React, { useEffect, useState } from "react";
import "../css/Riskassessment.css";
import Piechart from "../charts/Piechart";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

const Riskassessment = ({ patient }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);


  useEffect(() => {
    if (patient) {
      // Extract dates from explanations and visits
      const explanationDates =
        patient?.explanations?.map((exp) => exp.date.split("T")[0]) || [];

      // Get visit dates and next visit if available
      const visitDates =
        patient?.visits?.map((visit) => visit.date.split("T")[0]) || [];
      const nextVisitDate =
        patient?.visits?.[patient?.visits?.length - 1]?.nextVisit;

      // Combine and deduplicate dates
      const allDates = [...new Set([...explanationDates, nextVisitDate])].sort(
        (a, b) => new Date(a) - new Date(b)
      );

      // If we have more than 5 dates, just take the first 5 initially
      const initialDates = allDates.length > 0 ? allDates : [];

      setDateRange(initialDates);

      // Set the selected date to the most recent one if available
      if (initialDates.length > 0) {
        setSelectedDate(initialDates[initialDates.length - 2]);
      }
    }
  }, [patient]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 5 < dateRange.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "short" });

    return { day, month };
  };

  const getVisibleDates = () => {
    // Get up to 5 dates starting from currentIndex
    return dateRange.slice(currentIndex, currentIndex + 5);
  };

  const getCurrentExplanation = () => {
    if (!selectedDate || !patient.explanations) return null;

    return patient.explanations.find(
      (exp) => exp.date.split("T")[0] === selectedDate
    );
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const visibleDates = getVisibleDates();
  const currentExplanation = getCurrentExplanation();

  const colors = {
    green: {
      color: "#008540",
      backgroundColor: "rgba(133, 198, 154, 0.16)",
    },
    grey: {
      color: "rgba(221, 221, 221, .39)",
      backgroundColor: "rgba(196, 196, 196, .12)",
    },
    yellow: {
      color: "#EFA65C",
      backgroundColor: "rgba(239, 166, 92, 0.13)",
    },
  };

  return (
    <div className="xchart" style={{ width: "95%" }}>
      <div className="title-block" style={{ margin: "0px" }}>
        <h3>Risk Assessment Overview</h3>
      </div>
      <div className="riskassessment">
        <div className="r-chart">
          <Piechart patient={patient} selectedDate={selectedDate} explanations={patient?.explanations} />
        </div>
        <div className="r-details">
          <div className="top">
            <div
              className={`arrow ${currentIndex === 0 ? "disabled" : ""}`}
              onClick={handlePrev}
            >
              <FaAngleLeft />
            </div>

            {visibleDates.map((date, index) => {
              const formatted = formatDateDisplay(date);
              const isFutureVisit =
                patient?.visits?.[patient?.visits?.length - 1]?.nextVisit ===
                date;

              return (
                <div
                  key={index}
                  className={`date 
                    ${selectedDate === date ? "active" : ""} 
                    ${isFutureVisit ? "future" : ""}
                  `}
                  onClick={() => handleDateSelect(date)}
                  style={{
                    cursor:"pointer"
                  }}
                >
                  {formatted && (
                    <>
                      <div className="day">{formatted.day}</div>
                      <div className="month">{formatted.month}</div>
                    </>
                  )}
                </div>
              );
            })}

            {Array.from({ length: 5 - visibleDates.length }).map((_, index) => {
              // Get the last visit's next_visit date
              const nextVisitDate =
                patient?.visits?.[patient?.visits?.length - 1]?.nextVisit;

              // If we have a next visit date, calculate consecutive dates
              if (nextVisitDate) {
                const nextVisit = new Date(nextVisitDate);
                const consecutiveDate = new Date(nextVisit);
                consecutiveDate.setDate(nextVisit.getDate() + index + 1); // Add days

                // Format as YYYY-MM-DD
                const formattedConsecutiveDate = consecutiveDate
                  .toISOString()
                  .split("T")[0];
                const formatted = formatDateDisplay(formattedConsecutiveDate);

                return (
                  <div
                    key={`consec-${index}`}
                    className="date"
                    style={{
                      cursor: "not-allowed",
                    }}
                  >
                    {formatted && (
                      <>
                        <div className="day">{formatted.day}</div>
                        <div className="month">{formatted.month}</div>
                      </>
                    )}
                  </div>
                );
              }

              // Fallback to empty placeholder if no next visit date
              return <div key={`empty-${index}`} className="date empty"></div>;
            })}

            <div
              className={`arrow ${
                currentIndex + 5 >= dateRange.length ? "disabled" : ""
              }`}
              onClick={handleNext}
            >
              <FaAngleRight />
            </div>
          </div>
          <div className="bottom">
            <div className="ra-title">
              <div className="dot"></div>
              <h4>Risk Assessment Analysis</h4>
            </div>
            <p>
              {(() => {
                // Check if this is the next visit date
                const isNextVisit =
                  patient?.visits?.[patient?.visits?.length - 1]?.nextVisit ===
                  selectedDate;

                // Check if this is a future date (after next visit)
                const nextVisitDate =
                  patient?.visits?.[patient?.visits?.length - 1]?.nextVisit;

                const isFutureDate =
                  nextVisitDate &&
                  new Date(selectedDate) > new Date(nextVisitDate);

                

                const currentExplanation = patient?.explanations?.find(
                  (exp) => exp.date.split("T")[0] === selectedDate
                );
                // Check if this is a visit date
                const currentVisit = patient?.visits?.find(
                  (visit) => visit.date.split("T")[0] === selectedDate
                );

                if (isNextVisit) {
                  return "Patient will be coming for their next scheduled visit. Assessment will be available after the visit.";
                } 
                 else if (currentExplanation) {
                  return (
                    currentExplanation.features ||
                    "Explanation recorded but no detailed assessment available."
                  );
                } else if (currentVisit) {
                  return (
                    currentVisit.visitExplanation ||
                    "Visit recorded but no detailed assessment available."
                  );
                } else {
                  return "No assessment data available for this date.";
                }
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Riskassessment;
