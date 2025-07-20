import React, { useEffect, useRef, useState } from "react";
import "../css/Chart.css";
import { FaAngleUp } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import DropdownMenu from "../components/DropdownMenu";
import LabChart from "./LabChart";

const Lab = ({ patient }) => {
  const [active, setActive] = useState(false);
  const [typedText, setTypedText] = useState("");
  const timeoutRef = useRef(null);

  const data = patient?.[patient.length - 1];
  const [selectedOption, setSelectedOption] = useState("");

const monitoredKeys = [
  "haemoglobin",  // anemia
  "platelets",    // clotting capacity
  "creatinine",   // kidney function
  "bun",          // kidney function
  "ast",          // liver enzyme
  "alt",          // liver enzyme
  "tsh",          // thyroid function
  "glutamyl",     // liver/kidney involvement (GGT)
  "wbc",          // infection or inflammation
];

// Filter data to get only monitored numeric keys
const intKeys = data
  ? Object.entries(data)
      .filter(
        ([key, value]) =>
          typeof value === "number" && monitoredKeys.includes(key)
      )
      .map(([key]) => key)
  : [];

  useEffect(() => {
  if (intKeys.includes("platelets") && !selectedOption) {
    setSelectedOption("platelets");
  }
}, [intKeys, selectedOption]);


  useEffect(() => {
    const fullText =
      "Findings suggest early preeclampsia, with proteinuria, elevated liver enzymes, and mild thrombocytopenia indicating renal and hepatic involvement. Elevated LDH may signal early HELLP syndrome";

    if (active) {
      setTypedText(""); // reset before starting
      let index = 0;

      const type = () => {
        setTypedText((prev) => {
          const next = prev + fullText.charAt(index);
          index++;
          if (index < fullText.length) {
            timeoutRef.current = setTimeout(type, 20);
          }
          return next;
        });
      };

      // Start typing after clear
      timeoutRef.current = setTimeout(type, 10);
    }

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [active]);

  return (
    <div className="xchart">
      <div className="title-block" style={{ margin: "0px" }}>
        <h3>Lab</h3>
        <div className="buttons">
          <DropdownMenu
            data={intKeys}
            selected={selectedOption}
            length={"130px"}
            onChange={(value) => setSelectedOption(value)}
          />
        </div>
      </div>
      <div className="lab">
        <div className="graph">
          <LabChart patient={patient} selectedOption={selectedOption} />
        </div>
        <div className={active ? "ai-text active" : "ai-text"}>
          {active ? (
            <>
              <div className="icon">
                <IoIosWarning />
              </div>
              <p style={{ marginBottom: "15px" }}>{typedText}</p>
            </>
          ) : (
            <>
              <div className="dot"></div>
              <p>AI Analysis</p>
            </>
          )}
          <div className="arrow" onClick={() => setActive((prev) => !prev)}>
            <FaAngleUp />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lab;
