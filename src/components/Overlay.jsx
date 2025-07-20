// Auth/Overlay.jsx

const Overlay = ({ isActive }) => {
  return <div className={`overlay ${isActive ? 'active' : ''}`}></div>;
};

export default Overlay;
