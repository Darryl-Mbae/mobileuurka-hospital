// Auth/Overlay.jsx
import image from '../assets/images/authimage.jpg'
import '../css/Overlay.css'

const Overlay = ({ isActive }) => {
  return <div className={`overlay ${isActive ? 'active' : ''}`}>
    <img src={image} alt="image" />
  </div>;
};

export default Overlay;
