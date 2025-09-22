import { useEffect, useRef, useState } from "react";
import "./css/Admin.css";
import SideBar from "./components/SideBar";
import DashboardPage from "./pages/DashBoardPage";
import AlertsPage from "./pages/AlertsPage";
import Patients from "./pages/Patients";
import Settings from "./pages/Settings";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "./reducers/Slices/userSlice.js";
import Users from "./pages/Users.jsx";
import Audit from "./pages/Audit.jsx";
import Screening from "./pages/Screening.jsx";
import { setOrganisations } from "./reducers/Slices/organizationSlice.js";
import Patient from "./pages/Patient.jsx";
import PatientIntake from "./forms/PatientIntake.jsx";
import UserForm from "./forms/UserForm.jsx";
import { useParams } from "react-router-dom";
import { isAuthenticated } from "./config/api.js";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Terms from "./components/Terms.jsx";
import pdfurl from "./assets/terms.pdf";
import Feedback from "./pages/Feedback.jsx";
import FeedbackForm from "./forms/FeedbackForm.jsx";
import { setPatients } from "./reducers/Slices/patientsSlice.js";
import useSocket from "./hooks/useSocket.js";
import ConnectionStatus from "./components/ConnectionStatus.jsx";

function App() {
  const [activeItem, setActiveItem] = useState("Patients");
  const [loading, setLoading] = useState(true);
  const dialog = useRef();
  const [error, setError] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [internalTab, setInternalTab] = useState(null);
  const { page, id } = useParams();
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const [accepted, setAccepted] = useState(false);
  const currentUser = useSelector((state) => state.user.currentUser);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Initialize socket connection
  const { isConnected, connectionStatus } = useSocket();

  useEffect(() => {
    if (page) {
      setActiveItem(page);
    }
    if (id) {
      setSelectedPatientId(id);
    }
  }, [page, id]);

  useEffect(() => {
    if (currentUser && dialog.current && !currentUser.readTerms) {
      dialog.current.show();
    }
  }, [currentUser, dialog]);

  function authHeaders() {
    const token = localStorage.getItem("access_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }


  useEffect(() => {
    if (accepted) {
      async function updateUser() {
        try {
          const res = await fetch(`${SERVER}/users/${currentUser?.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(), // Include auth headers

            },
            credentials: "include",
            body: JSON.stringify({ readTerms: true }), // 👈 set flag
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          dispatch(setUser(data)); // update redux or context
        } catch (err) {
          console.error("Error updating user:", err);
        } finally {
          dialog.current?.close();
        }
      }

      updateUser();
    }
  }, [accepted]);

  // Get current user with secure API
  useEffect(() => {
    async function getUser() {
      try {
        // Check if user is authenticated first
        if (!isAuthenticated()) {
          navigate("/auth");
          setLoading(false);
          return;
        }

        const { fetchCurrentUser } = await import("./config/api.js");
        const data = await fetchCurrentUser();

        dispatch(setUser(data));
      } catch (error) {
        console.error("Error fetching user:", error);
        setError("Failed to load user data");
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [dispatch, navigate]);

  // Fetch organizations based on user tenants - INITIAL FETCH ONLY
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!currentUser) return;

      try {
        const { apiGet } = await import("./config/api.js");
        const data = await apiGet("/organisations/my");
        dispatch(setOrganisations(data));
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError("Failed to load organizations data");
      }
    };

    fetchOrganizations();
  }, [currentUser, dispatch]);

  // Fetch patients only once when user is first loaded
  const [initialPatientsFetched, setInitialPatientsFetched] = useState(false);

  useEffect(() => {
    if (currentUser && !initialPatientsFetched) {
      fetchPatients();
    }

    async function fetchPatients() {
      try {
        const { apiGet } = await import("./config/api.js");
        const res = await apiGet("/patients/my");

        const data = await res

        // Optional: transform or normalize data
        const transformed = data?.map((p) => ({
          ...p,
        }));

        dispatch(setPatients(transformed));
        setInitialPatientsFetched(true);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setInitialPatientsFetched(true); // Mark as attempted even on error
      }
    }
  }, [currentUser, initialPatientsFetched]); // Only run once per user session

  const renderContent = () => {
    switch (activeItem) {
      case "Dashboard":
        return <DashboardPage />;
      case "Patients":
        return (
          <Patients
            setActiveItem={setActiveItem}
            setSelectedPatientId={setSelectedPatientId}
            selectedPatientId={selectedPatientId}
          />
        );
      case "Patient":
        return <Patient id={selectedPatientId} />;
      case "Staff":
      case "Users":
        return <Users setActiveItem={setActiveItem} />;
      case "Logs":
        return <Audit />;
      case "PatientIntake":
        return <PatientIntake setActiveItem={setActiveItem} />;
      case "Feedback":
        return <Feedback setActiveItem={setActiveItem} />;
      case "UserForm":
        return <UserForm setActiveItem={setActiveItem} />;
      case "FeedbackForm":
        return <FeedbackForm setActiveItem={setActiveItem} />;
      case "Screening":
        return (
          <Screening
            setInternalTab={setInternalTab}
            internalTab={internalTab}
          />
        );
      case "Settings":
        return <Settings />;
      case "Alerts":
        return <AlertsPage />;
      default:
        return <div>Select a section</div>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading">
          <div className="image">
            <img src="/logo.png" alt="" />
          </div>
          <DotLottieReact
            src="https://lottie.host/76c8d5c4-8758-498c-8e7c-6acce91d7032/utjeKB11PP.lottie"
            loop
            autoplay
            style={{ width: "70%", margin: "-20px auto" }}
          />
        </div>
      </div>
    );
  }
  else {
    if (error) {
      return <div className="admin-error">{error}</div>;
    }
    return (
      <div className="admin">
        <Terms ref={dialog} pdfUrl={pdfurl} onAccept={() => setAccepted(true)} />
        <SideBar
          activeItem={activeItem}
          setActiveItem={setActiveItem}
          setInternalTab={setInternalTab}
        />
        <div className={`content ${activeItem === "Patient" && "active"}`}>
          {/* <ConnectionStatus /> */}
          {renderContent()}
        </div>
      </div>
    );
  }

}

export default App;
