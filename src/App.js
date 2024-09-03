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
const GET_RESERVE_DATA = gql`
  query GetReserveData {
    basePrice
    specialPricesPerDate {
      holidayGroup {
        startDate
        endDate
        price
      }
    }
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
  const { loading, error, data } = useQuery(GET_RESERVE_DATA);

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

const Dropdown = ({ options, isOpen, onSelect, closeDropdown }) => {
  return (
    isOpen && (
      <div className="absolute bg-white border border-gray-300 rounded mt-2 p-2 shadow-lg z-10">
        {options.map((option, index) => (
          <div
            key={index}
            className="cursor-pointer hover:bg-gray-100 p-2"
            onClick={() => {
              onSelect(option);
              closeDropdown();
            }}
          >
            {option}
          </div>
        ))}
      </div>
    )
  );
};

const App = () => {
  const [value, setValue] = useState({
    startDate: null,
    endDate: null,
  });

  const [disabledDates, setDisabledDates] = useState([]);
  const [dropdownState, setDropdownState] = useState({
    product: false,
    vertical: false,
    location: false,
  });

  const [selectedValues, setSelectedValues] = useState({
    product: "Banner/Carrousel",
    vertical: "Mercado",
    location: "Home",
  });

  const [days, setDays] = useState(0);
  const [baseDayPrice, setDayPrice] = useState(0);

  // Edit dropdowns option
  const productOptions = ["Banner/Outdoor", "Banner/Carrousel"];
  const verticalOptions = ["Mercado", "Tecnologia"];
  const locationOptions = ["Home", "Categoria"];

  useEffect(() => {
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

    // calculate days from newValue.startDate to newValue.endDate and output an int.
    const days =
      (newValue.endDate - newValue.startDate) / (1000 * 60 * 60 * 24) + 1;

    setDays(days); // Update the days state

    const dateObject = {
      startDate: startDateUnix,
      endDate: endDateUnix,
      startDateRaw: newValue.startDate,
      endDateRaw: newValue.endDate,
      rangeDays: days,
    };

    console.log("Selected Dates JSON:", JSON.stringify(dateObject, null, 2));
  };

  const toggleDropdown = (field) => {
    setDropdownState((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const closeDropdown = () => {
    setDropdownState({
      product: false,
      vertical: false,
      location: false,
    });
  };

  const handleSelect = (field, option) => {
    setSelectedValues((prevState) => ({
      ...prevState,
      [field]: option,
    }));
  };

  return (
    <ApolloProvider client={client}>
      <FetchDisabledDates onDataFetched={setDisabledDates} />
      <div className="container mx-auto p-4 relative">
        <Datepicker
          useRange={false}
          inputId="datepicker"
          inputName="datepicker"
          required={true}
          i18n={"pt-br"}
          placeholder="Selecione a reserva"
          separator="até"
          startWeekOn="sun"
          displayFormat="DD/MM/YYYY"
          disabledDates={disabledDates}
          primaryColor={"red"}
          minDate={MIN_DATE}
          value={value}
          showShortcuts={false}
          onChange={handleDateChange}
        />
        <div className="reservation-details mt-6 relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <p className="font-bold">
                Produto:{" "}
                <span className="font-normal">{selectedValues.product}</span>{" "}
                <a
                  href="#"
                  className="text-blue-600"
                  id="editProduct"
                  onClick={() => toggleDropdown("product")}
                >
                  Editar
                </a>
              </p>
              <Dropdown
                options={productOptions}
                isOpen={dropdownState.product}
                onSelect={(option) => {
                  handleSelect("product", option);
                }}
                closeDropdown={closeDropdown}
              />
            </div>
            <div className="relative">
              <p className="font-bold">
                Vertical:{" "}
                <span className="font-normal">{selectedValues.vertical}</span>{" "}
                <a
                  href="#"
                  className="text-blue-600"
                  id="editVertical"
                  onClick={() => toggleDropdown("vertical")}
                >
                  Editar
                </a>
              </p>
              <Dropdown
                options={verticalOptions}
                isOpen={dropdownState.vertical}
                onSelect={(option) => {
                  handleSelect("vertical", option);
                }}
                closeDropdown={closeDropdown}
              />
            </div>
            <div className="relative">
              <p className="font-bold">
                Local:{" "}
                <span className="font-normal">{selectedValues.location}</span>{" "}
                <a
                  href="#"
                  className="text-blue-600"
                  id="editLocation"
                  onClick={() => toggleDropdown("location")}
                >
                  Editar
                </a>
              </p>
              <Dropdown
                options={locationOptions}
                isOpen={dropdownState.location}
                onSelect={(option) => {
                  handleSelect("location", option);
                }}
                closeDropdown={closeDropdown}
              />
            </div>
            <div className="bg-gray-100 p-4 border border-gray-300">
              <p className="font-bold text-teal-600">Tipo Mensal:</p>
              <p className="font-bold">
                {/* Unitário: <span className="text-orange-600">Multiplos</span> */}
              </p>
              <p className="font-bold">
                Dias:{" "}
                <span className="font-normal" id="daysOutput">
                  {days}
                </span>
              </p>
              <p className="font-bold">
                Total: <span className="font-normal">R$ {days * 15000}</span>
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="font-bold">
              Industria: <span className="font-normal">Coca Cola FEMSA</span>{" "}
              CNPJ: 01.234.567/0001-89
            </p>
          </div>
          <div className="mt-4">
            <label htmlFor="description" className="font-bold">
              Descrição da reserva:
            </label>
            <textarea
              id="description"
              name="description"
              className="w-full border border-gray-300 p-2 mt-1"
              rows="4"
              placeholder="Escreva uma descrição..."
            ></textarea>
          </div>
          <div className="mt-4">
            {/* <p className="text-red-600 font-bold">Importante:</p> */}
            {/* <p className="text-red-600">
              Sua reserva será mantida por até XX horas.
            </p> */}
          </div>
          <div className="mt-6">
            <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded">
              Confirmar reserva
            </button>
          </div>
        </div>
      </div>
    </ApolloProvider>
  );
};

export default App;
