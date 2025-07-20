// slices/organisationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  organisation: null,
  organisations: [],
};

const organisationSlice = createSlice({
  name: 'organisation',
  initialState,
  reducers: {
    setOrganisation: (state, action) => {
      state.organisation = action.payload;
    },
    setOrganisations: (state, action) => {
      state.organisations = action.payload;
    },
    addOrganisation: (state, action) => {
      state.organisations.push(action.payload);
    },
    updateOrganisation: (state, action) => {
      const index = state.organisations.findIndex(
        (org) => org.id === action.payload.id
      );
      if (index !== -1) {
        state.organisations[index] = action.payload;
      }
    },
    removeOrganisation: (state, action) => {
      state.organisations = state.organisations.filter(
        (org) => org.id !== action.payload
      );
    },
    clearOrganisations: (state) => {
      state.organisations = [];
      state.organisation = null;
    },
  },
});

export const {
  setOrganisation,
  setOrganisations,
  addOrganisation,
  updateOrganisation,
  removeOrganisation,
  clearOrganisations,
} = organisationSlice.actions;

export default organisationSlice.reducer;
