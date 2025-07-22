import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../css/Patients.css";
import { setPatients } from "../realtime/Slices/patientsSlice";
import SearchContainer from "../components/SearchContainer";
import { useNavigate } from "react-router-dom";

const columns = [
  { label: "Name", key: "name" },
  { label: "ID", key: "id" },
  {
    label: "National ID",
    key: "patientId",
    render: ({ patient }) => maskId(patient.patientId),
  }, 
  {
    label: "Hospital",
    key: "hospital",
    render: ({ patient }) =>  patient.hospital || "—",
  },
  {
    label: "Risk",
    key: "risk",
    render: ({ patient }) => patient.risk || "—",
  },
  {
    label: "Reason",
    key: "reason",
    render: ({ patient }) => patient.reasonForVisit || "—",
  },
  {
    label: "Suspected Diagnosed Diseases",
    key: "suspected",
    render: ({ patient }) =>
      patient.suspectedDiseases?.length
        ? patient.suspectedDiseases.join(", ")
        : "—",
  },
];

function maskId(id) {
  if (!id) return '—'; // fallback for missing/null/undefined
  if (typeof id !== 'string') id = String(id);

  const lastFour = id.slice(-4);
  return `*****${lastFour}`;
}


const Patients = ({ setActiveItem , setSelectedPatientId}) => {
  const dispatch = useDispatch();
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const patients = useSelector((state) => state.patient.patients);
  const [filteredPatients, setFilteredPatients] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const navigate = useNavigate();
  


  useEffect(() => {
    // Only fetch initially if we don't have patients data
    if (!patients || patients.length === 0) {
      fetchPatients();
    }
  }, []);





  useEffect(() => {
    if (patients) {
      const filtered = patients.filter(patient => 
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.hospital?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.reasonForVisit?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [patients, searchTerm]);

  async function fetchPatients() {
    try {
      const res = await fetch(`${SERVER}/patients/my`, {
        credentials: "include",
      });

      const data = await res.json();
      console.log(data);


      // Optional: transform or normalize data
      const transformed = data.map((p) => ({
        ...p,
      }));

      dispatch(setPatients(transformed));
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  }

  const handleClick = (patientId) => {
    
    navigate(`/Patient/${patientId}`);
    // setSelectedPatientId(patientId);
    // setActiveItem("Patient");
  };

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
  };

  const handleAddPatient = () => {
    setActiveItem("PatientIntake");
  };

  const handleRefresh = () => {
    
  };


  return (
    <div className="patients-page">
      <div className="toolbar">
        <div className="count">
          All Patients <span>{patients?.length || 0}</span>
        </div>
        <div className="search">
          <SearchContainer
            placeholder="Search patients..."
            onSearch={handleSearch}
            onAdd={handleAddPatient}
            addButtonText="Add Patient"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={handleRefresh}
            showRefresh={true}
          />
        </div>
      </div>

      <div className="lists">
        <div className="title">
          {columns.map((col) => (
            <div key={col.key} className={col.key}>
              {col.label}
            </div>
          ))}
        </div>

        {filteredPatients?.length > 0 ? (
          filteredPatients.map((patient) => (
            <div className="list" key={patient.id} onClick={() => handleClick(patient.id)}>
              {columns.map((col) => (
                <div key={col.key} className={col.key}>
                  {col.render
                    ? col.render({ patient })
                    : patient[col.key] || "—"}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="no-results">
            {searchTerm ? `No patients found matching "${searchTerm}"` : "No patients found."}
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;
