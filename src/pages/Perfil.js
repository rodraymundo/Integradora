import React, { useState, useEffect } from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";

function Perfil({ setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  // Estado para almacenar la información del usuario (simulado desde localStorage o API)
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Simulamos obtener la información del usuario desde localStorage o una API
    const session = localStorage.getItem("userSession");
    if (session) {
      const userData = JSON.parse(session);
      setUser({
        nombre: userData.nombre || "Samuel Palacios", // Ajusta según tu estructura de datos
        celular: userData.celular || "4421246543",
        correo: userData.correo || "samuel@gmail.com",
        rol: userData.rol || "administrador",
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
                <img
                  src="https://via.placeholder.com/150" // Reemplaza con la URL de una imagen real o usa una API
                  alt="Foto de perfil"
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "100%",
                    marginBottom: "20px",
                  }}
                />
                <h3>Perfil</h3>
                {user ? (
                  <div>
                    <p><strong>Nombre:</strong> {user.nombre}</p>
                    <p><strong>Celular:</strong> {user.celular}</p>
                    <p><strong>Correo:</strong> {user.correo}</p>
                    <p><strong>Rol:</strong> {user.rol}</p>
                  </div>
                ) : (
                  <p>Cargando información del perfil...</p>
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