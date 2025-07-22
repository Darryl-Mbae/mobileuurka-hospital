import { useEffect, useState } from "react";
import "../css/SideBar.css";
import CompanyConfig from "../config/config.js";
import "../css/hamburger.css";

import { MdLogout, MdOutlineSpaceDashboard } from "react-icons/md";
import { HiOutlineUserGroup } from "react-icons/hi";
import { HiOutlineBuildingOffice } from "react-icons/hi2"; // for hospital
import { IoSettingsOutline } from "react-icons/io5";
import { FiBell } from "react-icons/fi";
import { RiBubbleChartLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { BsChatDots } from "react-icons/bs";


const SideBar = ({ activeItem, setActiveItem, setInternalTab }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState(false);
  const navigate = useNavigate();

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
    { name: "Patients", icon: <HiOutlineUserGroup /> },
    { name: "Staff", icon: <HiOutlineBuildingOffice /> },
    { name: "Screening", icon: <RiBubbleChartLine /> },
  ];

  const activityItems = [
    { name: "Settings", icon: <IoSettingsOutline /> },
    { name: "Feedback", icon: <BsChatDots />},
    { name: "Alerts", icon: <FiBell />, showBadge: true },
  ];

  async function logout() {
   
  }

  return (
    <div className={`sidebar ${active ? "active" : ""}`}>
      <div className="company">
        <div className="logo">
          <img src={CompanyConfig.logoUrl} alt="Company Logo" />
        </div>
        <div className="name">{CompanyConfig.name}</div>
        <div
          className={`hamburger hamburger--collapse ${
            isSidebarOpen ? "is-active" : ""
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
              className={activeItem === item.name ? "active" : ""}
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
        {/* <div className="logout" onClick={logout}>
          <MdLogout /> Logout
        </div> */}
      </div>
    </div>
  );
};

export default SideBar;
