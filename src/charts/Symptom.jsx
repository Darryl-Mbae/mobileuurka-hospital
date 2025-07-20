import React from "react";
import { FaPlus } from "react-icons/fa6";
import { IoFlagSharp } from "react-icons/io5";

const Symptom = () => {
  return (
    <div className="xchart">
      <div className="title-block">
        <h3>Symptoms</h3>
        <div className="buttons">
          <div className="add small-btn">
            <FaPlus />

          </div>
          <div className="ai small-btn">
            <span>!</span>
            <img src="/logo.png" alt="" />
          </div>
        </div>
      </div>
      <div className="symptoms">
        <div className="symptom">
          <div className="flag">
            <IoFlagSharp color="red" />
          </div>
          <div className="value">Blurred vision</div>
        </div>
         <div className="symptom">
          <div className="flag">
            <IoFlagSharp color="#EFA65C" />
          </div>
          <div className="value">Elevated blood pressure</div>
        </div> <div className="symptom">
          <div className="flag">
            <IoFlagSharp color="#008540" />
          </div>
          <div className="value">General sense of malaise</div>
        </div> 
        {/* <div className="symptom">
          <div className="flag">
            <IoFlagSharp color="#EFA65C" />
          </div>
          <div className="value">Dizziness and abdominal pains</div>
        </div> */}
      </div>
    </div>
  );
};

export default Symptom;
