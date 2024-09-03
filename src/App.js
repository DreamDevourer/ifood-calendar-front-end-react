import { useState, useEffect } from "react";
import Datepicker from "react-tailwindcss-datepicker";

const MIN_DATE = new Date();
MIN_DATE.setDate(MIN_DATE.getDate() + 1);

// Sample GraphQL data fetching function (mocked)
const fetchDisabledDates = () => {
  // This function simulates fetching data from a GraphQL server
  return [
    {
      startDate: "2024-12-02T00:00:00.000Z",
      endDate: "2024-12-05T23:59:59.999Z",
    },
    {
      startDate: "2024-12-11T00:00:00.000Z",
      endDate: "2024-12-12T23:59:59.999Z",
    },
  ];
};

// Function to transform fetched dates to the required format
const transformDisabledDates = (graphqlDates) => {
  return graphqlDates.map((date) => ({
    startDate: new Date(date.startDate),
    endDate: new Date(date.endDate),
  }));
};

const App = () => {
  const [value, setValue] = useState({
    startDate: null,
    endDate: null,
  });

  const [disabledDates, setDisabledDates] = useState([]);

  useEffect(() => {
    // GAMBIARRA HERE:
    // Calendar expanded
    const targetElement = document.querySelector(
      "#root > div > div:first-child"
    );

    if (targetElement) {
      targetElement.classList.remove("hidden");
      targetElement.classList.add("opacity-1");
    } else {
      console.warn("Target element '#root > div > div:first-child' not found.");
    }
  }, []);

  useEffect(() => {
    // Fetch and transform the dates from the GraphQL server
    const datesFromServer = fetchDisabledDates();
    const transformedDates = transformDisabledDates(datesFromServer);
    setDisabledDates(transformedDates);
  }, []);

  // Function to handle the change in datepicker and create a JSON object with Unix time
  const handleDateChange = (newValue) => {
    setValue(newValue);

    // Convert dates to Unix time (seconds since Jan 1, 1970)
    const startDateUnix = newValue.startDate
      ? Math.floor(new Date(newValue.startDate).getTime() / 1000)
      : null;
    const endDateUnix = newValue.endDate
      ? Math.floor(new Date(newValue.endDate).getTime() / 1000)
      : null;

    // Create JSON object using the Unix timestamps
    const dateObject = {
      startDate: startDateUnix,
      endDate: endDateUnix,
      startDateRaw: newValue.startDate,
      endDateRaw: newValue.endDate,
    };

    // Log the JSON object to the console or use it further in your application
    console.log("Selected Dates JSON:", JSON.stringify(dateObject, null, 2));
  };

  return (
    <Datepicker
      displayFormat="DD/MM/YYYY"
      disabledDates={disabledDates}
      primaryColor={"red"}
      minDate={MIN_DATE}
      value={value}
      onChange={handleDateChange}
    />
  );
};

export default App;
