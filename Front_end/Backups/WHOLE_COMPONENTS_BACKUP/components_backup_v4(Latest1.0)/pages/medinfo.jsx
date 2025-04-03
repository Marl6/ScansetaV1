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

  const headerTextMap = {
    info: "Information",
    usage: "Usage",
    complication: "Complication",
  };



  return (
    <div className="dashboard">
      <div className="header">
        <button className="back-button" onClick={goToDashboard3}>
          <img src={back} alt="Back" className="back-icon" />
        </button>

        <button className="medicine_name">
          <h2>Medicine Generic Name: </h2>
          <p>{medicineData.generic_name}</p>
        </button>
      </div>

      <div className="overall-container">


        <div className="information-container">

          <div className="header-container">
            <p>{headerTextMap[activeButton]}</p>
          </div>

          <div className="content-container">
            <p>{contentMap[activeButton]}</p>
          </div>

          <div className="buttons-container">
            <button
              id="info-button"
              className={`toggle-button ${activeButton === "info" ? "active" : ""}`}
              onClick={() => handleButtonClick("info")}
            >
              Information
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
