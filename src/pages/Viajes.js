import React, { useState } from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";

function Viajes({ setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  // Datos de ejemplo para los viajes
  const viajes = [
    {
      id: 1,
      cliente: "Lala",
      origen: "San Juan del Río, Querétaro",
      destino: "León, Guanajuato",
    },
    {
      id: 2,
      cliente: "Femsa",
      origen: "Acámbaro, Guanajuato",
      destino: "Ciudad Juárez, Chihuahua",
    },
    {
      id: 3,
      cliente: "Samsung",
      origen: "Querétaro, Querétaro",
      destino: "Hermosillo, Sonora",
    },
  ];

  const [selectedViaje, setSelectedViaje] = useState(null);

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />
      
      {/* Contenido principal */}
      <div style={{ padding: "20px" }}>
        <div className="container-fluid">
          <div className="row g-3">
            {/* Lista de viajes */}
            <div className="col-lg-4">
              <div className="border rounded p-3 h-100">
                <h3>Viajes Actuales</h3>
                {viajes.map((viaje) => (
                  <div
                    key={viaje.id}
                    className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                    style={{ backgroundColor: "#f8f9fa", cursor: "pointer" }}
                    onClick={() => setSelectedViaje(viaje)}
                  >
                    <div>
                      <p>
                        <strong>Cliente:</strong> {viaje.cliente}<br />
                        <strong>Origen:</strong> {viaje.origen}<br />
                        <strong>Destino:</strong> {viaje.destino}
                      </p>
                    </div>
                    <button className="btn btn-dark">Ver más</button>
                  </div>
                ))}
                <button className="btn btn-success mt-3 w-100">Añadir Viaje</button>
              </div>
            </div>

            {/* Área de detalles (puedes expandirla según necesidad) */}
            <div className="col-lg-8">
              <div className="border rounded p-3 h-100">
                <h3>Detalles del Viaje</h3>
                {selectedViaje ? (
                  <div>
                    <p><strong>Cliente:</strong> {selectedViaje.cliente}</p>
                    <p><strong>Origen:</strong> {selectedViaje.origen}</p>
                    <p><strong>Destino:</strong> {selectedViaje.destino}</p>
                    {/* Aquí puedes agregar más detalles o un formulario al hacer clic en "Ver más" */}
                  </div>
                ) : (
                  <p>Selecciona un viaje para ver los detalles.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Viajes;