import React, { useState, useEffect, useMemo } from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Dashboard = React.memo(({ setIsLoggedIn, handleLogout, isGoogleMapsLoaded }) => {


  const [vehicles, setVehicles] = useState([]);
  const [address, setAddress] = useState("");
  const [alertHistory, setAlertHistory] = useState([]);
  const [deliveryTimes, setDeliveryTimes] = useState([]);
  const [alertsByLocation, setAlertsByLocation] = useState([]);
  const [citiesData, setCitiesData] = useState({}); // Estado para datos de ciudades
  const [cityCache, setCityCache] = useState({});
  const [noLocationMessage, setNoLocationMessage] = useState(""); // Mensaje para vehículos sin ubicación

  useEffect(() => {
    const fetchData = async () => {
      await fetchVehicles();
      await fetchAlertHistory();
      await fetchDeliveryTimes();
      await fetchAlertsByLocation();
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const groupByCity = async () => {
      const groupedByCity = {};
      for (const alert of alertsByLocation) {
        if (!alert || !alert.coordenadas) continue;
        const { lat, lng } = alert.coordenadas;
        const city = await getAddress(lat, lng);
        groupedByCity[city] = (groupedByCity[city] || 0) + 1;
      }
      setCitiesData(groupedByCity);
    };

    if (alertsByLocation.length > 0) groupByCity();
  }, [alertsByLocation]);

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_URL}/vehiculo/active`, {
  credentials: "include",
});
      const data = await response.json();
      console.log("Datos de vehículos:", data);

      // Verificar si hay vehículos sin ubicación
      const vehiclesWithoutLocation = data.filter((vehicle) => !vehicle.position);
      if (vehiclesWithoutLocation.length > 0) {
        setNoLocationMessage(
          `No hay ubicación disponible para ${vehiclesWithoutLocation.length} vehículo(s): ${vehiclesWithoutLocation
            .map((v) => `${v.marca} ${v.modelo}`)
            .join(", ")}`
        );
      } else {
        setNoLocationMessage("");
      }

      setVehicles(data);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
      setNoLocationMessage("Error al cargar las ubicaciones de los vehículos.");
    }
  };

  const fetchAlertHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/alertas`, {
  credentials: "include",
});
      const data = await response.json();
      console.log("Datos de alertas (histórico):", data);
      setAlertHistory(data);
    } catch (error) {
      console.error("Error al cargar historial de alertas:", error);
    }
  };

  const fetchDeliveryTimes = async () => {
    try {
      const response = await fetch(`${API_URL}/vista_viajes_activos`, {
  credentials: "include",
});
      const data = await response.json();
      console.log("Datos de viajes (entrega):", data);
      const filteredData = data.filter((viaje) => viaje.fecha_salida && viaje.fecha_entrega);
      console.log("Datos filtrados de viajes:", filteredData);
      setDeliveryTimes(filteredData);
    } catch (error) {
      console.error("Error al cargar tiempos de entrega:", error);
    }
  };

  const fetchAlertsByLocation = async () => {
    try {
      const response = await fetch(`${API_URL}/alertas`, {
  credentials: "include",
});
      const data = await response.json();
      console.log("Datos de alertas (ubicación):", data);
      setAlertsByLocation(data);
    } catch (error) {
      console.error("Error al cargar alertas por ubicación:", error);
    }
  };

  const mapContainerStyle = { width: "100%", height: "480px" };
  const center = { lat: 20.6539, lng: -100.4351 };

  const getAddress = async (lat, lng) => {
    if (!isGoogleMapsLoaded) return "Ubicación desconocida";
    const cacheKey = `${lat},${lng}`;
    if (cityCache[cacheKey]) return cityCache[cacheKey];

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyC7IIRa4kxYY3Yiq1PD64XHDt1fl_f_kDc"}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        const city = addressComponents.find((comp) =>
          comp.types.includes("locality")
        )?.long_name || "Ubicación desconocida";
        setCityCache((prev) => ({ ...prev, [cacheKey]: city }));
        return city;
      }
      return "Ubicación desconocida";
    } catch (error) {
      console.error("Error al obtener la ciudad:", error);
      return "Error al obtener la ciudad";
    }
  };

  // Histórico de Alertas (solución temporal sin fecha_hora)
  const alertHistoryData = useMemo(() => {
    console.log("Procesando alertHistory:", alertHistory);
    const groupedByDate = alertHistory.reduce((acc, alert) => {
      // Usar una fecha ficticia basada en id si fecha_hora no está disponible
      const date = alert.fecha_hora
        ? new Date(alert.fecha_hora.split(" ")[0])
        : new Date(`2025-03-${alert.id % 2 === 0 ? 23 : 24}`);
      const formattedDate = date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      acc[formattedDate] = (acc[formattedDate] || 0) + 1;
      return acc;
    }, {});

    console.log("Datos agrupados por fecha:", groupedByDate);
    return {
      labels: Object.keys(groupedByDate),
      datasets: [
        {
          label: "Número de Alertas",
          data: Object.values(groupedByDate),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [alertHistory]);

  const alertHistoryOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Histórico de Alertas" },
    },
    scales: {
      x: { title: { display: true, text: "Fecha" } },
      y: { title: { display: true, text: "Cantidad" }, beginAtZero: true },
    },
    animation: false,
  }), []);

  // Tiempos de Entrega
  const deliveryTimesData = useMemo(() => {
    console.log("Procesando deliveryTimes:", deliveryTimes);
    const result = {
      labels: deliveryTimes.map((viaje) =>
        new Date(viaje.fecha_salida).toLocaleDateString("es-MX")
      ),
      datasets: [
        {
          label: "Tiempo de Entrega (horas)",
          data: deliveryTimes.map((viaje) => {
            const salida = new Date(viaje.fecha_salida);
            const entrega = new Date(viaje.fecha_entrega);
            return (entrega - salida) / (1000 * 60 * 60);
          }),
          fill: false,
          borderColor: "rgb(255, 99, 132)",
          tension: 0.1,
        },
      ],
    };
    console.log("Datos de tiempos de entrega:", result);
    return result;
  }, [deliveryTimes]);

  const deliveryTimesOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Tiempos de Entrega" },
    },
    scales: {
      x: { title: { display: true, text: "Fecha de Salida" } },
      y: { title: { display: true, text: "Horas" }, beginAtZero: true },
    },
    animation: false,
  }), []);

  // Alertas por Ubicación
  const alertsByLocationData = useMemo(() => {
    console.log("Datos agrupados por ciudad:", citiesData);
    return {
      labels: Object.keys(citiesData),
      datasets: [
        {
          label: "Alertas por Ciudad",
          data: Object.values(citiesData),
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [citiesData]);

  const alertsByLocationOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Alertas por Ciudad" },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw} alertas`,
        },
      },
    },
    animation: false,
  }), []);

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />
      <div style={{ padding: "20px" }}>
        <div className="container-fluid">
          <div className="row g-3">
            <div className="col-lg-8">
              <div className="border rounded p-3 h-100">
                <h3>Mapa de Vehículos</h3>
                {isGoogleMapsLoaded ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={14}
                  >
                    {vehicles
                      .filter((vehicle) => vehicle.position) // Solo mostrar vehículos con posición
                      .map((vehicle) => (
                        <Marker
                          key={vehicle.matricula}
                          position={vehicle.position}
                          title={`${vehicle.marca} - ${vehicle.matricula}`}
                          icon={{
                            url: "https://maps.google.com/mapfiles/kml/shapes/truck.png",
                            scaledSize: new window.google.maps.Size(50, 50),
                          }}
                          onMouseOver={() =>
                            getAddress(vehicle.position.lat, vehicle.position.lng).then(setAddress)
                          }
                        />
                      ))}
                  </GoogleMap>
                ) : (
                  <p>Cargando mapa...</p>
                )}
                {address && <p>Ubicación: {address}</p>}
                {noLocationMessage && (
                  <p style={{ color: "orange", marginTop: "10px" }}>{noLocationMessage}</p>
                )}
              </div>
            </div>
            <div className="col-lg-4">
              <div className="row g-3">
                <div className="col-12 col-sm-6 col-lg-12">
                  <div className="bg-light rounded p-3" style={{ height: "300px" }}>
                    <Bar data={alertHistoryData} options={alertHistoryOptions} />
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-lg-12">
                  <div className="bg-light rounded p-3" style={{ height: "300px" }}>
                    {deliveryTimes.length > 0 ? (
                      <Line data={deliveryTimesData} options={deliveryTimesOptions} />
                    ) : (
                      <p>No hay datos suficientes para mostrar los tiempos de entrega.</p>
                    )}
                  </div>
                </div>
                <div className="col-lg-12">
                  <div className="bg-light rounded p-3" style={{ height: "300px" }}>
                    <Pie data={alertsByLocationData} options={alertsByLocationOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = "Dashboard";

export default Dashboard;