import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../css/Users.css";
import { setUsers } from "../reducers/Slices/userSlice";
import SearchContainer from "../components/SearchContainer";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

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
    label: "Last Login",
    key: "lastLogin",
    render: ({ user }) => {
      if (!user.lastLogin) return "Never";

      const lastLoginDate = new Date(user.lastLogin);
      const now = new Date();

      // Get time part
      const timeString = lastLoginDate.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Check if it's today
      const isToday =
        lastLoginDate.getDate() === now.getDate() &&
        lastLoginDate.getMonth() === now.getMonth() &&
        lastLoginDate.getFullYear() === now.getFullYear();

      if (isToday) {
        return `${timeString}`;
      }

      // Check if it's yesterday
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      const isYesterday =
        lastLoginDate.getDate() === yesterday.getDate() &&
        lastLoginDate.getMonth() === yesterday.getMonth() &&
        lastLoginDate.getFullYear() === yesterday.getFullYear();

      if (isYesterday) {
        return `Yesterday ${timeString}`;
      }

      // For other days, show date without year + time
      const dateString = lastLoginDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });

      return `${dateString} ${timeString}`;
    },
  },

  // {
  //   label: "Joined",
  //   key: "joined",
  //   render: ({ user }) =>
  //     user.createdAt
  //       ? new Date(user.createdAt).toLocaleDateString("en-US", {
  //           year: "numeric",
  //           month: "long",
  //           day: "numeric",
  //         })
  //       : // ➜ "July 11, 2025"

  //         "—",
  // },
];

const Users = ({ setActiveItem }) => {
  const users = useSelector((s) => s.user.users);
  const dispatch = useDispatch();
  const organisations = useSelector((s) => s.organisation.organisations);
  const onlineUsers = useSelector((s) => s.user.onlineUsers);
  const [filteredUsers, setFilteredUsers] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Add pagination hook
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
    getPaginatedData,
  } = usePagination({
    totalItems: filteredUsers.length,
    initialItemsPerPage: 10,
    initialPage: 1,
  });

  const currentPageUsers = getPaginatedData(filteredUsers);

  useEffect(() => {
    if (organisations && organisations.length > 0) {
      // Extract users directly from organizations
      console.log(organisations);
      const allUsers = organisations.flatMap(
        (org) =>
          org.users?.map((userTenant) => ({
            id: userTenant.user?.id,
            name: userTenant.user?.name,
            email: userTenant.user?.email,
            org: org.name,
            role: userTenant.role,
            createdAt: userTenant.joinedAt,
            lastLogin:
              userTenant.user?.lastLoginAt ||
              userTenant.user?.lastLogin ||
              userTenant.user?.last_login,
          })) || []
      );

      dispatch(setUsers(allUsers));
    }
  }, [organisations, dispatch]);

  console.log("users", users);
  console.log("onlineUsers", onlineUsers);

  useEffect(() => {
    if (users) {
      const safeUsers = Array.isArray(users) ? users : users ? [users] : [];

      const filtered = safeUsers?.filter(
        (user) =>
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
    handlePageChange(1); // Reset to first page when searching
  };

  const handleAddUser = () => {
    setActiveItem("UserForm");
  };

  return (
    <div className="users-page">
      <div className="toolbar">
        <div className="count">
          All Users <span>{filteredUsers?.length || 0}</span>
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

        {currentPageUsers?.length > 0 ? (
          currentPageUsers.map((user) => (
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
            {searchTerm
              ? `No users found matching "${searchTerm}"`
              : "No users found."}
          </div>
        )}
      </div>

      {/* Add Pagination Component */}
      {filteredUsers?.length > 0 && (
        <Pagination
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showPageInfo={true}
          showItemsPerPageSelector={true}
          itemsPerPageOptions={[5, 10, 15, 20]}
        />
      )}
    </div>
  );
};

export default Users;
