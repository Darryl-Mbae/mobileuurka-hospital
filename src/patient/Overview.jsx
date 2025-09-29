import React from "react";
import "./css/Overview.css";
import Predisposition from "../charts/Predisposition";
import Symptom from "../charts/Symptom";
import Lab from "../charts/Lab";
import Medications from "../charts/Medications";
import Fetal from "../charts/Fetal";
import Riskassessment from "../components/Riskassessment";
import Weight from "../charts/Weight";
import BloodPressure from "../charts/BloodPressure";
import { Tooltip } from "react-tooltip";
import { ChartErrorBoundary, safeArray } from "../utils/patientDataGuard.js";
import SafeChartWrapper from "../components/SafeChartWrapper.jsx";

const Overview = ({ patient, setActiveTab }) => {
  // Ensure safe data access for charts
  const safeTriages = safeArray(patient?.triages);
  const safeFetalInfos = safeArray(patient?.fetalInfos);
  const safeLabworks = safeArray(patient?.labworks);

  return (
    <div className="p-overview">
      <div className="grid-3">
        <div className="chart" style={{ overflow: "visible" }}>
          <SafeChartWrapper fallbackMessage="Weight chart loading...">
            <ChartErrorBoundary>
              <Weight patient={safeTriages} />
            </ChartErrorBoundary>
          </SafeChartWrapper>
        </div>
        <div className="chart fetal">
          <SafeChartWrapper fallbackMessage="Fetal chart loading...">
            <ChartErrorBoundary>
              <Fetal patient={safeFetalInfos} />
            </ChartErrorBoundary>
          </SafeChartWrapper>
        </div>
        <div className="chart">
          <SafeChartWrapper fallbackMessage="Risk assessment loading...">
            <ChartErrorBoundary>
              <Predisposition patient={patient} setActiveTab={setActiveTab} />
            </ChartErrorBoundary>
          </SafeChartWrapper>
        </div>
      </div>
      <div className="grid-2">
        <div className="chart x2">
          <SafeChartWrapper fallbackMessage="Risk assessment loading...">
            <ChartErrorBoundary>
              <Riskassessment patient={patient} />
            </ChartErrorBoundary>
          </SafeChartWrapper>
        </div>
        <div className="chart lab">
          <SafeChartWrapper fallbackMessage="Lab results loading...">
            <ChartErrorBoundary>
              <Lab patient={safeLabworks} />
            </ChartErrorBoundary>
          </SafeChartWrapper>
        </div>
      </div>
      <div className="grid-2 reverse">
        <div className="chart ">
          <SafeChartWrapper fallbackMessage="Medications loading...">
            <ChartErrorBoundary>
              <Medications patient={patient} setActiveTab={setActiveTab} />
            </ChartErrorBoundary>
          </SafeChartWrapper>
        </div>
        <div className="chart x2 bt">
          <div className="inner-grid">
            <div className="in-chart one" >
              <SafeChartWrapper fallbackMessage="Blood pressure loading...">
                <ChartErrorBoundary>
                  <BloodPressure patient={safeTriages} />
                </ChartErrorBoundary>
              </SafeChartWrapper>
            </div>
            <div className="in-chart two">
              <SafeChartWrapper fallbackMessage="Symptoms loading...">
                <ChartErrorBoundary>
                  <Symptom patient={patient} setActiveTab={setActiveTab} />
                </ChartErrorBoundary>
              </SafeChartWrapper>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global tooltip container for overview charts */}
      <Tooltip
        id="overview-tooltip"
        style={{ fontSize: ".8em", zIndex: "99999" }}
      />
    </div>
  );
};

export default Overview;
