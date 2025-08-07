import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import "../css/Alerts.css";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { TiTick, TiTimes } from "react-icons/ti";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoFlagSharp } from "react-icons/io5";
import { alertService } from "../services/alertService.js";

const Alerts = forwardRef(function Alerts({ patient }, ref) {
  const dialog = useRef();
  const [mounted, setMounted] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  // Get alerts from patient data instead of Redux alerts state
  const alerts = patient?.alerts || [];

  const alertsPerPage = 5;

  const toggleAlert = (alertId) => {
    setSelectedAlerts((prev) =>
      prev.includes(alertId)
        ? prev.filter((id) => id !== alertId)
        : [...prev, alertId]
    );
  };

  const deleteSelected = async () => {
    if (!patient) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete the alerts? This cannot be undone."
    );
    if (!confirmDelete) return;
    if (selectedAlerts.length === 0) {
      console.warn("No alerts selected for deletion");
      return;
    }

    try {
      // Delete each selected alert individually using the medical record API
      const deletePromises = selectedAlerts.map((alertId) =>
        alertService.deleteAlert(alertId)
      );

      await Promise.all(deletePromises);
      console.log("Deleted alerts:", selectedAlerts);

      // Update local state
      setSelectedAlerts([]);
      setSelectAll(false);

      // Optional: Show success message
      alert("Selected alerts deleted successfully!");
    } catch (error) {
      console.error("Error deleting selected alerts:", error);
      alert("Failed to delete selected alerts");
    }
  };

  const deleteAll = async () => {
    if (!patient) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete ALL alerts? This cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      // Delete all patient alerts individually using the medical record API
      const allAlertIds = alerts.map((alert) => alert.id);
      const deletePromises = allAlertIds.map((alertId) =>
        alertService.deleteAlert(alertId)
      );

      await Promise.all(deletePromises);
      console.log("All alerts deleted for patient:", patient.id);

      // Update local state
      setSelectedAlerts([]);
      setSelectAll(false);

      // Optional: Show success message
      alert("All alerts deleted successfully!");
    } catch (error) {
      console.error("Error deleting all alerts:", error);
      alert("Failed to delete all alerts");
    }
  };

  const categorizeAlerts = (alerts) => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const categorized = {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    };

    alerts.forEach((alert) => {
      const alertDate = new Date(alert.timestamp);

      if (alertDate >= today) {
        categorized.today.push(alert);
      } else if (alertDate >= yesterday) {
        categorized.yesterday.push(alert);
      } else if (alertDate >= lastWeek) {
        categorized.lastWeek.push(alert);
      } else if (alertDate >= lastMonth) {
        categorized.lastMonth.push(alert);
      } else {
        categorized.older.push(alert);
      }
    });

    return categorized;
  };

  useImperativeHandle(ref, () => ({
    show() {
      dialog.current?.showModal();
    },
    close() {
      dialog.current?.close();
      markUnreadAsRead();
    },
  }));

  const markUnreadAsRead = async () => {
    if (!patient) return;

    const unreadAlerts = alerts.filter((a) => !a.read);

    if (unreadAlerts.length === 0) return;

    try {
      // Update each unread alert individually using the medical record API
      const updatePromises = unreadAlerts.map((alert) =>
        alertService.updateAlert(alert.id, { read: true })
      );

      await Promise.all(updatePromises);
      console.log(
        "Marked alerts as read:",
        unreadAlerts.map((a) => a.id)
      );

      // Note: Patient state updates will be handled via socket events
    } catch (err) {
      console.error("Error marking alerts as read:", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  // Patient validation - handle cases where no patient is selected
  if (!patient) {
    return createPortal(
      <dialog className="alerts-dialog" ref={dialog}>
        <TiTimes onClick={() => ref.current?.close()} className="cancel" />
        <div className="container">
          <div className="alerts">
            <div className="alert-section">
              <p>Please select a patient to view alerts.</p>
            </div>
          </div>
        </div>
      </dialog>,
      document.body
    );
  }

  const filteredAlerts = showFlaggedOnly
    ? alerts.filter((a) => a.flagged)
    : alerts;

  const categorizedAlerts = categorizeAlerts(filteredAlerts);

  const flatAlerts = Object.entries(categorizedAlerts).flatMap(
    ([category, items]) => items.map((item) => ({ ...item, category }))
  );

  const totalPages = Math.ceil(flatAlerts.length / alertsPerPage);
  const paginatedAlerts = flatAlerts.slice(
    (currentPage - 1) * alertsPerPage,
    currentPage * alertsPerPage
  );

  const groupedPaginated = paginatedAlerts.reduce((acc, alert) => {
    if (!acc[alert.category]) acc[alert.category] = [];
    acc[alert.category].push(alert);
    return acc;
  }, {});

  const formatAlertDate = (isoString) => {
    const date = new Date(isoString);

    const options = {
      weekday: "long",
      day: "2-digit",
      month: "short",
    };

    return new Intl.DateTimeFormat("en-GB", options).format(date);
  };

  const renderAlertSection = (title, alerts) => {
    if (alerts.length === 0) return null;

    return (
      <div className="alert-section">
        <h3 className="time-category">{title}</h3>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`alert ${
              (selectedAlerts.includes(alert.id) ? "active" : "",
              alert.flagged ? "flagged" : "")
            }`}
            onClick={() => toggleAlert(alert.id)}
          >
            <div className="message-box">
              <div
                className={`custom-checkbox ${
                  selectedAlerts.includes(alert.id) ? "checked" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAlert(alert.id);
                }}
              ></div>
              <div className="message">{alert.alert}</div>
              <div className="timestamp">
                {formatAlertDate(alert.timestamp)}
              </div>
            </div>
            {alert.flagged && <IoFlagSharp color="red" />}
          </div>
        ))}
      </div>
    );
  };

  return createPortal(
    <dialog className="alerts-dialog" ref={dialog}>
      <TiTimes onClick={() => ref.current?.close()} className="cancel" />

      <div className="container">
        <div className="options">
          <div
            className={selectAll ? "select-all active" : "select-all"}
            onClick={() => {
              setSelectAll((prev) => !prev);
              const ids = paginatedAlerts.map((a) => a.id);
              setSelectedAlerts(selectAll ? [] : ids);
            }}
          >
            {selectAll && <TiTick />}
          </div>
          <div
            className={`flagged ${showFlaggedOnly ? "active" : ""}`}
            onClick={() => setShowFlaggedOnly((prev) => !prev)}
          >
            <IoFlagSharp color="red" />
            Flagged
          </div>
          {selectedAlerts.length === filteredAlerts.length &&
          filteredAlerts.length > 0 ? (
            <div className="delete" onClick={deleteAll}>
              <RiDeleteBin6Line />
              Delete All
            </div>
          ) : (
            <div className="delete" onClick={deleteSelected}>
              <RiDeleteBin6Line />
              Delete
            </div>
          )}
          <div className="pagination">
            <p>
              Page {currentPage} of {totalPages || 1}
            </p>
            <div className="pages-button">
              <div
                className={`prev p-btn ${currentPage === 1 ? "disabled" : ""}`}
                onClick={() =>
                  currentPage > 1 && setCurrentPage((prev) => prev - 1)
                }
              >
                <FaAngleLeft />
              </div>
              <div
                className={`next p-btn ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
                onClick={() =>
                  currentPage < totalPages && setCurrentPage((prev) => prev + 1)
                }
              >
                <FaAngleRight />
              </div>
            </div>
          </div>
        </div>
        <div className="alerts">
          {flatAlerts.length === 0 ? (
            <div className="alert-section">
              <p>No alerts found for this patient.</p>
            </div>
          ) : (
            Object.entries(groupedPaginated).map(([category, items]) =>
              renderAlertSection(
                category.charAt(0).toUpperCase() + category.slice(1),
                items
              )
            )
          )}
        </div>
      </div>
    </dialog>,
    document.body
  );
});

export default Alerts;
