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

const Overview = ({ patient,setActiveTab }) => {
  return (
    <div className="p-overview">
      <div className="grid-3">
        <div className="chart" style={{ overflow: "hidden" }}>
          <Weight patient={patient?.triages} />
        </div>
        <div className="chart">
          <Fetal  patient={patient?.fetalInfos}/>
        </div>
        <div className="chart">
          <Predisposition patient={patient} setActiveTab={setActiveTab} />
        </div>
      </div>
      <div className="grid-2">
        <div className="chart x2">
          <Riskassessment patient={patient} />
        </div>
        <div className="chart ">
          <Lab patient={patient?.labworks} />
        </div>
      </div>
      <div className="grid-2 reverse">
        <div className="chart ">
          <Medications patient={patient} setActiveTab={setActiveTab} />
        </div>
        <div className="chart x2">
          <div className="inner-grid">
            <div className="in-chart one" >
              <BloodPressure patient={patient?.triages} />
            </div>
            <div className="in-chart two">
              <Symptom patient={patient} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
