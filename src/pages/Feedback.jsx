import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Users.css";
import SearchContainer from "../components/SearchContainer";

const columns = [
  {
    label: "Feedback ID",
    key: "id",
    render: ({ feedback }) => (
      <span className="feedback-id">#{feedback.id.slice(0, 8)}</span>
    ),
  },
  {
    label: "Title",
    key: "titles",
    render: ({ feedback }) => (
      <span className="feedback-title">{feedback.title}</span>
    ),
  },
  {
    label: "Category",
    key: "category",
    render: ({ feedback }) => (
      <span className="feedback-category">{feedback.category}</span>
    ),
  },
  {
    label: "Message",
    key: "message",
    render: ({ feedback }) => (
      <div className="feedback-message">
        {feedback.message?.length > 50
          ? `${feedback.message.substring(0, 50)}...`
          : feedback.message}
      </div>
    ),
  },
  {
    label: "Status",
    key: "status",
    render: ({ feedback }) => (
        <span
        className={`status-badge ${
          feedback.status.toLowerCase() === "pending"
            ? "pending"
            : feedback.status.toLowerCase() === "resolved"
            ? "resolved"
            : "rejected"
        }`}
      >
        {feedback.status}
      </span>
    ),
  },
  {
    label: "Date",
    key: "createdAt",
    render: ({ feedback }) =>
      feedback.createdAt
        ? new Date(feedback.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—",
  },
];

const Feedback = ({ setActiveItem }) => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const currentUser = useSelector((s) => s.user.currentUser);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const endpoint = currentUser.email.endsWith("@mobileuurka.com")
          ? `${SERVER}/feedback/all`
          : `${SERVER}/feedback`;
        
        const response = await fetch(endpoint, {
          credentials: "include",
        });
        
        if (!response.ok) throw new Error("Failed to fetch feedback");
        
        const data = await response.json();
        setFeedbackList(data);
        setFilteredFeedback(data);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    };

    fetchFeedback();
  }, [currentUser, SERVER]);

  useEffect(() => {
    if (feedbackList.length > 0) {
      const filtered = feedbackList.filter((fb) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          fb.title.toLowerCase().includes(searchLower) ||
          fb.message.toLowerCase().includes(searchLower) ||
          fb.status.toLowerCase().includes(searchLower) ||
          fb.user?.name?.toLowerCase().includes(searchLower) ||
          fb.user?.email?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredFeedback(filtered);
    }
  }, [searchTerm, feedbackList]);

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
  };

  const handleNewFeedback = () => {
    setActiveItem("FeedbackForm");
  };

  return (
    <div className="users-page feedback">
      <div className="toolbar">
        <div className="count">
          Feedback <span>{filteredFeedback.length}</span>
        </div>
        <div className="search">
          <SearchContainer
            placeholder="Search feedback..."
            onSearch={handleSearch}
            onAdd={handleNewFeedback}
            addButtonText="New Feedback"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      </div>

      <div className="lists">
        <div className="title">
          {columns.map((col) => (
            <div key={col.key} className={col.key}>
              {col.label}
            </div>
          ))}
        </div>

        {filteredFeedback.length > 0 ? (
          filteredFeedback.map((feedback) => (
            <div className="list" key={feedback.id}>
              {columns.map((col) => (
                <div key={col.key} className={col.key}>
                  {col.render
                    ? col.render({ feedback })
                    : feedback[col.key] || "—"}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="no-results">
            {searchTerm
              ? `No feedback found matching "${searchTerm}"`
              : "No feedback submitted yet."}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;