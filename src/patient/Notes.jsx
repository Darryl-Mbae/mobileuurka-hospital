import React, { useEffect, useState } from "react";
import { RiSearchLine } from "react-icons/ri";
import { IoDocumentTextOutline } from "react-icons/io5";
import "./css/Document.css";
import { IoMdAdd } from "react-icons/io";
import { useSelector } from "react-redux";

const Notes = ({ setNotes, setActiveTitle, patient }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;




  // useEffect(() => {
  //   async function getUsers() {
  //     try {
  //       const response = await fetch(`${SERVER}/organisations/my`, {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include",
  //       });

  //       if (!response.ok)
  //         throw new Error(`HTTP error! Status: ${response.status}`);

  //       const data = await response.json();
  //       setUsers(data[0].users);
  //     } catch (error) {
  //       console.error("Error fetching user data:", error);
  //     }
  //   }
  //   getUsers();
    
  //   window.scrollTo({ top: 0, behavior: "smooth" });
  // }, []);
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

  console.log(filteredNotes)

  const handleAddNote = () => {
    // Switch to notepad page instead of showing inline form
    setActiveTitle("notepad");
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
            <div className="doc-editor">{note.editor}</div>
            <div className="date">{formatDate(note.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notes;
