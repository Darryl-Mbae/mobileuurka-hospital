import React, { useEffect, useState } from "react";
import { RiSearchLine } from "react-icons/ri";
import { IoDocumentTextOutline, IoSend, IoClose } from "react-icons/io5";
import "./css/Document.css";
import { IoMdAdd } from "react-icons/io";
import { useSelector } from "react-redux";

const Notes = ({ setNotes, setActiveTitle, patient }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const currentUser = useSelector((s) => s.user.currentUser);
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
  // Dummy Notes Data

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const filteredNotes = patient?.notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserName = (user_id) => {
    const user = users.find((u) => u.user_id === user_id);
    return user ? user.name : "Unknown";
  };

  const handleAddNote = () => {
    setShowAddNote(true);
    setNewNote({ title: "", content: "" });
  };

  const handleCancelNote = () => {
    setShowAddNote(false);
    setNewNote({ title: "", content: "" });
  };

  const handleSaveNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      alert("Please fill in both title and content");
      return;
    }

    setLoading(true);
    try {
      const { apiPost } = await import('../config/api.js');
      
      const noteData = {
        patient_id: patient.id,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        user_id: currentUser.user_id,
        date: new Date().toISOString(),
      };

      await apiPost('/notes', noteData);
      
      // Reset form and close
      setNewNote({ title: "", content: "" });
      setShowAddNote(false);
      
      // Refresh the page or update the notes list
      window.location.reload();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="notes" className="content">
      <div className="con">
        <div className="search-input">
          <RiSearchLine />
          <input
            type="search"
            id="searchInputs"
            name="search"
            placeholder="Search Notes"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="button" onClick={handleAddNote}>
          <IoMdAdd />
          Add Note
        </div>
      </div>

      {showAddNote && (
        <div className="add-note-form">
          <div className="form-header">
            <h3>Add New Note</h3>
            <button className="close-btn" onClick={handleCancelNote}>
              <IoClose />
            </button>
          </div>
          
          <div className="form-content">
            <input
              type="text"
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="note-title-input"
            />
            
            <textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="note-content-input"
              rows={6}
            />
            
            <div className="form-actions">
              <button 
                className="cancel-btn" 
                onClick={handleCancelNote}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={handleSaveNote}
                disabled={loading}
              >
                {loading ? 'Saving...' : (
                  <>
                    <IoSend />
                    Save Note
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="documents">
        <div className="title">
          <div className="title-name">Title</div>
          <div className="Editor">Editor</div>
          <div className="date">Date</div>
        </div>

        {filteredNotes.map((note, index) => (
          <div
            key={index}
            className="record"
            onClick={() => {
              setNotes(note);
              setActiveTitle("note");
            }}
          >
            <div className="doc">
              <div className="icon">
                <IoDocumentTextOutline />
              </div>
              <div className="details">
                <div className="doc-name">{note.title}</div>
                <div className="doc-visit">{note.visit_id}</div>
              </div>
            </div>
            <div className="doc-editor">{getUserName(note.user_id)}</div>
            <div className="date">{formatDate(note.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notes;
