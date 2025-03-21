import React, { useState, useEffect, useCallback } from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTools,
  faTruck,
  faBox,
  faBan,
} from "@fortawesome/free-solid-svg-icons";

function Vehiculos({ setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };
  
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    matricula: "",
    marca: "",
    modelo: "",
    capacidad_peso_max: "",
    capacidad_volumen: "",
    estado: "mantenimiento",
    tipo_vehiculo: "pickup",
    tipo_carga: "carga seca",
    id_usuario: "",
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchVehicles();
    fetchUsers();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch("http://localhost:5000/vehiculo/active");
      const data = await response.json();
      const vehiclesWithPositions = data.map((vehicle, index) => {
        // Generar variaciones aleatorias alrededor de un punto central
        const randomLatOffset = (Math.random() - 0.5) * 0.02; // Variación entre -0.01 y 0.01
        const randomLngOffset = (Math.random() - 0.5) * 0.02; // Variación entre -0.01 y 0.01
        return {
          ...vehicle,
          position: {
            lat: 20.6539 + randomLatOffset,
            lng: -100.4351 + randomLngOffset,
          },
        };
      });
      setVehicles(vehiclesWithPositions);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/usuario");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  const mapContainerStyle = {
    width: "100%",
    height: "480px",
  };

  const center = {
    lat: 20.6539,
    lng: -100.4351,
  };

  const onLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  const handleShowDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedVehicle(null);
  };

  const handleShowForm = (vehicle = null) => {
    if (vehicle) {
      setIsEditing(true);
      setFormData({
        matricula: vehicle.matricula,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        capacidad_peso_max: vehicle.capacidad_peso_max,
        capacidad_volumen: vehicle.capacidad_volumen,
        estado: vehicle.estado,
        tipo_vehiculo: vehicle.tipo_vehiculo,
        tipo_carga: vehicle.tipo_carga,
        id_usuario: vehicle.id_usuario,
      });
    } else {
      setIsEditing(false);
      setFormData({
        matricula: "",
        marca: "",
        modelo: "",
        capacidad_peso_max: "",
        capacidad_volumen: "",
        estado: "mantenimiento",
        tipo_vehiculo: "pickup",
        tipo_carga: "carga seca",
        id_usuario: "",
      });
    }
    setShowFormModal(true);
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setFormData({
      matricula: "",
      marca: "",
      modelo: "",
      capacidad_peso_max: "",
      capacidad_volumen: "",
      estado: "mantenimiento",
      tipo_vehiculo: "pickup",
      tipo_carga: "carga seca",
      id_usuario: "",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsedFormData = {
        ...formData,
        capacidad_peso_max: parseFloat(formData.capacidad_peso_max),
        capacidad_volumen: parseFloat(formData.capacidad_volumen),
        id_usuario: parseInt(formData.id_usuario),
      };

      let response;
      if (isEditing) {
        response = await fetch(`http://localhost:5000/vehiculo/${formData.matricula}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedFormData),
        });
      } else {
        response = await fetch("http://localhost:5000/vehiculo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedFormData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar vehículo");
      }

      fetchVehicles();
      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      alert("Error al guardar vehículo: " + error.message);
    }
  };

  const handleDeleteVehicle = async (matricula) => {
    if (window.confirm("¿Estás seguro de dar de baja este vehículo?")) {
      try {
        const response = await fetch(`http://localhost:5000/vehiculo/${matricula}/delete`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al eliminar vehículo");
        }

        fetchVehicles();
        handleCloseDetails();
      } catch (error) {
        console.error("Error al eliminar vehículo:", error);
        alert("Error al eliminar vehículo: " + error.message);
      }
    }
  };

  const getUserName = (id_usuario) => {
    const user = users.find((u) => u.id_usuario === id_usuario);
    return user ? `${user.nombre} ${user.apaterno} ${user.amaterno}` : "Desconocido";
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case "mantenimiento":
        return <FontAwesomeIcon icon={faTools} title="En mantenimiento" style={{ color: "orange" }} />;
      case "disponible":
        return <FontAwesomeIcon icon={faTruck} title="Disponible" style={{ color: "green" }} />;
      case "en ruta":
        return <FontAwesomeIcon icon={faBox} title="En ruta" style={{ color: "blue" }} />;
      case "fuera de servicio":
        return <FontAwesomeIcon icon={faBan} title="Fuera de servicio" style={{ color: "red" }} />;
      default:
        return null;
    }
  };

  const getAddress = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyC7IIRa4kxYY3Yiq1PD64XHDt1fl_f_kDc`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress("Dirección no disponible");
      }
    } catch (error) {
      console.error("Error al obtener la dirección:", error);
      setAddress("Error al obtener la dirección");
    }
  };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header onLogout={handleLogout} />

      <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="container-fluid" style={{ flex: 1 }}>
          <div className="row g-3" style={{ flex: 1 }}>
            <div className="col-lg-4" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div
                className="border rounded p-3"
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "560px",
                }}
              >
                <h3>Mis vehículos</h3>
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    paddingRight: "5px",
                  }}
                >
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.matricula}
                      className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleShowDetails(vehicle)}
                    >
                      <div>
                        <p>
                          <strong>Marca:</strong> {vehicle.marca}<br />
                          <strong>Modelo:</strong> {vehicle.modelo}<br />
                          <strong>Matrícula:</strong> {vehicle.matricula}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ marginRight: "10px", color: "#555" }}>
                          {getStatusIcon(vehicle.estado)}
                        </span>
                        <button className="btn btn-dark">Ver más</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-success mt-3 w-100"
                  onClick={() => handleShowForm()}
                >
                  Añadir vehículo
                </button>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="border rounded p-3 h-100">
                <h3>Mapa de Vehículos</h3>
                <LoadScript
                  googleMapsApiKey="AIzaSyC7IIRa4kxYY3Yiq1PD64XHDt1fl_f_kDc"
                  onLoad={onLoad}
                >
                  {mapLoaded ? (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={center}
                      zoom={14}
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
                          onMouseOver={() => getAddress(vehicle.position.lat, vehicle.position.lng)}
                        />
                      ))}
                    </GoogleMap>
                  ) : (
                    <p>Cargando mapa...</p>
                  )}
                </LoadScript>
                {address && <p>Ubicación: {address}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal show={showDetailsModal} onHide={handleCloseDetails}>
        <Modal.Header closeButton>
          <Modal.Title>Detalles del vehículo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVehicle && (
            <div>
              <p><strong>Matrícula:</strong> {selectedVehicle.matricula}</p>
              <p><strong>Marca:</strong> {selectedVehicle.marca}</p>
              <p><strong>Modelo:</strong> {selectedVehicle.modelo}</p>
              <p><strong>Capacidad (Peso):</strong> {selectedVehicle.capacidad_peso_max} kg</p>
              <p><strong>Peso Disponible:</strong> {selectedVehicle.peso_disponible} kg</p>
              <p><strong>Capacidad (Volumen):</strong> {selectedVehicle.capacidad_volumen} m³</p>
              <p><strong>Estado:</strong> {selectedVehicle.estado}</p>
              <p><strong>Tipo de vehículo:</strong> {selectedVehicle.tipo_vehiculo}</p>
              <p><strong>Tipo de carga soportada:</strong> {selectedVehicle.tipo_carga}</p>
              <p><strong>Conductor:</strong> {getUserName(selectedVehicle.id_usuario)}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetails}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleCloseDetails();
              handleShowForm(selectedVehicle);
            }}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDeleteVehicle(selectedVehicle.matricula)}
          >
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showFormModal} onHide={handleCloseForm}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Editar vehículo" : "Añadir vehículo"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleFormSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Matrícula</Form.Label>
              <Form.Control
                type="text"
                name="matricula"
                value={formData.matricula || ""}
                onChange={handleFormChange}
                required
                disabled={isEditing}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Marca</Form.Label>
              <Form.Control
                type="text"
                name="marca"
                value={formData.marca || ""}
                onChange={handleFormChange}
                required
                disabled={isEditing}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Modelo</Form.Label>
              <Form.Control
                type="text"
                name="modelo"
                value={formData.modelo || ""}
                onChange={handleFormChange}
                required
                disabled={isEditing}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Capacidad (Peso en kg)</Form.Label>
              <Form.Control
                type="number"
                name="capacidad_peso_max"
                value={formData.capacidad_peso_max || ""}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Capacidad (Volumen en m³)</Form.Label>
              <Form.Control
                type="number"
                name="capacidad_volumen"
                value={formData.capacidad_volumen || ""}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Estado</Form.Label>
              <Form.Select
                name="estado"
                value={formData.estado || "mantenimiento"}
                onChange={handleFormChange}
                required
              >
                <option value="mantenimiento">En mantenimiento</option>
                <option value="disponible">Disponible</option>
                <option value="en ruta">En ruta</option>
                <option value="fuera de servicio">Fuera de servicio</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de vehículo</Form.Label>
              <Form.Select
                name="tipo_vehiculo"
                value={formData.tipo_vehiculo || "pickup"}
                onChange={handleFormChange}
                required
              >
                <option value="pickup">Pickup</option>
                <option value="tractocamion">Tractocamión</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de carga soportada</Form.Label>
              <Form.Select
                name="tipo_carga"
                value={formData.tipo_carga || "carga seca"}
                onChange={handleFormChange}
                required
              >
                <option value="carga seca">Carga seca</option>
                <option value="refrigerada">Refrigerada</option>
                <option value="plataforma">Plataforma</option>
                <option value="cama baja">Cama baja</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Conductor</Form.Label>
              <Form.Select
                name="id_usuario"
                value={formData.id_usuario || ""}
                onChange={handleFormChange}
                required
              >
                <option value="">Selecciona un conductor</option>
                {users.map((user) => (
                  <option key={user.id_usuario} value={user.id_usuario}>
                    {`${user.nombre} ${user.apaterno} ${user.amaterno}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">
              {isEditing ? "Guardar" : "Añadir vehículo"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Vehiculos;