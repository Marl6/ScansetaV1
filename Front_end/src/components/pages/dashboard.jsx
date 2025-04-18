// src/components/pages/dashboard.jsx
import React, { useState } from 'react';
import '../css/dashboard.css';
import logo from '../assets/images/scanseta_logo_white.png';
import scanIcon from '../assets/icons/dashboard1/scan_icon.png';
import searchIcon from '../assets/icons/dashboard1/search_icon.png'; 
import talkIcon from '../assets/icons/dashboard1/mic.png';
import EjieworxAIModal from '../modal/ejieworx ai modal';

const Dashboard = ({ goToDashboard2, goToDashboard3, goToDashboard4 }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  return (
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

    {/* AI Floating Button */}
    <button className="ai-float-button" onClick={openModal} title="Chat with AI Assistant">
      <svg className="ai-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white"/>
        <path d="M12 6.5C9.5 6.5 7.5 8.5 7.5 11C7.5 12.5 8.5 13.5 9.5 14.5L8 16.5C8 16.5 11.5 16.5 12 16.5C14.5 16.5 16.5 14.5 16.5 12C16.5 9.5 14.5 6.5 12 6.5Z" fill="white"/>
        <path d="M10 10.5C10.5523 10.5 11 10.0523 11 9.5C11 8.94772 10.5523 8.5 10 8.5C9.44772 8.5 9 8.94772 9 9.5C9 10.0523 9.44772 10.5 10 10.5Z" fill="white"/>
        <path d="M14 10.5C14.5523 10.5 15 10.0523 15 9.5C15 8.94772 14.5523 8.5 14 8.5C13.4477 8.5 13 8.94772 13 9.5C13 10.0523 13.4477 10.5 14 10.5Z" fill="white"/>
        <path d="M12 14.5C14 14.5 14 12.5 14 12.5H10C10 12.5 10 14.5 12 14.5Z" fill="white"/>
      </svg>
    </button>
    
    {/* AI Chatbot Modal */}
    <EjieworxAIModal isOpen={isModalOpen} onClose={closeModal} />

    <div className="footer"></div>
    </div>
  );
};

export default Dashboard;