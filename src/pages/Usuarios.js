import React, { useState } from "react";
import Header from "../Header";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function Usuarios({ setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  // Datos de ejemplo para administradores y conductores
  const admins = [
    {
      id: 1,
      nombre: "Samuel Palacios",
      celular: "4421246543",
    },
    {
      id: 2,
      nombre: "Israel Olivera",
      celular: "4420212621",
    },
  ];

  const conductores = [
    {
      id: 1,
      nombre: "Víctor Rodríguez",
      celular: "4421021982",
    },
    {
      id: 2,
      nombre: "Ángel Avilés",
      celular: "5520217432",
    },
  ];

  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />
      
      {/* Contenido principal */}
      <div style={{ padding: "20px" }}>
        <div className="container-fluid">
          <div className="row g-3">
            {/* Lista de usuarios */}
            <div className="col-lg-4">
              <div className="border rounded p-3 h-100">
                <h3>Administrador</h3>
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                    style={{
                      backgroundColor: admin.id === 1 ? "#00C4FF" : "#f8f9fa",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedUser(admin)}
                  >
                    <div>
                      <p>
                        <strong>Nombre:</strong> {admin.nombre}<br />
                        <strong>Celular:</strong> {admin.celular}
                      </p>
                    </div>
                    <button className="btn btn-dark">Ver más</button>
                  </div>
                ))}

                <h3 className="mt-4">Conductores</h3>
                {conductores.map((conductor) => (
                  <div
                    key={conductor.id}
                    className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                    style={{ backgroundColor: "#f8f9fa", cursor: "pointer" }}
                    onClick={() => setSelectedUser(conductor)}
                  >
                    <div>
                      <p>
                        <strong>Nombre:</strong> {conductor.nombre}<br />
                        <strong>Celular:</strong> {conductor.celular}
                      </p>
                    </div>
                    <button className="btn btn-dark">Ver más</button>
                  </div>
                ))}
                <button className="btn btn-success mt-3 w-100">Añadir usuario</button>
              </div>
            </div>

            {/* Área de detalles (puedes expandirla según necesidad) */}
            <div className="col-lg-8">
              <div className="border rounded p-3 h-100">
                <h3>Detalles del Usuario</h3>
                {selectedUser ? (
                  <div>
                    <p><strong>Nombre:</strong> {selectedUser.nombre}</p>
                    <p><strong>Celular:</strong> {selectedUser.celular}</p>
                    {/* Aquí puedes agregar más detalles o un formulario al hacer clic en "Ver más" */}
                  </div>
                ) : (
                  <p>Selecciona un usuario para ver los detalles.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Usuarios;