import React, { useState, useEffect, useCallback } from "react";
import Header from "../Header";
import "bootstrap/dist/css/bootstrap.min.css";
import { GoogleMap, Marker } from "@react-google-maps/api"; // Sin LoadScript
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTools, faTruck, faBox, faBan } from "@fortawesome/free-solid-svg-icons";

function Vehiculos({ setIsLoggedIn, isGoogleMapsLoaded }) {
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
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []); // Solo cargamos los vehículos al inicio
  
  useEffect(() => {
    fetchUsers(); // Esto se ejecutará cada vez que vehicles cambie
  }, [vehicles]); // Agregamos vehicles como dependencia

  const fetchVehicles = async () => {
    try {
      const response = await fetch("http://localhost:5000/vehiculo/active");
      const data = await response.json();
      const vehiclesWithPositions = data.map((vehicle) => {
        const randomLatOffset = (Math.random() - 0.5) * 0.02;
        const randomLngOffset = (Math.random() - 0.5) * 0.02;
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
      // Filtrar usuarios: solo conductores y que no tengan un vehículo asignado
      const availableConductors = data.filter(user => {
        // Solo usuarios con tipo_usuario = 'conductor'
        if (user.tipo_usuario !== 'conductor') return false;
        // Excluir conductores que ya tienen un vehículo asignado
        return !vehicles.some(vehicle => vehicle.id_usuario === user.id_usuario && vehicle.estatus === 1);
      });
      setUsers(availableConductors);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  const mapContainerStyle = { width: "100%", height: "480px" };
  const center = { lat: 20.6539, lng: -100.4351 };

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
      setFormData({ ...vehicle });
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
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsedFormData = {
        ...formData,
        capacidad_peso_max: parseFloat(formData.capacidad_peso_max),
        capacidad_volumen: parseFloat(formData.capacidad_volumen),
        id_usuario: parseInt(formData.id_usuario) || null,
      };

      const url = isEditing
        ? `http://localhost:5000/vehiculo/${formData.matricula}`
        : "http://localhost:5000/vehiculo";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedFormData),
      });

      if (!response.ok) throw new Error("Error al guardar el vehículo");
      fetchVehicles();
      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      alert("Error al guardar el vehículo.");
    }
  };

  const handleDeleteVehicle = async (matricula) => {
    if (window.confirm("¿Estás seguro de dar de baja este vehículo?")) {
      try {
        const response = await fetch(`http://localhost:5000/vehiculo/${matricula}/delete`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Error al eliminar el vehículo");
        fetchVehicles();
        handleCloseDetails();
      } catch (error) {
        console.error("Error al eliminar vehículo:", error);
        alert("Error al eliminar el vehículo.");
      }
    }
  };

  const getUserName = (id_usuario) => {
    const user = users.find((u) => u.id_usuario === id_usuario);
    return user ? `${user.nombre} ${user.apaterno} ${user.amaterno}` : "Desconocido";
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case "mantenimiento": return <FontAwesomeIcon icon={faTools} title="En mantenimiento" style={{ color: "orange" }} />;
      case "disponible": return <FontAwesomeIcon icon={faTruck} title="Disponible" style={{ color: "green" }} />;
      case "en ruta": return <FontAwesomeIcon icon={faBox} title="En ruta" style={{ color: "blue" }} />;
      case "fuera de servicio": return <FontAwesomeIcon icon={faBan} title="Fuera de servicio" style={{ color: "red" }} />;
      default: return null;
    }
  };

  const getAddress = async (lat, lng) => {
    if (!isGoogleMapsLoaded) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyC7IIRa4kxYY3Yiq1PD64XHDt1fl_f_kDc"}`
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
      <div style={{ padding: "20px", flex: 1 }}>
        <div className="container-fluid">
          <div className="row g-3">
          <div className="col-lg-4">
            <div className="border rounded p-3" style={{ maxHeight: "560px", overflowY: "auto" }}>
              <h3>Mis vehículos</h3>
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
                      <strong>Matrícula:</strong> {vehicle.matricula}<br />
                      <strong>Tipo de vehículo:</strong> {vehicle.tipo_vehiculo}<br />
                      <strong>Conductor:</strong> {getUserName(vehicle.id_usuario)}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {getStatusIcon(vehicle.estado)}
                    <button className="btn btn-dark ms-2">Ver más</button>
                  </div>
                </div>
              ))}
              <button className="btn btn-success mt-3 w-100" onClick={() => handleShowForm()}>
                Añadir vehículo
              </button>
            </div>
          </div>
            <div className="col-lg-8">
              <div className="border rounded p-3">
                <h3>Mapa de Vehículos</h3>
                {isGoogleMapsLoaded ? (
                  <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={14}>
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
                {address && <p>Ubicación: {address}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales permanecen iguales */}
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
              <p><strong>Peso Disponible:</strong> {selectedVehicle.peso_disponible || "N/A"} kg</p>
              <p><strong>Capacidad (Volumen):</strong> {selectedVehicle.capacidad_volumen} m³</p>
              <p><strong>Estado:</strong> {selectedVehicle.estado}</p>
              <p><strong>Tipo de vehículo:</strong> {selectedVehicle.tipo_vehiculo}</p>
              <p><strong>Tipo de carga soportada:</strong> {selectedVehicle.tipo_carga}</p>
              <p><strong>Conductor:</strong> {getUserName(selectedVehicle.id_usuario)}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetails}>Cerrar</Button>
          <Button variant="primary" onClick={() => handleShowForm(selectedVehicle)}>Editar</Button>
          <Button variant="danger" onClick={() => handleDeleteVehicle(selectedVehicle.matricula)}>Eliminar</Button>
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
                value={formData.matricula}
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
                value={formData.marca}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Modelo</Form.Label>
              <Form.Control
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Capacidad (Peso en kg)</Form.Label>
              <Form.Control
                type="number"
                name="capacidad_peso_max"
                value={formData.capacidad_peso_max}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Capacidad (Volumen en m³)</Form.Label>
              <Form.Control
                type="number"
                name="capacidad_volumen"
                value={formData.capacidad_volumen}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Estado</Form.Label>
              <Form.Select name="estado" value={formData.estado} onChange={handleFormChange}>
                <option value="mantenimiento">En mantenimiento</option>
                <option value="disponible">Disponible</option>
                <option value="en ruta">En ruta</option>
                <option value="fuera de servicio">Fuera de servicio</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de vehículo</Form.Label>
              <Form.Select name="tipo_vehiculo" value={formData.tipo_vehiculo} onChange={handleFormChange}>
                <option value="pickup">Pickup</option>
                <option value="tractocamion">Tractocamión</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de carga soportada</Form.Label>
              <Form.Select name="tipo_carga" value={formData.tipo_carga} onChange={handleFormChange}>
                <option value="carga seca">Carga seca</option>
                <option value="refrigerada">Refrigerada</option>
                <option value="plataforma">Plataforma</option>
                <option value="cama baja">Cama baja</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Conductor</Form.Label>
              <Form.Select name="id_usuario" value={formData.id_usuario} onChange={handleFormChange}>
                <option value="">Selecciona un conductor</option>
                {users.map((user) => (
                  <option key={user.id_usuario} value={user.id_usuario}>
                    {`${user.nombre} ${user.apaterno} ${user.amaterno}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">{isEditing ? "Guardar" : "Añadir vehículo"}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Vehiculos;