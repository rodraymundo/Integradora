import React from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";  // Importa useNavigate

function Perfil({ setIsLoggedIn }) {
  const navigate = useNavigate();  // Declara useNavigate

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
    navigate("/login");  // Redirige al login después de cerrar sesión
  };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />

      {/* Contenido del perfil */}
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-4 col-md-6">
            <div className="text-center border rounded p-4 bg-light">
              <div className="mb-3">
                <img
                  src="default_profile_picture.png"
                  alt="Perfil"
                  className="img-fluid rounded-circle"
                  style={{ width: "150px", height: "150px" }}
                />
              </div>
              <h5>Nombre</h5>
              <p>Samuel Palacios</p>
              <h5>Celular</h5>
              <p>4421246543</p>
              <h5>Correo</h5>
              <p>samuel@gmail.com</p>
              <h5>Rol</h5>
              <p>Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
