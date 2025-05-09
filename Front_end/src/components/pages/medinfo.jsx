import React, { useState } from "react";
import "../css/medinfo.css";
import back from "../assets/icons/medinfo/back.png"; // Ensure the path is correct

const MedInfo = ({ goBackToUploadFile, goBackToSearchMed, medicineData, source }) => {
  const [activeButton, setActiveButton] = useState("info");

  const handleButtonClick = (buttonId) => {
    setActiveButton(buttonId);
  };

  // Define the content dynamically based on activeButton
  const contentMap = {
    info: medicineData.medicine_info || "No information available",
    usage: medicineData.medicine_usage || "No usage details available",
    complication: medicineData.medicine_complication || "No complication details available",
    //hazard: medicineData.medicine_hazard || "No hazard details available",
    //emergency: medicineData.medicine_emergency || "No emergency details available",
  };

  const headerTextMap = {
    info: "Information",
    usage: "Usage",
    complication: "Complication",
    //hazard: "Hazard",
    //emergency: "Emergency",
  };

  // Dynamic back button handler based on source
  const handleBackClick = () => {
    if (source === "upload") {
      goBackToUploadFile(); // Go back to the UploadFile page
    } else if (source === "search") {
      goBackToSearchMed(); // Go back to the SearchMed page
    }
  };

  const parseText = (text) => {
    const parsedText = text.split("**").map((chunk, index) => {
      if (index % 2 !== 0) {
        return <strong key={index}>{chunk}</strong>;
      } else {
        const bulletText = chunk.split("*").map((subChunk, subIndex) => {
          if (subIndex % 2 !== 0) {
            return <li key={subIndex}>{subChunk}</li>;
          }
          return subChunk;
        });
        return bulletText;
      }
    });
    return parsedText;
  };

  return (
    <div className="dashboard">
      <div className="header-med">
        <button className="back-button" onClick={handleBackClick}>
          <img src={back} alt="Back" className="back-icon" />
        </button>
      </div>

      <div className="overall-container">
        <div className="information-container">
          <div className="header-container">
            <div className="header-text">
              <p>{headerTextMap[activeButton]}</p>
            </div>
          </div>

          <div className="whole-content-container">
            <div className="content-container">
              <p>{contentMap[activeButton]}</p>
            </div>
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
              className={`toggle-button ${activeButton === "complication" ? "active" : ""}`}
              onClick={() => handleButtonClick("complication")}
            >
              Complication
            </button>
          </div>
        </div>
      </div>
      <div className="footer"></div>
    </div>
  );
};

export default MedInfo;
