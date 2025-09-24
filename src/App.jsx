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
  const currentUser = useSelector((state) => state.user.currentUser);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Initialize socket connection with better management
  const socketHook = useSocket();
  
  // Track initial data fetch states to prevent multiple fetches
  const initialDataFetched = useRef({
    user: false,
    organizations: false,
    patients: false
  });

  // Add a loading timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Loading timeout reached, forcing loading to false");
        setLoading(false);
        if (!currentUser && !error) {
          setError("Loading timeout - please refresh the page");
        }
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading, currentUser, error]);

  // Memoized auth headers function
  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("access_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }, []);

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

  // Get current user with secure API - ONE TIME ONLY with better error handling
  useEffect(() => {
    if (initialDataFetched.current.user) {
      return;
    }

    async function getUser() {
      console.log("🔄 Fetching current user...");
      
      try {
        // Check authentication first
        if (!isAuthenticated()) {
          console.log("❌ User not authenticated, redirecting to auth");
          navigate("/auth");
          setLoading(false);
          return;
        }

        const { fetchCurrentUser } = await import("./config/api.js");
        console.log("📡 Making API call to fetch user...");
        const data = await fetchCurrentUser();
        
        console.log("✅ User data received:", data?.id);
        dispatch(setUser(data));
        initialDataFetched.current.user = true;
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        setError(`Failed to load user data: ${error.message}`);
        
        // If it's an auth error, redirect to login
        if (error.status === 401 || error.status === 403) {
          console.log("🔐 Authentication error, redirecting to auth");
          navigate("/auth");
        }
      } finally {
        console.log("🏁 User fetch completed, setting loading to false");
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

  // Handle page visibility changes to manage socket connections - with debouncing
  useEffect(() => {
    let visibilityTimer;
    let lastVisibilityChange = 0;

    const handleVisibilityChange = () => {
      const now = Date.now();
      
      // Debounce rapid visibility changes (ignore if less than 2 seconds apart)
      if (now - lastVisibilityChange < 2000) {
        return;
      }
      
      lastVisibilityChange = now;
      
      // Clear any existing timer
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
      }

      // Add delay to prevent rapid firing
      visibilityTimer = setTimeout(() => {
        if (document.hidden) {
          console.log("📱 App backgrounded");
        } else {
          console.log("📱 App foregrounded");
          // Only request fresh data if socket is connected and user exists
          if (socketHook.isConnected && currentUser) {
            socketHook.requestOnlineUsers();
            socketHook.requestOnlineCounts();
          }
        }
      }, 500);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
      }
    };
  }, [socketHook, currentUser]);

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
        patients: false
      };
    }
  }, [currentUser]);

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

  // Loading state with retry option
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
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <p>Loading your dashboard...</p>
            <button 
              onClick={() => {
                console.log("🔄 Manual retry requested");
                setLoading(false);
                setError(null);
                // Reset fetch flags to retry
                initialDataFetched.current = {
                  user: false,
                  organizations: false,
                  patients: false
                };
                // Trigger re-fetch by setting loading back to true after a brief moment
                setTimeout(() => setLoading(true), 100);
              }}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="admin-error">
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <div style={{ marginTop: "20px" }}>
            <button 
              onClick={() => {
                console.log("🔄 Error retry requested");
                setError(null);
                setLoading(true);
                // Reset fetch flags to retry
                initialDataFetched.current = {
                  user: false,
                  organizations: false,
                  patients: false
                };
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px"
              }}
            >
              Retry
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = "/auth";
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Re-login
            </button>
          </div>
        </div>
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
        <ConnectionStatus />
        {renderContent()}
      </div>
    </div>
  );
}

export default App;