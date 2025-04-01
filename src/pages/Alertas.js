import React, { useState, useEffect } from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";
import { GoogleMap, Marker } from "@react-google-maps/api";
import Swal from "sweetalert2";

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Alertas({ setIsLoggedIn, isGoogleMapsLoaded }) {

  
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  const [alertas, setAlertas] = useState([]);
  const [selectedAlerta, setSelectedAlerta] = useState(null);
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const [addressCache, setAddressCache] = useState({});

  const mapContainerStyle = { width: "100%", height: "550px", position: "relative" };
  const center = { lat: 20.5888, lng: -100.3899 };

  const getAddress = async (lat, lng) => {
    const cacheKey = `${lat},${lng}`;
    if (addressCache[cacheKey]) return addressCache[cacheKey];

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyC7IIRa4kxYY3Yiq1PD64XHDt1fl_f_kDc"}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        setAddressCache((prev) => ({ ...prev, [cacheKey]: address }));
        return address;
      }
      return "Ubicación desconocida";
    } catch (error) {
      console.error("Error al obtener dirección:", error);
      return "Error al obtener dirección";
    }
  };

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const response = await fetch(`${REACT_APP_API_URL}/alertas`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          const alertasConDirecciones = await Promise.all(
            data.map(async (alerta) => {
              const direccion = await getAddress(alerta.coordenadas.lat, alerta.coordenadas.lng);
              return { ...alerta, direccion };
            })
          );
          console.log("Datos procesados de alertas:", alertasConDirecciones);
          setAlertas(alertasConDirecciones);
        } else {
          const errorText = await response.text();
          Swal.fire({ icon: "error", title: "Error", text: `Error al obtener alertas: ${errorText}` });
        }
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: "Error de red al obtener alertas" });
      }
    };
    fetchAlertas();
  }, []);

  const alertasPorVehiculo = alertas.reduce((acc, alerta) => {
    const key = `${alerta.marca}-${alerta.modelo}`;
    if (!acc[key]) {
      acc[key] = {
        marca: alerta.marca,
        modelo: alerta.modelo,
        conductor: alerta.conductor,
        alertas: [],
      };
    }
    acc[key].alertas.push(alerta);
    return acc;
  }, {});

  const toggleVehicle = (key) => {
    setExpandedVehicle(expandedVehicle === key ? null : key);
  };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />
      <div style={{ padding: "20px" }}>
        <div className="container-fluid">
          <div className="row g-3">
            <div className="col-lg-4">
              <div className="border rounded p-3 h-100" style={{ maxHeight: "550px", overflowY: "auto" }}>
                <h3>Historial de Alertas</h3>
                {Object.keys(alertasPorVehiculo).length === 0 ? (
                  <p>No hay alertas, descansos ni emergencias disponibles.</p>
                ) : (
                  Object.entries(alertasPorVehiculo).map(([key, vehiculo]) => (
                    <div key={key} className="mb-3">
                      <div
                        className="d-flex justify-content-between align-items-center p-2"
                        style={{ backgroundColor: "#f8f9fa", cursor: "pointer", borderRadius: "5px" }}
                        onClick={() => toggleVehicle(key)}
                      >
                        <div>
                          <strong>{vehiculo.marca} {vehiculo.modelo}</strong><br />
                          <strong>Conductor:</strong> {vehiculo.conductor}
                        </div>
                        <button className="btn btn-sm btn-dark">
                          {expandedVehicle === key ? "Ocultar" : "Ver alertas"} ({vehiculo.alertas.length})
                        </button>
                      </div>
                      {expandedVehicle === key && (
                        <div className="mt-2">
                          {vehiculo.alertas.map((alerta) => (
                            <div
                              key={alerta.id}
                              className="p-2 border-bottom"
                              style={{ backgroundColor: "#ffffff", cursor: "pointer" }}
                              onClick={() => setSelectedAlerta(alerta)}
                            >
                              <p>
                                <strong>Viaje:</strong> {alerta.id_viaje || "No disponible"}<br />
                                <strong>Ubicación:</strong> {alerta.direccion}<br />
                                <strong>Tipo:</strong> {alerta.tipo}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="col-lg-8">
              <div className="border rounded p-3 h-100">
                <h3>Mapa de Alertas, Descansos y Emergencias</h3>
                {isGoogleMapsLoaded ? (
                  <div style={{ position: "relative" }}>
                    <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={10}>
                      {alertas.map((alerta) => (
                        <Marker
                          key={alerta.id}
                          position={alerta.coordenadas}
                          icon={{ url: alerta.icon, scaledSize: new window.google.maps.Size(32, 32) }}
                          title={`${alerta.marca} ${alerta.modelo} - ${alerta.tipo}`}
                          onClick={() => setSelectedAlerta(alerta)}
                        />
                      ))}
                    </GoogleMap>
                    <div style={{ position: "absolute", top: "13px", left: "230px", borderRadius: "6px", padding: "6px", zIndex: 1000 }}>
                      <div className="d-flex" style={{ gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ backgroundColor: "#FFD700", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", color: "#000000", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)", display: "flex", alignItems: "center" }}>Tráfico</div>
                        <div style={{ backgroundColor: "#8B4513", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", color: "#ffffff", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)", display: "flex", alignItems: "center" }}>Falla mecánica</div>
                        <div style={{ backgroundColor: "#FF0000", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", color: "#ffffff", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)", display: "flex", alignItems: "center" }}>Accidente</div>
                        <div style={{ backgroundColor: "#FF4500", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", color: "#ffffff", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)", display: "flex", alignItems: "center" }}>Emergencia</div>
                        <div style={{ backgroundColor: "#800080", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", color: "#ffffff", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)", display: "flex", alignItems: "center", gap: "3px" }}>Descanso<span style={{ fontSize: "10px" }}>💤</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>Cargando mapa...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alertas;