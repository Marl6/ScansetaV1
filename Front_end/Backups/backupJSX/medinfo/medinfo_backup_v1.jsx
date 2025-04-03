// src/components/pages/medinfo.jsx
import React from 'react';
import '../css/medinfo.css';
import back from '../assets/icons/medinfo/back.png'; // Ensure the path is correct

const MedInfo = ({ goToDashboard3, medicineData }) => (
  <div className="dashboard">
    <div className="header">
      <button className="back-button" onClick={goToDashboard3}>
        <img src={back} alt="Back" className="back-icon" />
      </button>

 <button className="medicine_name">
        <h2>{medicineData.generic_name}</h2>
      </button>
    </div>

    <div className="overall-container">
      <div className="generic_name-container">
      <p>Medicine Generic Name: </p> <p>{medicineData.generic_name}</p>
      </div>
      <div className="information-container">
        <p>{medicineData.information}</p>
      </div>
      <div className="usage-container">
        <p>{medicineData.usage}</p>
      </div>
      <div className="complication-container">
        <p>{medicineData.complication}</p>
      </div>
      <div className="warning-container">
        <p>{medicineData.warning}</p>
      </div>
    </div>
  </div>
);

export default MedInfo;