import { useEffect, useState } from "react";
import "../css/SideBar.css";
import CompanyConfig from "../config/config.js";
import "../css/hamburger.css";

import { MdOutlineSpaceDashboard } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { FiBell } from "react-icons/fi";
import { RiBubbleChartLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { BsChatDots } from "react-icons/bs";
import { LuUserRound } from "react-icons/lu";
import { TbUserSquare } from "react-icons/tb";
import { MdOutlineHistory } from "react-icons/md";
import { useSelector } from "react-redux";
import { GoSignOut } from "react-icons/go";

const SideBar = ({ activeItem, setActiveItem, setInternalTab }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState(false);
  const navigate = useNavigate();

  // Get user role from Redux store
  const user = useSelector((state) => state.user.currentUser);
  const isAdmin = user?.userTenants?.[0].role === "admin" || user?.userTenants?.[0].role === "owner";

  useEffect(() => {
    if (activeItem === "Patient") {
      setActive(true);
    } else {
      setActive(false);
    }
  }, [activeItem]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const handleClick = (name) => {
    setActiveItem(name);
    setInternalTab(null);
    setSidebarOpen(false);
    navigate(`/${name}`);
  };

  const ClientItems = [
    { name: "Dashboard", icon: <MdOutlineSpaceDashboard /> },
    { name: "Patients", icon: <LuUserRound /> },
    { name: "Staff", icon: <TbUserSquare /> },
    { name: "Screening", icon: <RiBubbleChartLine /> },
  ];

  const activityItems = [
    ...(isAdmin ? [{ name: "Logs", icon: <MdOutlineHistory /> }] : []),
    { name: "Settings", icon: <IoSettingsOutline /> },
    { name: "Feedback", icon: <BsChatDots /> },
    { name: "Alerts", icon: <FiBell />, showBadge: true },
  ];

  const SERVER = import.meta.env.VITE_SERVER_URL;


  async function signout() {
    try {
      const res = await fetch(`${SERVER}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });

      if (res.ok) {
        // Redirect to login or home page after successful logout
        window.location.href = "/auth";
      }
    }
    catch (err) {
      console.log(err);
    }
  }


  return (
    <div className={`sidebar ${active ? "active" : ""}`}>
      <div className="company">
        <div className="logo">
          <img src={CompanyConfig.logoUrl} alt="Company Logo" />
        </div>
        <div className="name">{CompanyConfig.name}
          <div className="signout" onClick={signout}>
            <GoSignOut />

          </div>
        </div>
        <div
          className={`hamburger hamburger--collapse ${isSidebarOpen ? "is-active" : ""
            }`}
          onClick={toggleSidebar}
        >
          <span className="hamburger-box">
            <span className="hamburger-inner"></span>
          </span>
        </div>
      </div>

      <div className={`navigation ${!isSidebarOpen ? "open" : ""}`}>
        <div className="category">{!active && "App"}</div>
        <ul>
          {ClientItems.map((item) => (
            <li
              key={item.name}
              className={
                activeItem === item.name ||
                  (item.name === "Patients" && activeItem === "Patient")
                  ? "active"
                  : ""
              }
              onClick={() => handleClick(item.name)}
            >
              <div className="icon">{item.icon}</div>
              <span>{item.name}</span>
            </li>
          ))}
        </ul>

        <div className="line"></div>
        <div className="category">{!active && "Activities"}</div>
        <ul>
          {activityItems.map((item) => (
            <li
              key={item.name}
              className={activeItem === item.name ? "active" : ""}
              onClick={() => handleClick(item.name)}
            >
              <div className="icon">{item.icon}</div>
              <span className="label">{item.name}</span>
              {item.showBadge && <span className="badge">2</span>}
            </li>
          ))}
        </ul>
        <div className="signout mobile" onClick={signout}>
          <GoSignOut />

        </div>
        {/* <div className="logout" onClick={logout}>
          <MdLogout /> Logout
        </div> */}
      </div>
    </div>
  );
};

export default SideBar;
