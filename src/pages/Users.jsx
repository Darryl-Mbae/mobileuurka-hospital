import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../css/Users.css";
import { setUsers } from "../realtime/Slices/userSlice";
import SearchContainer from "../components/SearchContainer";

const columns = [
  {
    label: "Name",
    key: "name",
    render: ({ user }) => (
      <>
        <span>
          {user.name
            ?.split(" ")
            .map((w) => w.charAt(0))
            .join("")
            .toUpperCase()}
        </span>{" "}
        {user.name || "—"}
      </>
    ),
  },
  { label: "Email", key: "email" },
  { label: "ID", key: "id" },
  {
    label: "Organisation",
    key: "org",
  },

  {
    label: "Role",
    key: "role",
  },
  {
    label: "Status",
    key: "status",
    render: ({ user, onlineUsers }) => {
      const isOnline = onlineUsers.includes(user.id);
      return (
        <>
          <span
            className="dot"
            style={{ background: isOnline ? "#00c853" : "#ccc" }}
          ></span>
          {isOnline ? "Online" : "Offline"}
        </>
      );
    },
  },

  {
    label: "Joined",
    key: "joined",
    render: ({ user }) =>
      user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : // ➜ "July 11, 2025"

          "—",
  },
];

const Users = ({ setActiveItem }) => {
  const users = useSelector((s) => s.user.users);
  const dispatch = useDispatch();
  const SERVER = import.meta.env.VITE_SERVER_URL;
  const organisations = useSelector((s) => s.organisation.organisations);
  const onlineUsers = useSelector((s) => s.user.onlineUsers);
  const [filteredUsers, setFilteredUsers] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  console.log(organisations);

  useEffect(() => {
    if (organisations && organisations.length > 0) {
      // Extract users directly from organizations
      const allUsers = organisations.flatMap(
        (org) =>
          org.users?.map((userTenant) => ({
            id: userTenant.user?.id,
            name: userTenant.user?.name,
            email: userTenant.user?.email,
            org: org.name,
            role: userTenant.role,
            status: userTenant.status,
            createdAt: userTenant.joinedAt,
          })) || []
      );

      dispatch(setUsers(allUsers));
    }
  }, [organisations, dispatch]);

  useEffect(() => {
    if (users) {
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.org?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
  };

  const handleAddUser = () => {
    setActiveItem("UserForm");
  };

  return (
    <div className="users-page">
      <div className="toolbar">
        <div className="count">
          All Users <span>{users?.length || 0}</span>
        </div>
        <div className="search">
          <SearchContainer
            placeholder="Search users..."
            onSearch={handleSearch}
            onAdd={handleAddUser}
            addButtonText="Add User"
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

        {filteredUsers?.length > 0 ? (
          filteredUsers.map((user) => (
            <div className="list" key={user.id}>
              {columns.map((col) => (
                <div key={col.key} className={col.key}>
                  {col.render
                    ? col.render({ user, organisations, onlineUsers })
                    : user[col.key] || "—"}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="no-results">
            {searchTerm ? `No users found matching "${searchTerm}"` : "No users found."}
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
