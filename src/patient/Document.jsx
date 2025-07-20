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
  const matchedUser = users.find((u) => u.user_id === transformed.user_id);
  if (matchedUser) {
    transformed.editor = matchedUser.name;
  } else {
    transformed.editor = "Unknown";
  }

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
    value:
      value === null || value === "" ? (
        <span className="placeholder">Not provided</span>
      ) : (
        <span>{String(value)}</span>
      ),
  }));

  // Step 3: Chunk into groups of 15
  const chunks = chunkArray(allItems, 12);

  // Step 4: Render
  return (
    <div className="doc-main">
      <h3>{title}</h3>
      {/* <div className="row" style={{ marginTop: "30px" }}>
        <div className="label">Patient Id</div>
        <div className="value">{document?.patient_id}</div>
      </div>
      <div className="row">
        <div className="label">Editor</div>
        <div className="value">{document?.user_id}</div>
      </div>
      <div className="row">
        <div className="label">Timestamp</div>
        <div className="value">{formatDate(document.date)}</div>
      </div> */}

      <section>
        <div className="container">
          {allItems.map((item, index) => (
            <div className="list" key={index}>
              <div className="label">{item.label}</div>
              <div className="value">{item.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Document;
