import React from "react";
import { FaPlus } from "react-icons/fa6";
import { IoFlagSharp } from "react-icons/io5";

const Symptom = ({patient, setActiveTab}) => {

  function getLatest(data){
    return data?.[data?.length - 1]
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    
    const readable = date.toLocaleDateString("en-US", {
      weekday: "long", // optional
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return readable
  }

  return (
    <div className="xchart">
      <div className="title-block">
        <h3>Notes</h3>
        {/* <div className="buttons">
          <div className="add small-btn">
            <FaPlus />

          </div>
          <div className="ai small-btn">
            <span>!</span>
            <img src="/logo.png" alt="" />
          </div>
        </div> */}
      </div>
      {/* <div className="symptoms">
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
        <div className="symptom">
          <div className="flag">
            <IoFlagSharp color="#EFA65C" />
          </div>
          <div className="value">Dizziness and abdominal pains</div>
        </div>
      </div> */}
      {patient?.notes?.length > 0 ?
      <div className="notes-small" onClick={() => setActiveTab("notes")}>
          <div className="title">
            <div className="dot"></div>
            {getLatest(patient?.notes)?.title}
          </div>
          <div className="message">
          {getLatest(patient?.notes)?.notes}

          </div>
          <div className="editor">
           ~ {getLatest(patient.notes)?.editor}
          </div>
          <div className="time">
          {formatDate(getLatest(patient.notes)?.date)}
          </div>
      </div>
      :
      <p className="nonote">No Note found</p>}
    </div>
  );
};

export default Symptom;
