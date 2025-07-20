import React, { useState, useEffect } from 'react';
import '../css/Fetal.css';
import DropdownMenu from '../components/DropdownMenu';
import FetalGraph from './FetalGraph';

const Fetal = ({ patient }) => {
  const [selectedOption, setSelectedOption] = useState("fhr");



  return (
    <div className='fetal-chart'>
      <div className="title">
        Fetal
        <DropdownMenu
          data={["fhr","femur_height","head_circumference"]}
          selected={selectedOption}
          length={"150px"}
          onChange={(value) => setSelectedOption(value)}
        />
      </div>
      <FetalGraph selectedOption={selectedOption} patient={patient}  />
    </div>
  );
};

export default Fetal;
