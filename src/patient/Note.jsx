import React, { useEffect, useState } from "react";
import "./css/Note.css";
import { MdEdit, MdSave } from "react-icons/md";

const Note = ({ note, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...note });
  const [users, setUsers] = useState([]);
  const SERVER = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
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
    getUsers();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    const updatedNote = {
      ...formData,
      user_id: user.user_id, // Replace with current user
    };

    setIsEditing(false);
    console.log("Updated Note:", updatedNote);
  };

  const getUserName = (user_id) => {
    const user = users.find((u) => u.user_id === user_id);
    return user ? user.name : "Unknown";
  };

  function formatTime(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-GB", { month: "long" });
    const year = date.getFullYear();
    const suffix = (day) => {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };
    const dayOfWeek = date.toLocaleString("en-GB", { weekday: "long" });
    return `${dayOfWeek}, ${day}${suffix(day)} ${month} ${year}`;
  }

  return (
    <div id="notes">
      <div className="picker2">
        <div className="flex">
          <div className="circle"></div>
          {isEditing ? (
            <input
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="name-input"
            />
          ) : (
            <div className="name">{note.title}</div>
          )}
        </div>
        {/* 
        <div className="date"> 
         {isEditing ? user.name : note.editor || user.name}
        </div> */}

        <div className="current-note">
          <div style={{ marginTop: "20px" }}>
            {isEditing ? (
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={10}
                className="textarea"
              />
            ) : (
              note.notes
                .split("\n")
                .map((line, index) => <p key={index}>{line}</p>)
            )}
          </div>
        </div>

        {/* <div
          className="edit-btn"
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? <MdSave /> : <MdEdit />}
          {isEditing ? "Save" : "Edit"}
        </div> */}
        <p> ~ {note.editor}</p>
        <div className="realtime">
          <span> </span>
          {formatTime(note.date)}
        </div>
      </div>
    </div>
  );
};

export default Note;
