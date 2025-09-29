import React, { useEffect, useState } from "react";
import "../css/Weight.css";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import WeightChart from "./WeightChart";
import { IoFlagSharp } from "react-icons/io5";
import { Tooltip } from "react-tooltip";
import { safeArray, safeChartData } from "../utils/patientDataGuard.js";

const Weight = ({ patient }) => {
  const [weightAnalysis, setWeightAnalysis] = useState(null);
  const [latestWeights, setLatestWeights] = useState([]);
  const [showFlag, setShowFlag] = useState(false);
  const [flagMessage, setFlagMessage] = useState("");

  useEffect(() => {
    const safePatientData = safeArray(patient);
    if (safePatientData.length === 0) return;

    // Sort by date descending with safe data
    const sorted = safeChartData.weight(safePatientData);

    // Get the latest gestation week from the most recent entry
    const latestGestationWeek = sorted[0]?.gestationweek;

    // Save the latest 5 weights
    const latest = sorted.slice(0, 5).map((entry) => ({
      date: entry.date,
      weight: entry.weight,
    }));
    setLatestWeights(latest);

    // Compare latest two weights
    if (sorted.length >= 2) {
      const [latestEntry, previousEntry] = [sorted[0], sorted[1]];

      const currWeight = latestEntry.weight;
      const prevWeight = previousEntry.weight;

      const change = currWeight - prevWeight;
      const direction =
        change > 0 ? "increased" : change < 0 ? "decreased" : "no change";

      const diffDays = Math.round(
        (new Date(latestEntry.date) - new Date(previousEntry.date)) /
          (1000 * 60 * 60 * 24)
      );

      // Calculate weight change per week
      const changePerWeek = (change / diffDays) * 7;

      // Determine trimester based on latest gestation week
      let trimester;
      if (latestGestationWeek < 14) trimester = "first";
      else if (latestGestationWeek < 28) trimester = "second";
      else trimester = "third";

      // Check if weight change is outside normal range
      let shouldFlag = false;
      let message = "";

      if (direction === "decreased") {
        shouldFlag = true;
        message = "Weight loss during pregnancy should be evaluated.";
      } else if (direction === "increased") {
        switch (trimester) {
          case "first":
            // First trimester: 0.5-2kg total over ~12 weeks
            // For weekly check, we'll approximate as 0.04-0.17kg per week
            if (changePerWeek > 0.17 || changePerWeek < 0.04) {
              shouldFlag = true;
              message = `Expected weight gain in first trimester: 0.5-2kg total (approx 0.04-0.17kg/week). Current change: ${changePerWeek.toFixed(2)}kg/week.`;
            }
            break;
          case "second":
            if (changePerWeek > 0.9 || changePerWeek < 0.45) {
              shouldFlag = true;
              message = `Expected weight gain in second trimester: 0.45-0.9kg/week. Current change: ${changePerWeek.toFixed(2)}kg/week.`;
            }
            break;
          case "third":
            if (changePerWeek > 0.9 || changePerWeek < 0.45) {
              shouldFlag = true;
              message = `Expected weight gain in third trimester: 0.45-0.9kg/week. Current change: ${changePerWeek.toFixed(2)}kg/week.`;
            }
            break;
          default:
            break;
        }
      }

      setShowFlag(shouldFlag);
      setFlagMessage(message);

      setWeightAnalysis({
        latestWeight: currWeight,
        previousWeight: prevWeight,
        change,
        direction,
        dateDiff: diffDays,
        changePerWeek,
        trimester,
        gestationWeek: latestGestationWeek,
      });
    }
  }, [safePatientData]);

  // UI logic
  function getWeightChangeUI(change, direction) {
    const absChange = Math.abs(change).toFixed(1);

    const scenarios = {
      increased: {
        message: `Increased by ${absChange} kg`,
        icon: <FaArrowTrendUp color="green" />,
        symbol: "+",
        bgClass: "rgba(121, 180, 154, 0.2)",
        textClass: "rgba(121, 180, 154, 1",
        change: absChange,
      },
      decreased: {
        message: `Decreased by ${absChange} kg`,
        icon: <FaArrowTrendDown color="red" />,
        symbol: "-",
        bgClass: "rgba(216, 115, 127, 0.2)",
        textClass: "rgba(216, 115, 127, 1)",
        change: absChange,
      },
      "no change": {
        message: "No weight change",
        icon: "➖",
        bgClass: "bg-gray-100",
        textClass: "text-gray-700",
      },
    };

    return scenarios[direction] || scenarios["no change"];
  }

  return (
    <div className="weight-chart">
      <div className="top">
        Weight
        {weightAnalysis &&
          (() => {
            const { symbol, icon, bgClass, textClass, change } =
              getWeightChangeUI(
                weightAnalysis.change,
                weightAnalysis.direction
              );

            return (
              <div
                className={`top-box`}
                style={{
                  backgroundColor: bgClass,
                  color: textClass,
                  fontSize: ".8em",
                }}
              >
                {icon}
                <p style={{ marginLeft: "5px" }}>
                  <span>{change}</span> kg(s)
                </p>
              </div>
            );
          })()}
      </div>
      <div className="mid">
        <WeightChart data={latestWeights} />
      </div>
      <div className="bottom">
        {/* Weight analysis box */}
        {weightAnalysis &&
          (() => {
            const { message, icon, bgClass, textClass } = getWeightChangeUI(
              weightAnalysis.change,
              weightAnalysis.direction
            );

            return (
              <div className={`weight-analysis ${bgClass} ${textClass}`}>
                {icon}
                <p>
                  <span>{message}</span> in{" "}
                  <span>{weightAnalysis.dateDiff}</span> days
                </p>
                {showFlag && (
                  <IoFlagSharp
                    data-tooltip-id="weight-tooltip"
                    data-tooltip-content={flagMessage}
                    color="red"
                  />
                )}
              </div>
            );
          })()}
      </div>
      <Tooltip
        id="weight-tooltip"
        style={{ fontSize: ".8em", zIndex: "99999" }}
      />
    </div>
  );
};

export default Weight;