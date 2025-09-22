import { useEffect, useRef, useState, useCallback } from "react";
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
  const [initialPatientsFetched, setInitialPatientsFetched] = useState(false);
  const currentUser = useSelector((state) => state.user.currentUser);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Initialize socket connection
  const { isConnected, connectionStatus } = useSocket();

  // Handle URL params
  useEffect(() => {
    if (page) {
      setActiveItem(page);
    }
    if (id) {
      setSelectedPatientId(id);
    }
  }, [page, id]);

  // Handle terms dialog
  useEffect(() => {
    if (currentUser && dialog.current && !currentUser.readTerms) {
      dialog.current.show();
    }
  }, [currentUser, dialog]);

  // Handle terms acceptance
  useEffect(() => {
    if (!accepted || !currentUser) return;

    let isMounted = true;

    async function updateUser() {
      try {
        const res = await fetch(`${SERVER}/users/${currentUser?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ readTerms: true }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if (isMounted) {
          dispatch(setUser(data));
        }
      } catch (err) {
        console.error("Error updating user:", err);
      } finally {
        if (isMounted) {
          dialog.current?.close();
        }
      }
    }

    updateUser();

    return () => { isMounted = false; };
  }, [accepted, currentUser, SERVER, dispatch]);

  // Get current user with secure API
  useEffect(() => {
    let isMounted = true;

    async function getUser() {
      try {
        // Check if user is authenticated first
        if (!isAuthenticated()) {
          if (isMounted) {
            navigate("/auth", { replace: true });
            setLoading(false);
          }
          return;
        }

        const { fetchCurrentUser } = await import("./config/api.js");
        const data = await fetchCurrentUser();

        if (isMounted) {
          dispatch(setUser(data));
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        if (isMounted) {
          setError("Failed to load user data");
          navigate("/auth", { replace: true });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    getUser();

    return () => { isMounted = false; };
  }, [dispatch, navigate]);

  // Fetch organizations based on user tenants - INITIAL FETCH ONLY
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    const fetchOrganizations = async () => {
      try {
        const { apiGet } = await import("./config/api.js");
        const data = await apiGet("/organisations/my");
        
        if (isMounted) {
          dispatch(setOrganisations(data));
        }
      } catch (err) {
        console.error("Error fetching organizations:", err);
        if (isMounted) {
          setError("Failed to load organizations data");
        }
      }
    };

    fetchOrganizations();

    return () => { isMounted = false; };
  }, [currentUser, dispatch]);

  // Memoized function to fetch patients
  const fetchPatients = useCallback(async () => {
    if (!currentUser || initialPatientsFetched) return;

    try {
      const res = await fetch(`${SERVER}/patients/my`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

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
  }, [currentUser, initialPatientsFetched, SERVER, dispatch]);

  // Fetch patients only once when user is first loaded
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

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

  // Retry function without full page reload
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setInitialPatientsFetched(false);
    // The useEffects will re-run and fetch data again
  }, []);

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

  // Error state
  if (error) {
    return (
      <div className="admin-error">
        <div>Error: {error}</div>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  // Require authentication
  if (!currentUser) {
    return (
      <div className="admin-auth-required">
        <div>Authentication required</div>
        <button onClick={() => navigate("/auth", { replace: true })}>Login</button>
      </div>
    );
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

export default App;