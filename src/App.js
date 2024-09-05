import React, { useState, useEffect } from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql,
} from "@apollo/client";
import moment from "moment";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./override.css";
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

const localizer = momentLocalizer(moment);

const transformDisabledDates = (graphqlDates) => {
  return graphqlDates.map((date) => {
    const startDate = new Date(date.startDate);
    const endDate = new Date(date.endDate);

    startDate.setDate(startDate.getDate() + 1);
    endDate.setDate(endDate.getDate() + 1);

    return {
      start: startDate,
      end: endDate,
      title: "Unavailable",
    };
  });
};

const FetchDisabledDates = ({ onDataFetched }) => {
  const { loading, error, data } = useQuery(GET_RESERVE_DATA);

  useEffect(() => {
    if (!loading && data) {
      const transformedDates = transformDisabledDates(data.disabledDates);
      onDataFetched(transformedDates);
    }
    if (error) {
      console.warn("Error fetching data:", error);
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

  const [events, setEvents] = useState([]);
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
  const [editingEvent, setEditingEvent] = useState(null); // Holds the currently selected event for editing

  const productOptions = ["Banner/Outdoor", "Banner/Carrousel"];
  const verticalOptions = ["Mercado", "Refeição"];
  const locationOptions = ["Home", "Subpagina"];

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

    const days =
      (newValue.endDate - newValue.startDate) / (1000 * 60 * 60 * 24) + 1;

    setDays(days); // Update the days state
  };

  const handleConfirmReservation = () => {
    if (value.startDate && value.endDate) {
      const newEvent = {
        title: `Campanha ${selectedValues.product}`,
        start: new Date(value.startDate),
        end: new Date(value.endDate),
      };

      // Check if we're editing an existing event
      if (editingEvent) {
        setEvents((prevEvents) =>
          prevEvents.map((event) => (event === editingEvent ? newEvent : event))
        );
        setEditingEvent(null); // Clear the editing state
      } else {
        setEvents((prevEvents) => [...prevEvents, newEvent]);
      }
    }
  };

  const handleEventClick = (event) => {
    // Load the selected event details into the form for editing
    setValue({
      startDate: event.start,
      endDate: event.end,
    });
    setSelectedValues({
      product: event.title.split("Campanha ")[1], // Extract the product name
      vertical: "Mercado", // Set default for now, will be extended
      location: "Home", // Set default for now, will be extended
    });

    const days = (event.end - event.start) / (1000 * 60 * 60 * 24) + 1;
    setDays(days); // Update the days state based on the selected event

    setEditingEvent(event); // Set the selected event for editing
  };

  const handleSlotSelect = () => {
    // Unselect the current event and reset the form to create a new reservation
    setValue({ startDate: null, endDate: null });
    setSelectedValues({
      product: "Banner/Carrousel",
      vertical: "Mercado",
      location: "Home",
    });
    setDays(0);
    setEditingEvent(null); // Clear the editing state to allow creating a new event
  };

  const handleFetchedDisabledDates = (fetchedEvents) => {
    setEvents((prevEvents) => [...prevEvents, ...fetchedEvents]);
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
      <FetchDisabledDates onDataFetched={handleFetchedDisabledDates} />
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
          primaryColor={"red"}
          minDate={MIN_DATE}
          value={value}
          showShortcuts={false}
          onChange={handleDateChange}
        />

        {/* React Big Calendar & Picker Area */}
        <div className="my-8">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            defaultView={Views.MONTH}
            views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
            onSelectEvent={handleEventClick} // Handle event click (in this case the select event)
            onSelectSlot={handleSlotSelect} // Unselect and reset form when clicking outside of an event
            selectable={true}
            toolbar={true}
            // titleAccessor="Calendário de reservas"
            allDayAccessor={true}
          />
        </div>

        {/* Main Reserve Details Area */}
        <div className="reservation-details mt-6 relative">
          <div className="grid grid-rows-1 grid-flow-col gap-4">
            <div>
              <div className="relative">
                <p className="font-bold">
                  Produto:{" "}
                  <span className="font-normal">{selectedValues.product}</span>{" "}
                  <a
                    href="#"
                    className="text-red-600"
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
                    className="text-red-600"
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
                    className="text-red-600"
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
            </div>

            <div className="bg-gray-100 p-4 border border-gray-300">
              <p className="font-bold text-teal-600">Tipo Mensal:</p>
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
          <div className="mt-6">
            <button
              className="bg-red-600 text-white font-bold py-2 px-4 rounded"
              onClick={handleConfirmReservation}
            >
              {editingEvent ? "Atualizar reserva" : "Confirmar reserva"}
            </button>
          </div>
        </div>
      </div>
    </ApolloProvider>
  );
};

export default App;
