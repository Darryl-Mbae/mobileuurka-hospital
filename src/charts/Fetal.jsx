import React, { useState, useEffect } from 'react';
import '../css/Fetal.css';
import DropdownMenu from '../components/DropdownMenu';
import FetalGraph from './FetalGraph';
import { safeArray } from '../utils/patientDataGuard.js';

const Fetal = ({ patient }) => {
  const [selectedOption, setSelectedOption] = useState("fhr");
  
  // Ensure safe data access
  const safePatientData = safeArray(patient);

  const data = [
    { value: "fhr", label: "FHR" },
    { value: "femurHeight", label: "Femur Height" },
    { value: "headCircumference", label: "Head Circumference" },
  ];
  

  return (
    <div className='fetal-chart'>
      <div className="title">
        Fetal
        <DropdownMenu
          data={data}
          selected={selectedOption}
          length={"150px"}
          onChange={(value) => setSelectedOption(value)}
        />
      </div>
      <FetalGraph selectedOption={selectedOption} patient={safePatientData} />
    </div>
  );
};

export default Fetal;
