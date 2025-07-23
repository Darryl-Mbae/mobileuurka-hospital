import React, { useState } from "react";
import "../css/BP.css";
import DropdownMenu from "../components/DropdownMenu";
import BloodPressureChart from "./BloodPressureChart";

const BloodPressure = ({ patient }) => {
  
  const [selectedOption, setSelectedOption] = useState("systolic");


  return (
    <div className="blood-pressure-chart">
      <div className="title">
        Triage
        <DropdownMenu
          data={["systolic", "diastolic", "temperature", "bmi","heartRate"]}
          selected={selectedOption}
          length={"90px"}
          onChange={(value) => setSelectedOption(value)}
        />
      </div>
      <div className="chart-container">
        <BloodPressureChart patient={patient} selectedOption={selectedOption} />
      </div>
    </div>
  );
};

export default BloodPressure;
