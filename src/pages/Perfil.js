import React, { useState, useEffect } from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";
// Importaciones de FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

function Perfil({ setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  // Estado para almacenar la información del usuario
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Obtener la información del usuario desde localStorage
    const session = localStorage.getItem("userSession");
    if (session) {
      const userData = JSON.parse(session);
      setUser({
        nombreCompleto: `${userData.nombre} ${userData.apaterno} ${userData.amaterno || ""}`.trim(),
        correo: userData.correo,
        tipoUsuario: userData.tipo_usuario,
        celular: userData.celular || "No especificado", // Valor por defecto si no existe
      });
    }
  }, []);

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />
      
      {/* Contenido principal */}
      <div style={{ padding: "20px", minHeight: "calc(100vh - 56px)" }}>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="border rounded p-4 text-center" style={{ backgroundColor: "#fff" }}>
               {/* Icono de FontAwesome en lugar de la imagen */}
               <div
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "100%",
                    backgroundColor: "#e9ecef", // Fondo gris claro
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px auto", // Centrado y margen inferior
                  }}
                >
                  <FontAwesomeIcon
                    icon={faUser}
                    style={{
                      fontSize: "80px", // Tamaño del icono
                      color: "#6c757d", // Color gris oscuro
                    }}
                  />
                </div>
                {user ? (
                  <div>
                    <h3>{user.nombreCompleto}</h3>
                    <p><strong>Correo:</strong> {user.correo}</p>
                    <p><strong>Rol:</strong> {user.tipoUsuario}</p>
                    <p><strong>Celular:</strong> {user.celular}</p>
                  </div>
                ) : (
                  <p>No se encontró información del perfil. Por favor, inicia sesión nuevamente.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Perfil;