// slices/patientSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  patients: [],
  selectedPatient: null,
};

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    setPatients: (state, action) => {
      state.patients = action.payload;
    },
    addPatient: (state, action) => {
      state.patients.push(action.payload);
    },
    updatePatient: (state, action) => {
      const index = state.patients.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
    },
    deletePatient: (state, action) => {
      state.patients = state.patients.filter(p => p.id !== action.payload);
    },
    selectPatient: (state, action) => {
      state.selectedPatient = action.payload;
    },
    clearSelectedPatient: (state) => {
      state.selectedPatient = null;
    }
  },
});

export const {
  setPatients,
  addPatient,
  updatePatient,
  deletePatient,
  selectPatient,
  clearSelectedPatient
} = patientSlice.actions;

export default patientSlice.reducer;
