import React, { useState, useEffect } from 'react';
import '../css/medinfo.css';
import back from "../assets/icons/medinfo/back.png"; // Ensure the path is correct

const MedInfo = ({ goBackToUploadFile, goBackToSearchMed, medicineData, source }) => {
  const [medicineNames, setMedicineNames] = useState([]);
  const [activeMedicine, setActiveMedicine] = useState(0);
  const [activeButton, setActiveButton] = useState('info');
  const [contentMap, setContentMap] = useState({
    info: '',
    usage: '',
    complication: ''
  });
  
  // New state to store all medicine data
  const [allMedicineData, setAllMedicineData] = useState({});

  // Function to normalize medicine name for consistent lookup
  const normalizeMedicineName = (name) => {
    return name.trim().toLowerCase();
  };

  // Function to find a medicine in allMedicineData using normalized name
  const findMedicineData = (medicineName, medicineDataObj) => {
    if (!medicineName || !medicineDataObj) return null;
    
    // Direct lookup first
    if (medicineDataObj[medicineName]) {
      return medicineDataObj[medicineName];
    }
    
    // Try normalized lookup
    const normalizedName = normalizeMedicineName(medicineName);
    const medicineKey = Object.keys(medicineDataObj).find(key => 
      normalizeMedicineName(key) === normalizedName
    );
    
    return medicineKey ? medicineDataObj[medicineKey] : null;
  };

  useEffect(() => {
    // Process medicine data directly from props
    if (medicineData) {
      console.log('Medicine data received:', medicineData);
      
      // Extract medicine names from detected_medicines (comma-separated string) or use as an array
      let medicines = [];
      if (typeof medicineData.detected_medicines === 'string') {
        medicines = medicineData.detected_medicines.split(',').map(med => med.trim());
      } else if (Array.isArray(medicineData.detected_medicines)) {
        medicines = medicineData.detected_medicines;
      }
      
      console.log('All detected medicines before filtering:', medicines);
      
      // Store all medicine data for easy access
      if (medicineData.medicine_data) {
        setAllMedicineData(medicineData.medicine_data);
        
        // IMPORTANT: Filter out medicines that don't have corresponding data
        // This prevents the "No data found" error for medicines like Bactrim
        const medicinesWithData = medicines.filter(medicine => {
          // Check if data exists for this medicine (direct or case-insensitive)
          const hasData = findMedicineData(medicine, medicineData.medicine_data) !== null;
          if (!hasData) {
            console.log(`Filtering out medicine "${medicine}" - no data available`);
          }
          return hasData;
        });
        
        console.log('Filtered medicines with data:', medicinesWithData);
        
        // Update the medicine names array with only medicines that have data
        setMedicineNames(medicinesWithData);
        
        // Set initial content for the first medicine (if available)
        if (medicinesWithData.length > 0) {
          const firstMedicine = medicinesWithData[0];
          const medicineSpecificData = findMedicineData(firstMedicine, medicineData.medicine_data) || {};
          
          setContentMap({
            info: medicineSpecificData.medicine_info || 'No information available',
            usage: medicineSpecificData.medicine_usage || 'No usage information available',
            complication: medicineSpecificData.medicine_complication || 'No complication information available'
          });
        }
      } else {
        // Fallback for old data structure if needed
        setMedicineNames(medicines); // No filtering in this case
        setContentMap({
          info: medicineData.medicine_info || 'No information available',
          usage: medicineData.medicine_usage || 'No usage information available',
          complication: medicineData.medicine_complication || 'No complication information available'
        });
      }
    }
  }, [medicineData]);

  // Handle button clicks for info/usage/complication tabs
  const handleButtonClick = (buttonId) => {
    setActiveButton(buttonId);
  };

  // Handle medicine button clicks - now uses medicine-specific data
  const handleMedicineClick = (index) => {
    setActiveMedicine(index);
    
    // Get the medicine name at this index
    const medicineName = medicineNames[index];
    
    // Find the medicine data using our helper function
    const medicineSpecificData = findMedicineData(medicineName, allMedicineData);
    
    if (medicineSpecificData) {
      // Update the content map with this medicine's data
      setContentMap({
        info: medicineSpecificData.medicine_info || 'No information available',
        usage: medicineSpecificData.medicine_usage || 'No usage information available',
        complication: medicineSpecificData.medicine_complication || 'No complication information available'
      });
    } else {
      console.warn(`No data found for medicine: "${medicineName}"`);
      // Fallback to empty content if no data found
      setContentMap({
        info: `No information available for ${medicineName}`,
        usage: `No usage information available for ${medicineName}`,
        complication: `No complication information available for ${medicineName}`
      });
    }
  };

  // Go back to the previous page based on source
  const handleBackClick = () => {
    if (source === "upload") {
      goBackToUploadFile(); // Go back to the UploadFile page
    } else if (source === "search") {
      goBackToSearchMed(); // Go back to the SearchMed page
    } else {
      // Default fallback
      goBackToUploadFile();
    }
  };

  const headerTextMap = {
    info: "Information",
    usage: "Usage",
    complication: "Complication",
  };

  return (
    <div className="dashboard">
      <div className="header-med">
        <button className="back-button" onClick={handleBackClick}>
          <img src={back} alt="Back" className="back-icon" />
        </button>
        <div className="medicine-name-container">
          {medicineNames.map((medicine, index) => (
            <button 
              key={`medicine-${index}`}
              className={`medicine-name-button ${index === activeMedicine ? 'active' : ''}`}
              onClick={() => handleMedicineClick(index)}
            >
              {medicine}
            </button>
          ))}
        </div>
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
                    
                    // Replace ### headings with * format
                    .replace(/###\s+([^\n]+)/g, '$1')
                    
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
