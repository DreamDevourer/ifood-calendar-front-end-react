import React, { useState, useEffect } from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql,
} from "@apollo/client";
import Datepicker from "react-tailwindcss-datepicker";

// Apollo Client setup
const client = new ApolloClient({
  uri: "https://ifood-availability-backend-production-ifood.svc-us3.zcloud.ws/graphql",
  cache: new InMemoryCache(),
});

const MIN_DATE = new Date();
MIN_DATE.setDate(MIN_DATE.getDate() + 1);

// GraphQL query to fetch disabled dates
const GET_DISABLED_DATES = gql`
  query GetDisabledDates {
    disabledDates {
      startDate
      endDate
    }
  }
`;

const transformDisabledDates = (graphqlDates) => {
  return graphqlDates.map((date) => {
    const startDate = new Date(date.startDate);
    const endDate = new Date(date.endDate);

    // Add one day to account for the timezone shift or display issue
    startDate.setDate(startDate.getDate() + 1);
    endDate.setDate(endDate.getDate() + 1);

    return {
      startDate,
      endDate,
    };
  });
};

const FetchDisabledDates = ({ onDataFetched }) => {
  const { loading, error, data } = useQuery(GET_DISABLED_DATES);

  useEffect(() => {
    if (!loading) {
      if (error || !data || !data.disabledDates.length) {
        // If there's an error or no dates are returned, use a mock date
        const mockStartDate = new Date("2024-12-25");
        const mockEndDate = new Date("2024-12-26");

        mockStartDate.setDate(mockStartDate.getDate() + 1);
        mockEndDate.setDate(mockEndDate.getDate() + 1);
        const mockDates = [
          {
            startDate: mockStartDate,
            endDate: mockEndDate,
          },
        ];
        console.warn(
          "Using mock dates due to error or no data from server:",
          error
        );
        onDataFetched(mockDates);
      } else {
        const transformedDates = transformDisabledDates(data.disabledDates);
        onDataFetched(transformedDates);
      }
    }
  }, [loading, error, data, onDataFetched]);

  if (loading) return <p>Loading...</p>;

  return null;
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

  const handleDateChange = (newValue) => {
    setValue(newValue);

    const startDateUnix = newValue.startDate
      ? Math.floor(new Date(newValue.startDate).getTime() / 1000)
      : null;
    const endDateUnix = newValue.endDate
      ? Math.floor(new Date(newValue.endDate).getTime() / 1000)
      : null;

    const dateObject = {
      startDate: startDateUnix,
      endDate: endDateUnix,
      startDateRaw: newValue.startDate,
      endDateRaw: newValue.endDate,
    };

    console.log("Selected Dates JSON:", JSON.stringify(dateObject, null, 2));
  };

  return (
    <ApolloProvider client={client}>
      <FetchDisabledDates onDataFetched={setDisabledDates} />
      <Datepicker
        displayFormat="DD/MM/YYYY"
        disabledDates={disabledDates}
        primaryColor={"red"}
        minDate={MIN_DATE}
        value={value}
        onChange={handleDateChange}
      />
    </ApolloProvider>
  );
};

export default App;
