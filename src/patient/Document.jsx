import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../patient/css/Doc.css";
import { data } from "react-router-dom";

// Format object keys into readable labels
const formatKey = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (l) => l.toUpperCase());

// Split into chunks of N
const chunkArray = (arr, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

// Helper function to format values, converting -1 to "Unknown"
const formatValue = (value) => {
  if (value === -1 || value === "-1") {
    return "Unknown";
  }
  if (value === null || value === "" || value === undefined) {
    return "Not provided";
  }
  return String(value);
};

// Format ISO date into readable string
const formatDate = (iso) => {
  if (!iso) return "Not provided";
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const Document = ({ document, title }) => {
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers();
  });

  async function getUsers() {
    try {
      const response = await fetch(`${SERVER}/user/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  if (!document) return null;

  // Step 1: Format values
  const transformed = { ...document };

  // Replace user_id with editor name
  // Format date
  if (transformed.date) {
    transformed.date = formatDate(transformed.date);
  }

  // Remove user_id field
  delete transformed.user_id;
  // delete transformed.patient_id;
  // delete transformed.date;
  // delete transformed.visit_id;
  // delete transformed.editor;

  if (transformed.infections_id) {
    delete transformed.infections_id;
  }

  // Step 2: Move editor to top
  const reordered = {};
  if ("editor" in transformed) {
    reordered.editor = transformed.editor;
  }
  for (const key in transformed) {
    if (key !== "editor") {
      reordered[key] = transformed[key];
    }
  }

  const allItems = Object.entries(reordered).map(([key, value]) => ({
    label: formatKey(key),
    value: formatValue(value), // Apply formatValue to the raw value
  }));

  // Step 3: Chunk into groups of 15
  const chunks = chunkArray(allItems, 12);

  // Step 4: Render
  return (
    <div className="doc-main">
      <h3>{title}</h3>
      <section>
        <div className="container">
          {allItems.map((item, index) => (
            <div className="list" key={index}>
              <div className="label">{item.label}</div>
              <div className="value">
                {item.value === "Not provided" ? (
                  <span className="placeholder">{item.value}</span>
                ) : (
                  <span>{item.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Document;