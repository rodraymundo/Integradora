import React, { useState, useEffect, useCallback } from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

function Dashboard({ setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  const [vehicles, setVehicles] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState(""); // Estado para la dirección (opcional)

  // Cargar vehículos desde la API
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch("http://localhost:5000/vehiculo/active"); // Usar la misma ruta que Vehiculos.js
      const data = await response.json();
      const vehiclesWithPositions = data.map((vehicle) => {
        // Generar variaciones aleatorias alrededor de un punto central
        const randomLatOffset = (Math.random() - 0.5) * 0.02; // Variación entre -0.01 y 0.01
        const randomLngOffset = (Math.random() - 0.5) * 0.02; // Variación entre -0.01 y 0.01
        return {
          ...vehicle,
          position: {
            lat: 20.6539 + randomLatOffset,
            lng: -100.4351 + randomLngOffset,
          },
        };
      });
      setVehicles(vehiclesWithPositions);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    }
  };

  // Configuración del mapa
  const mapContainerStyle = {
    width: "100%",
    height: "480px", // Igual que en Vehiculos.js
  };

  const center = {
    lat: 20.6539, // Centro en Querétaro, consistente con Vehiculos.js
    lng: -100.4351,
  };

  const onLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  // Función para obtener la dirección (opcional, como en Vehiculos.js)
  const getAddress = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyC7IIRa4kxYY3Yiq1PD64XHDt1fl_f_kDc`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress("Dirección no disponible");
      }
    } catch (error) {
      console.error("Error al obtener la dirección:", error);
      setAddress("Error al obtener la dirección");
    }
  };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />

      {/* Contenido principal */}
      <div style={{ padding: "20px" }}>
        <div className="container-fluid">
          <div className="row g-3">
            {/* Mapa */}
            <div className="col-lg-8">
              <div className="border rounded p-3 h-100">
                <h3>Mapa de Vehículos</h3>
                <LoadScript
                  googleMapsApiKey="AIzaSyC7IIRa4kxYY3Yiq1PD64XHDt1fl_f_kDc" // Misma API Key
                  onLoad={onLoad}
                >
                  {mapLoaded ? (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={center}
                      zoom={14} // Mismo nivel de zoom
                    >
                      {vehicles.map((vehicle) => (
                        <Marker
                          key={vehicle.matricula}
                          position={vehicle.position}
                          title={`${vehicle.marca} - ${vehicle.matricula}`}
                          icon={{
                            url: "https://maps.google.com/mapfiles/kml/shapes/truck.png",
                            scaledSize: new window.google.maps.Size(50, 50),
                          }}
                          onMouseOver={() => getAddress(vehicle.position.lat, vehicle.position.lng)} // Opcional
                        />
                      ))}
                    </GoogleMap>
                  ) : (
                    <p>Cargando mapa...</p>
                  )}
                </LoadScript>
                {address && <p>Ubicación: {address}</p>} {/* Opcional */}
              </div>
            </div>

            {/* Gráficas */}
            <div className="col-lg-4">
              <div className="row g-3">
                {[1, 2, 3, 4].map((num) => (
                  <div className="col-12 col-sm-6 col-lg-12" key={num}>
                    <div className="bg-light rounded p-3">
                      <h5>Gráfica {num}</h5>
                      <img
                        src={`grafica${num}.png`}
                        alt={`Gráfica ${num}`}
                        className="img-fluid"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;