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

  // const parseText = (text) => {
  //   const parsedText = text.split("**").map((chunk, index) => {
  //     if (index % 2 !== 0) {
  //       return <strong key={index}>{chunk}</strong>;
  //     } else {
  //       const bulletText = chunk.split("*").map((subChunk, subIndex) => {
  //         if (subIndex % 2 !== 0) {
  //           return <li key={subIndex}>{subChunk}</li>;
  //         }
  //         return subChunk;
  //       });
  //       return bulletText;
  //     }
  //   });
  //   return parsedText;
  // };

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
              <div 
                style={{ color: '#32B8CA', fontSize: "20px" }}
                dangerouslySetInnerHTML={{ 
                  __html: contentMap[activeButton]
                    // Replace ** with bold tags - also using sky blue for bold text
                    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #32B8CA;">$1</strong>')
                    
                    // Format main bullet points with bullet symbol
                    .replace(/((^|<br \/>)\s*\*\s(.+?)(<br \/>|$))+/gm, function(match) {
                      return '<ul style="list-style-type: disc; color: #32B8CA; margin: 0px; padding-left: 20px;">' + 
                             match.replace(/\*\s(.+?)(<br \/>|$)/g, '<li style="color: #32B8CA; margin-bottom: 4px;">$1</li>') + 
                             '</ul>';
                    })
                    
                    // Format sub-items with dashed indentation
                    .replace(/((^|<br \/>)\s*\+\s(.+?)(<br \/>|$))+/gm, function(match) {
                      return '<div style="margin-left: 24px;">' + 
                             match.replace(/(^|<br \/>)\s*\+\s(.+?)(<br \/>|$)/g, 
                                           '$1<div style="position: relative; margin-bottom: 4px; padding-left: 15px; color: #32B8CA;"><span style="position: absolute; left: 0; color: #32B8CA;">-</span> $2$3</div>') + 
                             '</div>';
                    })
                    
                    // Clean up any individual asterisks or plus signs that weren't caught
                    .replace(/(^|<br \/>)\s*\*\s/gm, '$1<span style="color: #32B8CA;">&bull;</span> ')
                    .replace(/(^|<br \/>)\s*\+\s/gm, '$1<span style="margin-left: 24px; color: #32B8CA;">-</span> ')
                    
                    // Clean up extra breaks around elements
                    .replace(/<br \/><ul/g, '<ul')
                    .replace(/<\/ul><br \/>/g, '</ul>')
                    .replace(/<br \/><li/g, '<li')
                    .replace(/<\/li><br \/>/g, '</li>')
                    .replace(/<br \/><div style="margin-left: 24px;">/g, '<div style="margin-left: 24px;">')
                    .replace(/<\/div><br \/>/g, '</div>')
                    
                    // Format section titles
                    .replace(/^([A-Z][\w\s]+:)/gm, '<div style="color: #32B8CA; font-size: 18px; font-weight: bold; margin: 12px 0 6px 0;">$1</div>')
                    
                    // Replace newlines with line breaks
                    .replace(/\n/g, '<br />')
                }}
              />
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
