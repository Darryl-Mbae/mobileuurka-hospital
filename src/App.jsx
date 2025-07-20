import { useEffect, useState } from "react";
import "./css/Admin.css";
import SideBar from "./components/SideBar";
import DashboardPage from "./pages/DashBoardPage";
import AlertsPage from "./pages/AlertsPage";
import Patients from "./pages/Patients";
import Settings from "./pages/Settings";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "./realtime/Slices/userSlice";
import {
  initializeSocket,
  disconnectSocket,
  startHealthCheck,
  stopHealthCheck,
} from "./config/socket.js";
import Users from "./pages/Users.jsx";
import Screening from "./pages/Screening.jsx";
import { setOrganisations } from "./realtime/Slices/organizationSlice.js";
import Patient from "./pages/Patient.jsx";
import PatientIntake from "./forms/PatientIntake.jsx";
import UserForm from "./forms/UserForm.jsx";
import { useParams } from 'react-router-dom';
import { isAuthenticated } from './config/api.js';


function App() {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [internalTab, setInternalTab] = useState(null);
  const { page, id } = useParams();
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const currentUser = useSelector((s) => s.user.currentUser);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (page) {
      setActiveItem(page);
    }
    if (id) {
      setSelectedPatientId(id);
    }
  }, [page, id]);

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

        const { fetchCurrentUser } = await import('./config/api.js');
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

  // Initialize socket after user logs in
  useEffect(() => {
    if (currentUser) {
      initializeSocket(currentUser, dispatch);
      startHealthCheck(); // Start ping health check

      return () => {
        stopHealthCheck(); // Stop health check
        disconnectSocket();
      };
    }
  }, [currentUser, dispatch]);

  // Fetch organizations based on user tenants - INITIAL FETCH ONLY
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!currentUser) return;

      try {
        const { apiGet } = await import('./config/api.js');
        const data = await apiGet('/organisations/my');
        dispatch(setOrganisations(data));
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError("Failed to load organizations data");
      }
    };

    fetchOrganizations();
  }, [currentUser, dispatch]);

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
        return <Patient id={selectedPatientId}/>;
      case "Staff":
      case "Users":
        return <Users setActiveItem={setActiveItem} />;
      case "PatientIntake":
        return <PatientIntake setActiveItem={setActiveItem} />;
      case "UserForm":
        return <UserForm setActiveItem={setActiveItem} />;
      case "Screening":
        return <Screening  setInternalTab={setInternalTab} internalTab={internalTab}/>;
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
        <div></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="admin-error">
        <div>Error: {error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Require authentication
  if (!currentUser) {
    return (
      <div className="admin-auth-required">
        <div>Authentication required</div>
        <button onClick={() => navigate("/auth")}>Login</button>
      </div>
    );
  }

  return (
    <div className="admin">
      <SideBar activeItem={activeItem} setActiveItem={setActiveItem}  setInternalTab={setInternalTab}/>
      <div className={`content ${activeItem === "Patient" && "active"}`}>{renderContent()}</div>
    </div>
  );
}

export default App;
