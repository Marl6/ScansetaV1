import React, { useState } from "react";
import "../css/medinfo.css";
import back from "../assets/icons/medinfo/back.png"; // Ensure the path is correct

const MedInfo = ({ goToDashboard3, medicineData }) => {
  const [activeButton, setActiveButton] = useState("info");

  const handleButtonClick = (buttonId) => {
    setActiveButton(buttonId);
  };

  // Define the content dynamically based on activeButton
  const contentMap = {
    info: medicineData.info || medicineData.information,
    usage: medicineData.usage || medicineData.usage,
    complication: medicineData.complication || medicineData.compilation,
  };

  return (
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
          <p>Medicine Generic Name: </p>
          <p>{medicineData.generic_name}</p>
        </div>

        <div className="information-container">
          <p>Selected Header</p>

          <div className="content-container">
            <p>{contentMap[activeButton]}</p>
          </div>

          <div className="buttons-container">
            <button
              id="info-button"
              className={`toggle-button ${activeButton === "info" ? "active" : ""}`}
              onClick={() => handleButtonClick("info")}
            >
              Info
            </button>
            <button
              id="usage-button"
              className={`toggle-button ${activeButton === "usage" ? "active" : ""}`}
              onClick={() => handleButtonClick("usage")}
            >
              Usage
            </button>
            <button
              id="complication-button"
              className={`toggle-button ${
                activeButton === "complication" ? "active" : ""
              }`}
              onClick={() => handleButtonClick("complication")}
            >
              Complication
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedInfo;
