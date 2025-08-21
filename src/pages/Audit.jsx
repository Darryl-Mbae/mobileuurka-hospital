import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Users.css";
import SearchContainer from "../components/SearchContainer";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";


const columns = [
  {
    label: "User",
    key: "user",
    render: ({ log }) => {
      if (!log.user) return "System";
      return (
        <>
          <span>
            {log.user.name
              ?.split(" ")
              .map((w) => w.charAt(0))
              .join("")
              .toUpperCase()}
          </span>{" "}
          {log.user.name || "Unknown User"}
        </>
      );
    },
  },
  {
    label: "Action",
    key: "action",
    render: ({ log }) => (
      <span
        className={`action-badge ${log.action
          .toLowerCase()
          .replace(/[^a-z]/g, "-")}`}
      >
        {log.action}
      </span>
    ),
  },
  {
    label: "Table",
    key: "resource",
    render: ({ log }) => {
      // Remove "patient_" prefix and clean up resource name
      const cleanResource = log.resource
        ? log.resource.replace(/^patient_/i, "").replace(/_/g, " ")
        : "—";

      return <span className="resource-type">{cleanResource}</span>;
    },
  },
  {
    label: "Patient ID",
    key: "patientId",
    render: ({ log }) => {
      const patientId =
        log.metadata?.patientId ||
        log.metadata?.patient_id ||
        (log.resource && log.resource.toLowerCase().includes("patient")
          ? log.resourceId
          : null);

      return <span className="patient-id">{patientId || "—"}</span>;
    },
  },
  {
    label: "Patient Name",
    key: "patientName",
    render: ({ log, patients }) => {
      const patientId =
        log.metadata?.patientId ||
        log.metadata?.patient_id ||
        (log.resource && log.resource.toLowerCase().includes("patient")
          ? log.resourceId
          : null);

      if (!patientId) return "—";

      // Find patient in the store
      const patient = patients?.find((p) => p.id === patientId);

      return <span className="patient-name">{patient?.name || "—"}</span>;
    },
  },
  {
    label: "Timestamp",
    key: "timestamp",
    render: ({ log }) => {
      const timestamp = new Date(log.timestamp);
      const now = new Date();

      // Get time part
      const timeString = timestamp.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Check if it's today
      const isToday =
        timestamp.getDate() === now.getDate() &&
        timestamp.getMonth() === now.getMonth() &&
        timestamp.getFullYear() === now.getFullYear();

      if (isToday) {
        return `Today ${timeString}`;
      }

      // Check if it's yesterday
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      const isYesterday =
        timestamp.getDate() === yesterday.getDate() &&
        timestamp.getMonth() === yesterday.getMonth() &&
        timestamp.getFullYear() === yesterday.getFullYear();

      if (isYesterday) {
        return `Yesterday ${timeString}`;
      }

      // For other days, show date without year + time
      const dateString = timestamp.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });

      return `${dateString} ${timeString}`;
    },
  },
];

