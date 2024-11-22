import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { FaTachometerAlt, FaUserPlus, FaTags, FaFlask, FaBalanceScale, FaBullhorn, FaSignOutAlt, FaSignInAlt, FaBars, FaTimes, FaChartPie} from 'react-icons/fa';
import '../styles/Sidebar.css';
import { IoMdNutrition } from "react-icons/io";

function Sidebar() {
  const [user] = useAuthState(auth);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to track current path

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Helper function to check if the current page is active
  const isActive = (path) => location.pathname === path;

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="hamburger-icon" onClick={toggleSidebar}>
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </div>

      <ul>
        {user && (
          <>
            <li>
              <Link to="/dashboard">
                <div className="menu-item">
                  <FaTachometerAlt className="menu-icon" />
                  {isOpen && (isActive('/dashboard') ? <strong>Dashboard Overview</strong> : <span>Dashboard Overview</span>)}
                </div>
              </Link>
            </li>
            <li>
              <Link to="/register">
                <div className="menu-item">
                  <FaUserPlus className="menu-icon" />
                  {isOpen && (isActive('/register') ? <strong>User Analytics</strong> : <span>User Register</span>)}
                </div>
              </Link>
            </li>
            <li>
              <Link to="/brands">
                <div className="menu-item">
                  <FaTags className="menu-icon" />
                  {isOpen && (isActive('/brands') ? <strong>Brand Management</strong> : <span>Brand Management</span>)}
                </div>
              </Link>
            </li>
            <li>
              <Link to="/flavors">
                <div className="menu-item">
                  <FaFlask className="menu-icon" />
                  {isOpen && (isActive('/flavors') ? <strong>Flavor Management</strong> : <span>Flavor Management</span>)}
                </div>
              </Link>
            </li>
            <li>
              <Link to="/nutrients">
                <div className="menu-item">
                  <IoMdNutrition className="menu-icon" />
                  {isOpen && (isActive('/nutrients') ? <strong>Nutrient Information</strong> : <span>Nutrient Information</span>)}
                </div>
              </Link>
            </li>
            <li>
              <Link to="/pricing">
                <div className="menu-item">
                  <FaBalanceScale className="menu-icon" />
                  {isOpen && (isActive('/pricing') ? <strong>Pricing & Weight Management</strong> : <span>Pricing & Weight Management</span>)}
                </div>
              </Link>
            </li>
            <li>
              <Link to="/advertisement">
                <div className="menu-item">
                  <FaBullhorn className="menu-icon" />
                  {isOpen && (isActive('/advertisement') ? <strong>Advertisement Management</strong> : <span>Advertisement Management</span>)}
                </div>
              </Link>
            </li>
            <li>
              <Link to="/TransactionHistory">
                <div className="menu-item">
                  <FaChartPie className="menu-icon" />
                  {isOpen && (isActive('/TransactionHistory') ? <strong>TransactionHistory</strong> : <span>TransactionHistory</span>)}
                </div>
              </Link>
            </li>
            <li>
              <button onClick={handleLogout}>
                <div className="menu-item">
                  <FaSignOutAlt className="menu-icon" />
                  {isOpen && <span>Logout</span>}
                </div>
              </button>
            </li>
          </>
        )}
        {!user && (
          <>
            <li>
              <Link to="/login">
                <div className="menu-item">
                  <FaSignInAlt className="menu-icon" />
                  {isOpen && (isActive('/login') ? <strong>Login</strong> : <span>Login</span>)}
                </div>
              </Link>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;
