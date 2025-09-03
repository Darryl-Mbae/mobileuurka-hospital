import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown, FiCopy, FiRefreshCw } from "react-icons/fi";

const UserForm = ({ setActiveItem }) => {
  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "member",
    organizationId: "",
    password: "",
    hospitals: [],
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [organisations, setOrganisations] = useState([]);
  const [availableHospitals, setAvailableHospitals] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const currentUser = useSelector((s) => s.user.currentUser);
  const organisations_store = useSelector((s) => s.organisation.organisations);
  const SERVER = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    fetchOrganisations();
    generatePassword(); // Generate initial password
  }, []);

  useEffect(() => {
    // Extract tenants from organizations store
    if (organisations_store && organisations_store.length > 0) {
      const tenants = organisations_store.flatMap(
        (org) =>
          org.tenants?.map((tenant) => ({
            id: tenant.id,
            name: tenant.name,
            organizationId: org.id,
          })) || []
      );
      setAvailableHospitals(tenants);
    }
  }, [organisations_store]);

  // Filter hospitals based on selected organization
  const getFilteredHospitals = () => {
    if (!formData.organizationId) return [];
    return availableHospitals.filter(
      (hospital) => hospital.organizationId === formData.organizationId
    );
  };

  const fetchOrganisations = async () => {
    try {
      const response = await fetch(`${SERVER}/organisations/my`, {
        credentials: "include",
      });
      const data = await response.json();
      setOrganisations(data);
    } catch (error) {
      console.error("Error fetching organisations:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-split full name into first/last names
      if (name === "name") {
        const [firstName, ...lastNameParts] = value.split(" ");
        updated.firstName = firstName || "";
        updated.lastName = lastNameParts.join(" ") || "";
      }

      return updated;
    });
    setError(""); // Clear error when user types
  };

  const handleHospitalChange = (hospitalId) => {
    setFormData((prev) => {
      const updatedHospitals = prev.hospitals.includes(hospitalId)
        ? prev.hospitals.filter((id) => id !== hospitalId)
        : [...prev.hospitals, hospitalId];

      return {
        ...prev,
        hospitals: updatedHospitals,
      };
    });
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.password);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    // Validate phone number if provided
    if (formData.phone && formData.phone.trim()) {
      if (!formData.phone.startsWith('+')) {
        setError('Phone number must be in international format starting with + (e.g., +254712345678)');
        return false;
      }
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        setError('Invalid phone number format. Please use international format: +[country code][number]');
        return false;
      }
    }
    
    if (!formData.role) {
      setError("Role is required");
      return false;
    }
    if (!formData.organizationId) {
      setError("Organization is required");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    const filteredHospitals = getFilteredHospitals();
    if (filteredHospitals.length > 0 && formData.hospitals.length === 0) {
      setError("Please select at least one hospital for user access");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${SERVER}/organisations/members/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          organizationId: formData.organizationId,
          password: formData.password,
          hospitals: formData.hospitals,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      setSuccess(true);
      // Reset form and generate new password
      setFormData({
        name: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "member",
        organizationId: "",
        password: "",
        hospitals: [],
      });
      generatePassword(); // Generate new password for next user
    } catch (error) {
      console.error("Error creating user:", error);
      setError(error.message || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form">
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Add New User</h2>

        {error && (
          <div
            className="error-message"
            style={{
              color: "#e74c3c",
              background: "#fdf2f2",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #e74c3c",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="success-message"
            style={{
              color: "#27ae60",
              background: "#f2fdf2",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #27ae60",
            }}
          >
            User created successfully!
          </div>
        )}

        <div className="form-grid">
          <div className="column-1">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="form-group">
              <label>Role *</label>
              <div className="select-container">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="technician">Technician</option>
                  <option value="manager">Manager</option>
                </select>
                <FiChevronDown className="select-icon" />
              </div>
            </div>

            <div className="form-group">
              <label>Organisation *</label>
              <div className="select-container">
                <select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Organisation</option>
                  {organisations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="select-icon" />
              </div>
            </div>
          </div>

          <div className="column-2">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+254712345678"
                pattern="^\+[1-9]\d{1,14}$"
                title="Phone number must be in international format starting with + (e.g., +254712345678)"
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Optional. If provided, must start with + followed by country code
              </small>
            </div>

            <div className="form-group">
              <label>Auto-Generated Password *</label>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  readOnly
                  style={{ flex: 1, background: "#f8f9fa" }}
                />
                <button
                  type="button"
                  onClick={copyPassword}
                  style={{
                    padding: "15px 12px",
                    background: copySuccess ? "#008540" : "#008540",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <FiCopy size={14} />
                  {copySuccess ? "Copied!" : "Copy"}
                </button>
               
              </div>
              <small style={{ color: "#666", fontSize: "12px" }}>
                User will change this password on first login
              </small>
            </div>

            {/* Hospital Access in Grid */}
            {formData.organizationId && getFilteredHospitals().length > 0 && (
              <div className="form-group">
                <label>Hospital Access *</label>
                <div
                  style={{
                    maxHeight: "120px",
                    overflowY: "auto",
                    border: "1px solid rgba(144, 144, 144, 0.56)",
                    borderRadius: "5px",
                    padding: "10px",
                    background: "#f8f9fa",
                  }}
                >
                  {getFilteredHospitals().map((hospital) => (
                    <div key={hospital.id} style={{ marginBottom: "8px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.hospitals.includes(hospital.id)}
                          onChange={() => handleHospitalChange(hospital.id)}
                          style={{ margin: 0 }}
                        />
                        {hospital.name}
                      </label>
                    </div>
                  ))}
                </div>
                <small style={{ color: "#666", fontSize: "12px" }}>
                  Select hospitals this user can access
                </small>
              </div>
            )}
          </div>
        </div>

        <div className="form-navigation">
          <div className="button" onClick={() => setActiveItem("Staff")}>
            Cancel
          </div>
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? <div className="spinner"></div> : "Create User"}
          </button>
          {success && (
            <div
              className="button primary"
              onClick={() => setActiveItem("Staff")}
            >
              Back to Users
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserForm;
