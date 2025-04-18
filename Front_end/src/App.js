import React, { useState } from "react";
import Dashboard from "./components/pages/dashboard";
import UploadFile from "./components/pages/UploadFile";
import SearchMed from "./components/pages/search_med";
import MedInfo from "./components/pages/medinfo";
import TalkToMic from "./components/pages/talkToMic"; // Corrected import
import { getMedicineInfo } from "./components/database";

function App() {
  const [currentDashboard, setCurrentDashboard] = useState(1);
  const [medicineData, setMedicineData] = useState(null);
  const [source, setSource] = useState(null); // This will track where the user came from

  const goToDashboard1 = () => setCurrentDashboard(1);
  const goToScan = () => setCurrentDashboard(2);
  const goToSearchMed = () => setCurrentDashboard(3);
  const goToUploadFile = () => setCurrentDashboard(2); // To go back to UploadFile page
  const goToMedInfo = () => setCurrentDashboard(4);
  const goToTalkToMic = () => setCurrentDashboard(5);

  const handleMedicineSearch = async (medicineName) => {
    console.log(`Searching for medicine: ${medicineName}`);
    try {
      const data = await getMedicineInfo(medicineName);
      if (data) {
        console.log("Successfully fetched medicine data:", data);
        setMedicineData(data);
        setSource("search"); // Set the source to search_med
        setTimeout(() => goToMedInfo(), 0); // Ensure state updates before navigation
      } else {
        console.error("No data found for this medicine.");
      }
    } catch (err) {
      console.error("Error fetching medicine data:", err);
    }
  };

  const handleGoToUploadFile = () => {
    setSource("upload"); // Set the source to uploadfile
    setTimeout(() => goToMedInfo(), 0); // Ensure state updates before navigation
  };

  return (
    <div className="App">
      {currentDashboard === 1 && (
        <Dashboard goToDashboard2={goToScan} goToDashboard3={goToSearchMed} goToDashboard4={goToTalkToMic} />
      )}
      {currentDashboard === 2 && (
        <UploadFile
          goNext={goToSearchMed}
          goBack={goToDashboard1}
          goToMedInfo={handleGoToUploadFile} // Passing function to navigate to MedInfo from UploadFile
          setMedicineData={setMedicineData}
        />
      )}
      {currentDashboard === 3 && (
        <SearchMed
          goBack={goToDashboard1}
          handleMedicineSearch={handleMedicineSearch}
          setMedicineData={setMedicineData}
          setSource={setSource}  // Add this to allow setting source directly
          goToMedInfo={goToMedInfo}  // Add this to allow direct navigation
        />
      )}
      {currentDashboard === 4 && medicineData && (
        <MedInfo
          goBackToUploadFile={goToUploadFile}
          goBackToSearchMed={goToSearchMed}
          medicineData={medicineData}
          source={source} // Passing source to MedInfo to decide where to go back
        />
      )}
      {currentDashboard === 5 && (
        <TalkToMic
          goBack={goToDashboard1} /> // Corrected TalkToMic usage
      )}
    </div>
  );
}

export default App;