const Audit = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const patients = useSelector((state) => state.patient.patients);
  const [error, setError] = useState(null);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    action: "",
    resource: "",
    userId: "",
  });

  // Get current user and organization from Redux
  const user = useSelector((state) => state.user.currentUser);
  const organisations = useSelector(
    (state) => state.organisation.organisations
  );

  // Debug logging
  useEffect(() => {
    console.log("Audit Debug - User:", user);
    console.log("Audit Deburganisations:", organisations);
  }, [user, organisations]);

  // Get the current user's organization ID
  const getCurrentOrganizationId = () => {
    if (!user) {
      console.log("No user found");
      return null;
    }

    if (!organisations || organisations.length === 0) {
      console.log("No organisations found");
      return null;
    }

    // Try multiple approaches to find the organization
    // Approach 1: Find by user membership
    let userOrg = organisations.find((org) =>
      org.users?.some((userTenant) => userTenant.user?.id === user.id)
    );

    if (userOrg) {
      console.log("Found org via user membership:", userOrg);
      return userOrg.id;
    }

    // Approach 2: If user has organizationId directly
    if (user.organizationId) {
      console.log("Using user.organizationId:", user.organizationId);
      return user.organizationId;
    }

    // Approach 3: Use first organization if user is admin
    if (user.role === "admin" && organisations.length > 0) {
      console.log("Using first org for admin:", organisations[0]);
      return organisations[0].id;
    }

    console.log("No organization found for user");
    return null;
  };

  // Add pagination hook
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
    getPaginatedData,
  } = usePagination({
    totalItems: filteredLogs.length,
    initialItemsPerPage: 15,
    initialPage: 1,
  });

  const currentPageLogs = getPaginatedData(filteredLogs);
  const url = import.meta.env.VITE_SERVER_URL;

  // Fetch audit logs for current organization
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const organizationId = getCurrentOrganizationId();

      if (!organizationId) {
        throw new Error("No organization found for current user");
      }

      const token = localStorage.getItem("access_token");
      console.log(token);

      // Try organization-specific endpoint first
      let response = await fetch(
        `${url}/audit-logs/organization/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response:", response);

      // Check if response is HTML (indicates endpoint doesn't exist)
      const contentType = response.headers.get("content-type");
      const isHtml = contentType && contentType.includes("text/html");

      if (!response.ok || isHtml) {
        console.log(
          "Organization endpoint not available, trying general endpoint..."
        );

        // Fall back to general endpoint
        response = await fetch(`${url}/audit-logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch audit logs: ${response.status} ${response.statusText}`
          );
        }
      }

      // Check if response is JSON
      const responseContentType = response.headers.get("content-type");
      if (
        !responseContentType ||
        !responseContentType.includes("application/json")
      ) {
        throw new Error(
          "Audit logs API is not available. Please check your backend configuration."
        );
      }

      const data = await response.json();
      console.log("Fetched audit logs:", data);

      // Handle different response structures
      let logs = data.auditLogs || data.data || data || [];

      // If we used the general endpoint, filter by organization
      if (Array.isArray(logs) && logs.length > 0) {
        // Only filter if we have organizationId in the logs
        if (logs[0].organizationId) {
          logs = logs.filter((log) => log.organizationId === organizationId);
        }
      }

      setAuditLogs(logs);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when we have user and organization data
    if (user && organisations && organisations.length > 0) {
      fetchAuditLogs();
    }
  }, [user, organisations]);

  // Filter logs based on search term and filters
  useEffect(() => {
    if (auditLogs) {
      let filtered = auditLogs.filter((log) => {
        const matchesSearch =
          log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.organization?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesAction = !filters.action || log.action === filters.action;
        const matchesResource =
          !filters.resource || log.resource === filters.resource;
        const matchesUser = !filters.userId || log.userId === filters.userId;

        return matchesSearch && matchesAction && matchesResource && matchesUser;
      });

      setFilteredLogs(filtered);
    }
  }, [auditLogs, searchTerm, filters]);

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    handlePageChange(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    handlePageChange(1);
  };

  // Get unique values for filter dropdowns
  const uniqueActions = [...new Set(auditLogs.map((log) => log.action))].filter(
    Boolean
  );
  const uniqueResources = [
    ...new Set(auditLogs.map((log) => log.resource)),
  ].filter(Boolean);

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-state">
          <p>Loading audit logs for your organization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-page">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={fetchAuditLogs}>Retry</button>
        </div>
      </div>
    );
  }

  // Check if user has access to organization data
  if (!user || !organisations || organisations.length === 0) {
    return (
      <div className="users-page">
        <div className="loading-state">
          <p>Loading organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page audit-page">
      <div className="toolbar">
        <div className="count">
          Action Logs 
          
          <span>{filteredLogs?.length || 0}</span>
        </div>
        <div className="search">
          <SearchContainer
            placeholder="Search audit logs..."
            onSearch={handleSearch}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            showAddButton={false}
          />
        </div>
      </div>

      {/* Filters */}
      {/* <div className="filters-section">
        <div className="filter-group">
          <label>Action</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange("action", e.target.value)}
          >
            <option value="">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Resource</label>
          <select
            value={filters.resource}
            onChange={(e) => handleFilterChange("resource", e.target.value)}
          >
            <option value="">All Resources</option>
            {uniqueResources.map((resource) => (
              <option key={resource} value={resource}>
                {resource}
              </option>
            ))}
          </select>
        </div>
        {(filters.action || filters.resource) && (
          <button
            className="clear-filters"
            onClick={() => setFilters({ action: "", resource: "", userId: "" })}
          >
            Clear Filters
          </button>
        )}
      </div> */}

      <div className="lists">
        <div className="title">
          {columns.map((col) => (
            <div key={col.key} className={col.key}>
              {col.label}
            </div>
          ))}
        </div>

        {currentPageLogs?.length > 0 ? (
          currentPageLogs.map((log) => (
            <div className="list" key={log.id}>
              {columns.map((col) => (
                <div key={col.key} className={col.key}>
                  {col.render ? col.render({ log, patients }) : log[col.key] || "—"}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="no-results">
            {searchTerm || filters.action || filters.resource
              ? `No audit logs found matching your criteria`
              : "No audit logs found."}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredLogs?.length > 0 && (
        <Pagination
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showPageInfo={true}
          showItemsPerPageSelector={true}
          itemsPerPageOptions={[10, 15, 25, 50]}
        />
      )}
    </div>
  );
};

export default Audit;
