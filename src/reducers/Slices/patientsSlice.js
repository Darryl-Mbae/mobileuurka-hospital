// slices/patientSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  patients: [],
  selectedPatient: null,
};

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    setPatients: (state, action) => {
      state.patients = action.payload;
    },
    addPatient: (state, action) => {
      state.patients.push(action.payload);
    },
    updatePatient: (state, action) => {
      const index = state.patients.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
    },
    deletePatient: (state, action) => {
      state.patients = state.patients.filter((p) => p.id !== action.payload);
    },
    selectPatient: (state, action) => {
      state.selectedPatient = action.payload;
    },
    clearSelectedPatient: (state) => {
      state.selectedPatient = null;
    },
    updatePatientMedicalRecord: (state, action) => {
      const { patientId, recordType, recordData, eventType } = action.payload;
      const patientIndex = state.patients.findIndex((p) => p.id === patientId);

      if (patientIndex !== -1) {
        const patient = state.patients[patientIndex];

        // Initialize the medical record array if it doesn't exist
        switch (recordType) {
          case "triage":
            patient.triages = patient.triages || [];
            if (eventType === "created") {
              patient.triages.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.triages.findIndex(
                (t) => t.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.triages[recordIndex] = recordData;
              }
            }
            break;

          case "labwork":
            patient.labworks = patient.labworks || [];
            if (eventType === "created") {
              patient.labworks.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.labworks.findIndex(
                (l) => l.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.labworks[recordIndex] = recordData;
              }
            }
            break;

          case "currentpregnancyinfo":
            patient.currentPregnancies = patient.currentPregnancies || [];
            if (eventType === "created") {
              patient.currentPregnancies.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.currentPregnancies.findIndex(
                (p) => p.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.currentPregnancies[recordIndex] = recordData;
              }
            }
            break;

          case "infection":
            patient.infections = patient.infections || [];
            if (eventType === "created") {
              patient.infections.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.infections.findIndex(
                (i) => i.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.infections[recordIndex] = recordData;
              }
            }
            break;

          case "fetalInfo":
            patient.fetalInfos = patient.fetalInfos || [];
            if (eventType === "created") {
              patient.fetalInfos.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.fetalInfos.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.fetalInfos[recordIndex] = recordData;
              }
            }
            break;

          case "medication":
            patient.medications = patient.medications || [];
            if (eventType === "created") {
              patient.medications.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.medications.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.medications[recordIndex] = recordData;
              }
            }
            break;

          case "visit":
            patient.visits = patient.visits || [];
            if (eventType === "created") {
              patient.visits.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.visits.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.visits[recordIndex] = recordData;
              }
            }
            break;
          case "patientLifestyle":
            patient.patientLifestyles = patient.patientLifestyles || [];
            if (eventType === "created") {
              patient.patientLifestyles.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.patientLifestyles.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.patientLifestyles[recordIndex] = recordData;
              }
            }
            break;

          case "note":
            patient.notes = patient.notes || [];
            if (eventType === "created") {
              patient.notes.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.notes.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.notes[recordIndex] = recordData;
              }
            }
            break;

          case "allergy":
            patient.allergies = patient.allergies || [];
            if (eventType === "created") {
              patient.allergies.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.allergies.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.allergies[recordIndex] = recordData;
              }
            }
            break;

          case "explanation":
            patient.explanations = patient.explanations || [];
            if (eventType === "created") {
              patient.explanations.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.explanations.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.explanations[recordIndex] = recordData;
              }
            }
            break;

          case "riskassessment":
            patient.riskassessments = patient.riskassessments || [];
            if (eventType === "created") {
              patient.riskassessments.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.riskassessments.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.riskassessments[recordIndex] = recordData;
              }
            }
            break;

          case "alert":
            patient.alerts = patient.alerts || [];
            if (eventType === "created") {
              patient.alerts.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.alerts.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.alerts[recordIndex] = recordData;
              }
            } else if (eventType === "deleted") {
              const recordIndex = patient.alerts.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.alerts.splice(recordIndex, 1);
              }
            }
            break;

          case "ultrasound":
            patient.ultrasounds = patient.ultrasounds || [];
            if (eventType === "created") {
              patient.ultrasounds.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.ultrasounds.findIndex(
                (f) => f.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.ultrasounds[recordIndex] = recordData;
              }
            }
            break;

          case "patientHistory":
            patient.patientHistories = patient.patientHistories || [];
            if (eventType === "created") {
              patient.patientHistories.push(recordData);
            } else if (eventType === "updated") {
              const recordIndex = patient.patientHistories.findIndex(
                (h) => h.id === recordData.id
              );
              if (recordIndex !== -1) {
                patient.patientHistories[recordIndex] = recordData;
              }
            }
            break;

          default:
            console.warn(`Unknown medical record type: ${recordType}`);
        }

        // Update the patient's last updated timestamp
        patient.lastUpdated = new Date().toISOString();

        // Also update selected patient if it's the same patient
        if (state.selectedPatient && state.selectedPatient.id === patientId) {
          state.selectedPatient = patient;
        }
      }
    },
  },
});

export const {
  setPatients,
  addPatient,
  updatePatient,
  deletePatient,
  selectPatient,
  clearSelectedPatient,
  updatePatientMedicalRecord,
} = patientSlice.actions;

export default patientSlice.reducer;
