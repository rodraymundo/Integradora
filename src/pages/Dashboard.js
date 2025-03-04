import React from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";

function Dashboard({ setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
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
                <img 
                  src="mapa_simulado.png" 
                  alt="Mapa" 
                  className="img-fluid"
                />
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