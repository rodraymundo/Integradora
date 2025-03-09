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

  // Cargar vehículos desde la API
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch("http://localhost:5000/vehiculo");
      const data = await response.json();
      const vehiclesWithPositions = data.map((vehicle, index) => ({
        ...vehicle,
        position: {
          lat: 20.6539 + index * 0.002, // Posiciones cercanas a Querétaro
          lng: -100.4351 + index * 0.002,
        },
      }));
      setVehicles(vehiclesWithPositions);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    }
  };

  // Configuración del mapa
  const mapContainerStyle = {
    width: "100%",
    height: "480px", // Ajusta la altura según necesites
  };

  const center = {
    lat: 20.6539, // Centro en Querétaro, consistente con Vehiculos.js
    lng: -100.4351,
  };

  const onLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

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
                  googleMapsApiKey="AIzaSyC7IIRa4kxYY3Yiq1PD64XHDt1fl_f_kDc" // Reemplaza con tu API Key
                  onLoad={onLoad}
                >
                  {mapLoaded ? (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={center}
                      zoom={14} // Nivel de zoom inicial
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
                        />
                      ))}
                    </GoogleMap>
                  ) : (
                    <p>Cargando mapa...</p>
                  )}
                </LoadScript>
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