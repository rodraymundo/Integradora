import React, { useState, useCallback } from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

function Alertas({ setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  // Datos de ejemplo para las alertas con coordenadas coherentes de Querétaro
  const alertas = [
    {
      id: 1,
      marca: "Kenworth",
      modelo: "2019 UMY-526-D",
      conductor: "Ángel Avilés",
      ubicacion: "Carretera 57, salida a San Luis Potosí",
      coordenadas: { lat: 20.5958, lng: -100.3897 },
      tipo: "Accidente",
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    },
    {
      id: 2,
      marca: "Nissan",
      modelo: "2020 UPG-326-F",
      conductor: "Juan Suárez",
      ubicacion: "Autopista Querétaro-México, km 180",
      coordenadas: { lat: 20.6167, lng: -100.4061 },
      tipo: "Tráfico",
      icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    },
    {
      id: 3,
      marca: "Volvo",
      modelo: "2010 UMD-326-F",
      conductor: "Juan Pérez",
      ubicacion: "Carretera a Tequisquiapan, km 10",
      coordenadas: { lat: 20.5183, lng: -100.2978 },
      tipo: "Descanso activo",
      icon: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
    },
  ];

  const [selectedAlerta, setSelectedAlerta] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Configuración del mapa
  const mapContainerStyle = {
    width: "100%",
    height: "500px",
  };

  const center = {
    lat: 20.5888, // Centro aproximado de Querétaro
    lng: -100.3899,
  };

  // Callback para cuando la API de Google Maps se carga
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
            {/* Lista de alertas */}
            <div className="col-lg-4">
              <div className="border rounded p-3 h-100">
                <h3>Historial de alertas</h3>
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                    style={{ backgroundColor: "#f8f9fa", cursor: "pointer" }}
                    onClick={() => setSelectedAlerta(alerta)}
                  >
                    <div>
                      <p>
                        <strong>{alerta.marca} {alerta.modelo}</strong><br />
                        <strong>Conductor:</strong> {alerta.conductor}<br />
                        <strong>Ubicación:</strong> {alerta.ubicacion}<br />
                        <strong>Coordenadas:</strong> {`lat: ${alerta.coordenadas.lat}, lng: ${alerta.coordenadas.lng}`}
                      </p>
                    </div>
                    <button className="btn btn-dark">Ver más</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mapa */}
            <div className="col-lg-8">
              <div className="border rounded p-3 h-100">
                <h3>Mapa de Alertas</h3>
                <LoadScript
                  googleMapsApiKey="AIzaSyC7IIRa4kxYY3Yiq1PD64XHDt1fl_f_kDc" // Reemplaza con tu API Key
                  onLoad={onLoad}
                >
                  {mapLoaded && (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={center}
                      zoom={10}
                    >
                      {alertas.map((alerta) => (
                        <Marker
                          key={alerta.id}
                          position={alerta.coordenadas}
                          icon={{
                            url: alerta.icon,
                            scaledSize: new window.google.maps.Size(32, 32),
                          }}
                          title={`${alerta.marca} ${alerta.modelo} - ${alerta.tipo}`}
                        />
                      ))}
                    </GoogleMap>
                  )}
                </LoadScript>
                {!mapLoaded && <p>Cargando mapa...</p>}
              </div>
            </div>
          </div>

          {/* Leyenda de tipos de alertas */}
          <div className="row mt-3">
            <div className="col-12">
              <div className="d-flex justify-content-around">
                <div style={{ backgroundColor: "#ffff00", padding: "5px 10px", borderRadius: "5px" }}>Tráfico</div>
                <div style={{ backgroundColor: "#8B4513", padding: "5px 10px", borderRadius: "5px" }}>Falla mecánica</div>
                <div style={{ backgroundColor: "#FF0000", padding: "5px 10px", borderRadius: "5px" }}>Accidente</div>
                <div style={{ backgroundColor: "#FF4500", padding: "5px 10px", borderRadius: "5px" }}>Emergencia</div>
                <div style={{ backgroundColor: "#800080", padding: "5px 10px", borderRadius: "5px" }}>Descanso activo <span style={{ fontSize: "12px" }}>💤</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alertas;