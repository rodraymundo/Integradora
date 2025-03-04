import React from "react";
import { Navbar, Nav, Dropdown } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const Header = ({ onLogout }) => {
  return (
    <Navbar expand="lg" className="shadow-sm" style={{ backgroundColor: "#fff" }}>
      <div className="w-100 d-flex justify-content-between">
        <Navbar.Brand href="#" className="ms-4">
          <img
            src="logo_ruta_segura.png"
            alt="Ruta Segura"
            style={{ height: "45px" }}
          />
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav" className="ms-4">
          <Nav className="me-auto d-flex justify-content-between w-100 mx-2 fs-5 " >
            <Nav.Link href="#/vehiculos" className="mx-2">Vehículos</Nav.Link>
            <Nav.Link href="#/usuarios" className="mx-2">Usuarios</Nav.Link>
            <Nav.Link href="#/viajes" className="mx-2">Viajes</Nav.Link>
            <Nav.Link href="#/alertas" className="mx-2">Alertas</Nav.Link>
          </Nav>
          
          <Dropdown align="end" className="ms-4">
            <Dropdown.Toggle variant="" id="dropdown-user">
              <FaUserCircle size={28} className="text-dark" />
            </Dropdown.Toggle>
            
            <Dropdown.Menu>
              <Dropdown.Item onClick={onLogout}>Cerrar Sesión</Dropdown.Item>
              <Dropdown.Item>Ver mi perfil</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
};

export default Header;
