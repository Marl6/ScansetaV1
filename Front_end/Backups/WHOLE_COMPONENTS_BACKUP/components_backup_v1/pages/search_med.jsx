// src/components/pages/search_med.jsx
import React, { useState } from 'react';
import logo from '../assets/images/scanseta_logo_white.png'; // Adjust the path as needed
import homeIcon from '../assets/icons/scan_success/home.png'; // Import the home icon
import searchIcon from '../assets/icons/dashboard3/search.png'; // Import the search icon
import '../css/search_med.css';
import { getMedicineInfo } from '../database'; // Import the database function

const validMedicines = [
  "Amoxicillin",
  "Penicillin G benzathine",
  "Clavulanate",
  "Amlodipine",
  "Losartan",
  "Nifedipine",
  "Bactrim",
  "Nitrofurantoin",
  "Fosfomycin",
  "Insulin Regular",
  "Metformin",
  "Glimepiride",
  "Aciclovir",
  "Azathioprine",
  "Griseofulvin"
];

const Search_med = ({ goBack, goNext, setMedicineData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Update suggestions based on user input
    if (value) {
      const filteredSuggestions = validMedicines.filter(medicine =>
        medicine.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setSuggestionsVisible(true);
    } else {
      setSuggestions([]);
      setSuggestionsVisible(false);
    }
  };

  const handleSearchSubmit = async () => {
    if (validMedicines.includes(searchTerm)) {
        try {
            const data = await getMedicineInfo(searchTerm);
            console.log(data);
            if (data) {
                setMedicineData(data); // Pass data to the parent component
                goNext(); // Navigate to the next page (MedInfo)
            } else {
                setError('No data found for this medicine.');
            }
        } catch (err) {
            setError('Error fetching data.');
        }
    } else {
        setError('Please enter a valid medicine name.');
        setTimeout(() => {
            setError('');
        }, 3000);
    }
};

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSuggestionsVisible(false);
  };

  const handleClickOutside = (e) => {
    if (suggestionsVisible && !e.target.closest('.search-wrapper')) {
      setSuggestionsVisible(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [suggestionsVisible]);

  return (
    <div className="dashboard">
      <div className="logo-container">
        <img src={logo} alt="Scanseta Logo" className="logo" />
      </div>
      <button className="home-button" onClick={goBack}>
        <img src={homeIcon} alt="Home" className="home-icon" />
      </button>
      <div className="search-container">
        <div className="search-wrapper" tabIndex={0} onFocus={() => setSuggestionsVisible(true)}>
          <input
            type="text"
            className="search-bar"
            placeholder="Search for medicine..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button className="search-button" onClick={handleSearchSubmit}>
            <img src={searchIcon} alt="Search" className="search-icon" />
          </button>
        </div>
        {suggestionsVisible && (
          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default Search_med;