// src/components/pages/dashboard.jsx
import React from 'react';
import '../css/dashboard.css';
import logo from '../assets/images/scanseta_logo_white.png'; // Adjust the path as needed
import scanIcon from '../assets/icons/dashboard1/scan_icon.png'; // Updated image name
import searchIcon from '../assets/icons/dashboard1/search_icon.png'; // Updated image name
import talkIcon from '../assets/icons/dashboard1/mic.png';

const Dashboard = ({ goToDashboard2, goToDashboard3, goToDashboard4 }) => (
  <div className="dashboard">
    <div className="header">
      <img src={logo} alt="Scanseta Logo" className="logo" />
    </div>

    <div className="buttons">
      <button onClick={goToDashboard2}>
        <img src={scanIcon} alt="Scan Icon" className="button-image" />
        <h2>Scan</h2>
        <p>Scan Doctor’s prescription</p>
      </button>

      <div className="divider-dashboard"></div>

      <button onClick={goToDashboard3}>
        <img src={searchIcon} alt="Search Icon" className="button-image" />
        <h2>Search</h2>
        <p>Discover medicine’s information</p>
      </button>

      <div className="divider-dashboard"></div>

      <button onClick={goToDashboard4}>
        <img src={talkIcon} alt="Search Icon" className="button-image" />
        <h2>Voice</h2>
        <p>Talk to Marl AI</p>
      </button>
    </div>

    <div className="footer"></div>
  </div>
);

export default Dashboard;