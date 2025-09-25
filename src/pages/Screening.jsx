import React, { useEffect, useState } from "react";
import "../css/Screening.css";
import PatientIntake from "../forms/PatientIntake";
import PatientHistory from "../forms/PatientHistory";
import PatientVisit from "../forms/PatientVisit";
import Triage from "../forms/Triage";
import Ultrasound from "../forms/Ultrasound";
import Lifestyle from "../forms/Lifestyle";
import Fetal from "../forms/Fetal";
import Infections from "../forms/Infections";
import Prescription from "../forms/Prescription";
import Allergies from "../forms/Allergies";
import Pregnancy from "../forms/Pregnancy";
import Labwork from "../forms/Labwork";
import { useScreeningFlow } from "../hooks/useScreeningFlow";
import { useLocation } from "react-router-dom";

const testCategories = [
  {
    title: "Patient Intake",
    description: "Register and check in patients for clinical visits.",
    path: 2.1,
  },
  {
    title: "Patient History",
    description:
      "Record detailed medical, surgical, and obstetric history to inform prenatal care.",
    path: 2.2,
  },
  {
    title: "Lifestyle",
    description:
      "Record lifestyle factors relevant to patient health, such as smoking, alcohol use, diet, and exercise.",
    path: 2.3,
  },
  {
    title: "Patient Visits",
    description:
      "Document patient visit details, including date, reason, and follow-up plans.",
    path: 2.4,
  },
  {
    title: "Allergy Records",
    description:
      "Capture and review patient allergy information to ensure safe care.",
    path: 2.5,
  },
  {
    title: "Triage",
    description: "Assess patient vitals and prioritize care needs.",
    path: 2.6,
  },

  {
    title: "Pregnancy Journey",
    description:
      "Track current pregnancy information, clinical observations, and complications.",
    path: 2.7,
  },
  {
    title: "Lab Tests",
    description: "Log lab results and update patient medical records.",
    path: 2.8,
  },
  {
    title: "Infections",
    description: "Conduct tests and track results for maternal infections.",
    path: 2.9,
  },
  {
    title: "Fetal Development",
    description:
      "Monitor and document fetal growth and development milestones.",
    path: 2.11,
  },
  {
    title: "Ultrasound",
    description: "Record ultrasound details and image references.",
    path: 2.12,
  },

  {
    title: "Prescriptions",
    description:
      "Document prescribed medications and monitor dosage schedules.",
    path: 2.13,
  },

  // {
  //   title: "Clinical Notes",
  //   description: "Write, edit, and manage detailed notes for patient encounters.",
  //   path: 2.14,
  // },
];

const Screening = ({ internalTab, setInternalTab }) => {
  console.log("Screening component rendered with internalTab:", internalTab);

  try {
    const { getScreeningContext } = useScreeningFlow(setInternalTab);
    const screeningContext = getScreeningContext();

    const location = useLocation();
    const {
      patientId,
      formType,
      returnTo,
      replace,
      internalTab: internalTabFromNav,
    } = location.state || {};

    console.log("Screening - location state:", location.state);

    // If internalTab (prop) is empty, set it from navigation state
    // But only if we're coming from a specific navigation with intent to show a form
    useEffect(() => {
      console.log(
        "Screening useEffect - patientId:",
        patientId,
        "internalTabFromNav:",
        internalTabFromNav,
        "current internalTab:",
        internalTab
      );
      if (internalTab === null && internalTabFromNav && patientId) {
        // Only set from navigation if we have both a specific form and patient ID
        console.log("Setting internalTab from navigation:", internalTabFromNav);
        setInternalTab(internalTabFromNav);
      }
      else{
        if (replace){
          setInternalTab(null)
        }      
      }
    }, [internalTab, internalTabFromNav, setInternalTab, patientId]);

    return (
      <div className="screening">
        {internalTab === null ? (
          <div className="components">
            {/* Mini-tabs navigation */}
            <div className="tests">
              {testCategories.map((test, index) => (
                <div
                  key={index}
                  className="test"
                  onClick={() => setInternalTab(test.path)} // Set internal tab based on user selection
                >
                  <div className="title">{test.title}</div>
                  <p>{test.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="components">
            {internalTab === 2.1 && (
              <PatientIntake setInternalTab={setInternalTab} />
            )}
            {internalTab === 2.2 && (
              <PatientHistory setInternalTab={setInternalTab} />
            )}
            {internalTab === 2.3 && (
              <Lifestyle setInternalTab={setInternalTab} />
            )}
            {internalTab === 2.4 && (
              <PatientVisit
                setInternalTab={setInternalTab}
                selectedPatientId={screeningContext.patientId}
              />
            )}
            {internalTab === 2.5 && (
              <Allergies setInternalTab={setInternalTab} />
            )}
            {internalTab === 2.6 && <Triage setInternalTab={setInternalTab} />}
            {internalTab === 2.7 && (
              <Pregnancy setInternalTab={setInternalTab} />
            )}
            {internalTab === 2.8 && <Labwork setInternalTab={setInternalTab} />}
            {internalTab === 2.9 && (
              <Infections setInternalTab={setInternalTab} />
            )}
            {internalTab === 2.11 && <Fetal setInternalTab={setInternalTab} />}
            {internalTab === 2.13 && (
              <Prescription
                setInternalTab={setInternalTab}
                patientId={patientId}
              />
            )}
            {internalTab === 2.12 && (
              <Ultrasound setInternalTab={setInternalTab} />
            )}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error in Screening component:", error);
    return (
      <div className="screening-error">
        <h2>Error Loading Screening</h2>
        <p>
          There was an error loading the screening component. Please try
          refreshing the page.
        </p>
        <pre>{error.message}</pre>
      </div>
    );
  }
};

export default Screening;
