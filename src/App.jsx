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
import { authSocketSync } from "./utils/auth-socket-sync.js";

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

  // Initialize socket connection with better management
  const socketHook = useSocket();

  // Track initial data fetch states to prevent multiple fetches
  const initialDataFetched = useRef({
    user: false,
    organizations: false,
    patients: false,
  });

  // Memoized auth headers function
  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    console.log("App useEffect - page:", page, "id:", id);
    if (page) {
      console.log("Setting activeItem to:", page);
      setActiveItem(page);

      // Reset internalTab when navigating to Screening to show the main menu
      if (page === "Screening") {
        console.log(
          "Resetting internalTab to null for Screening page, current value:",
          internalTab
        );
        setInternalTab(null);
        console.log("After reset, internalTab should be null");
      }
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

  // Handle terms acceptance
  useEffect(() => {
    if (accepted) {
      async function updateUser() {
        try {
          const res = await fetch(`${SERVER}/users/${currentUser?.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
            credentials: "include",
            body: JSON.stringify({ readTerms: true }),
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          dispatch(setUser(data));
        } catch (err) {
          console.error("Error updating user:", err);
        } finally {
          dialog.current?.close();
        }
      }

      updateUser();
    }
  }, [accepted, currentUser, SERVER, authHeaders, dispatch]);

  // Get current user with secure API - ONE TIME ONLY
  useEffect(() => {
    if (initialDataFetched.current.user) {
      return;
    }

    // Initialize auth-socket synchronization
    authSocketSync.init();

    async function getUser() {
      try {
        console.log("🔍 Checking authentication...");

        if (!isAuthenticated()) {
          console.log("❌ No token found, redirecting to auth");
          navigate("/auth");
          setLoading(false);
          return;
        }

        console.log("✅ Token found, fetching user data...");
        const { fetchCurrentUser } = await import("./config/api.js");
        const data = await fetchCurrentUser();

        console.log("✅ User data fetched successfully:", data);
        dispatch(setUser(data));
        initialDataFetched.current.user = true;
      } catch (error) {
        console.error("❌ Error fetching user:", error);

        // Check if it's an auth error
        if (
          error.message.includes("Authentication expired") ||
          error.message.includes("401")
        ) {
          console.log("🔄 Authentication expired, redirecting to login");
          localStorage.removeItem("access_token");
          navigate("/auth");
        } else {
          setError(`Failed to load user data: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, [dispatch, navigate]);

  // Fetch organizations based on user tenants - ONE TIME ONLY
  useEffect(() => {
    if (!currentUser || initialDataFetched.current.organizations) {
      return;
    }

    const fetchOrganizations = async () => {
      try {
        const { apiGet } = await import("./config/api.js");
        const data = await apiGet("/organisations/my");
        dispatch(setOrganisations(data));
        initialDataFetched.current.organizations = true;
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError("Failed to load organizations data");
      }
    };

    fetchOrganizations();
  }, [currentUser, dispatch]);

  // Fetch patients only once when user is first loaded
  useEffect(() => {
    if (!currentUser || initialDataFetched.current.patients) {
      return;
    }

    async function fetchPatients() {
      try {
        const { apiGet } = await import("./config/api.js");
        const data = await apiGet("/patients/my");

        // Optional: transform or normalize data
        const transformed = data?.map((p) => ({
          ...p,
        }));

        dispatch(setPatients(transformed));
        initialDataFetched.current.patients = true;
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        initialDataFetched.current.patients = true; // Mark as attempted even on error
      }
    }

    fetchPatients();
  }, [currentUser, dispatch]);

  // Handle page visibility changes to manage socket connections
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("📱 App backgrounded");
      } else {
        console.log("📱 App foregrounded");
        // Optionally request fresh online users when app comes back to foreground
        if (socketHook.isConnected) {
          socketHook.requestOnlineUsers();
          socketHook.requestOnlineCounts();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socketHook]);

  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Network connection restored");
      if (!socketHook.isConnected && currentUser) {
        console.log("🔄 Attempting to reconnect after network restoration...");
        setTimeout(() => {
          socketHook.manualReconnect();
        }, 1000); // Wait a bit for network to stabilize
      }
    };

    const handleOffline = () => {
      console.log("🌐 Network connection lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [socketHook, currentUser]);

  // Reset initial data fetch flags when user changes
  useEffect(() => {
    if (!currentUser) {
      initialDataFetched.current = {
        user: false,
        organizations: false,
        patients: false,
      };
    }
  }, [currentUser]);

  const renderContent = () => {
    console.log("renderContent - activeItem:", activeItem);
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

export default App;
