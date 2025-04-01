import React, { useState, useEffect } from "react";
import Header from "../Header";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { format } from "date-fns";
import { Modal, Button, Form } from "react-bootstrap";

function Viajes({ setIsLoggedIn, isGoogleMapsLoaded }) {
  const [cargas, setCargas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [selectedCarga, setSelectedCarga] = useState(null);
  const [selectedViaje, setSelectedViaje] = useState(null);
  const [newCarga, setNewCarga] = useState({
    cliente: "",
    peso: "",
    volumen: "",
    descripcion: "",
    tipo_carga: "",
    fecha_entrega: "",
  });
  const [newViaje, setNewViaje] = useState({
    origen_latitud: "",
    origen_longitud: "",
    destino_latitud: "",
    destino_longitud: "",
  });
  const [origenInput, setOrigenInput] = useState("");
  const [destinoInput, setDestinoInput] = useState("");
  const [origenSelected, setOrigenSelected] = useState(false);
  const [destinoSelected, setDestinoSelected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsFormModal, setShowDetailsFormModal] = useState(false);
  const [origenAddress, setOrigenAddress] = useState("");
  const [destinoAddress, setDestinoAddress] = useState("");
  const [tripDetails, setTripDetails] = useState("");

  const tiposCarga = ["Carga seca", "Refrigerada", "Plataforma", "Cama baja"];

  useEffect(() => {
    fetchCargasSinViaje();
    fetchViajesActivos();
  }, []);

  const fetchCargasSinViaje = async () => {
    try {
      const response = await fetch("http://localhost:5000/carga/sin-viaje", {
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener cargas: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setCargas(data);
    } catch (error) {
      console.error("Error fetching cargas:", error);
      Swal.fire("Error", "No se pudieron cargar las cargas pendientes: " + error.message, "error");
    }
  };

  const formatLocalDate = (dateString) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() - 6);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours() % 12 || 12).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const fetchViajesActivos = async () => {
    try {
      const response = await fetch("http://localhost:5000/vista_viajes_activos", {
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener viajes: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const viajesAgrupados = data.reduce((acc, curr) => {
        const existingViaje = acc.find((v) => v.id_viaje === curr.id_viaje);
        const carga = {
          id_carga: curr.id_carga,
          cliente: curr.cliente,
          peso: curr.peso,
          volumen: curr.volumen,
          tipo_carga: curr.tipo_carga,
        };
        if (existingViaje) {
          existingViaje.cargas.push(carga);
        } else {
          acc.push({
            id_viaje: curr.id_viaje,
            id_vehiculo: curr.id_vehiculo,
            estado: curr.estado,
            origen_latitud: curr.origen_latitud,
            origen_longitud: curr.origen_longitud,
            destino_latitud: curr.destino_latitud,
            destino_longitud: curr.destino_longitud,
            fecha_entrega: curr.fecha_entrega,
            fecha_salida: curr.fecha_salida,
            conductor: `${curr.conductor_nombre || ""} ${curr.conductor_apaterno || ""} ${curr.conductor_amaterno || ""}`.trim() || "Sin conductor",
            detalles_viaje: curr.detalles_viaje,
            cargas: [carga],
          });
        }
        return acc;
      }, []);
      setViajes(viajesAgrupados);
    } catch (error) {
      console.error("Error fetching viajes:", error);
      Swal.fire("Error", "No se pudieron cargar los viajes activos: " + error.message, "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    setIsLoggedIn(false);
  };

  const handleCreateCarga = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/carga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCarga),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Error al crear carga");
      await response.json();
      Swal.fire("Éxito", "Carga creada correctamente", "success");
      setNewCarga({
        cliente: "",
        peso: "",
        volumen: "",
        descripcion: "",
        tipo_carga: "",
        fecha_entrega: "",
      });
      fetchCargasSinViaje();
    } catch (error) {
      console.error("Error creando carga:", error);
      Swal.fire("Error", "No se pudo crear la carga", "error");
    }
  };

  const handleAsignarViaje = async (e) => {
    e.preventDefault();
    if (!selectedCarga || !origenSelected || !destinoSelected) {
      Swal.fire("Error", "Por favor completa todos los campos requeridos", "error");
      return;
    }
    const data = {
      id_carga: selectedCarga.id_carga,
      origen_latitud: newViaje.origen_latitud,
      origen_longitud: newViaje.origen_longitud,
      destino_latitud: newViaje.destino_latitud,
      destino_longitud: newViaje.destino_longitud,
      fecha_entrega: selectedCarga.fecha_entrega,
    };
    try {
      const response = await fetch("http://localhost:5000/viaje/asignar-carga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al asignar viaje: ${errorData.message} - ${errorData.error}`);
      }
      await response.json();
      Swal.fire("Éxito", "Carga asignada a viaje correctamente", "success");
      setSelectedCarga(null);
      setOrigenInput("");
      setDestinoInput("");
      setOrigenSelected(false);
      setDestinoSelected(false);
      setNewViaje({
        origen_latitud: "",
        origen_longitud: "",
        destino_latitud: "",
        destino_longitud: "",
      });
      fetchCargasSinViaje();
      fetchViajesActivos();
    } catch (error) {
      console.error("Error asignando viaje:", error);
      Swal.fire("Error", "No se pudo asignar la carga al viaje: " + error.message, "error");
    }
  };

  const getAddressFromCoords = (lat, lng) => {
    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject("No se pudo obtener la dirección");
        }
      });
    });
  };

  const handleShowModal = async (viaje) => {
    setSelectedViaje(viaje);
    try {
      const origenAddr = await getAddressFromCoords(viaje.origen_latitud, viaje.origen_longitud);
      const destinoAddr = await getAddressFromCoords(viaje.destino_latitud, viaje.destino_longitud);
      setOrigenAddress(origenAddr);
      setDestinoAddress(destinoAddr);
    } catch (error) {
      console.error("Error al obtener direcciones:", error);
      setOrigenAddress("No disponible");
      setDestinoAddress("No disponible");
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedViaje(null);
    setOrigenAddress("");
    setDestinoAddress("");
  };

  const handleShowDetailsForm = (viaje) => {
    setSelectedViaje(viaje);
    setTripDetails(viaje.detalles_viaje || "");
    setShowDetailsFormModal(true);
  };

  const handleCloseDetailsForm = () => {
    setShowDetailsFormModal(false);
    setTripDetails("");
  };

  const handleDetailsChange = (e) => {
    setTripDetails(e.target.value);
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/viaje/${selectedViaje.id_viaje}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detalles_viaje: tripDetails }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar los detalles del viaje");
      }

      Swal.fire("Éxito", "Detalles del viaje actualizados", "success");
      fetchViajesActivos();
      handleCloseDetailsForm();
      if (showModal) {
        setSelectedViaje({ ...selectedViaje, detalles_viaje: tripDetails });
      }
    } catch (error) {
      console.error("Error al guardar detalles del viaje:", error);
      Swal.fire("Error", "Error al guardar los detalles: " + error.message, "error");
    }
  };

  if (!isGoogleMapsLoaded) {
    return <div>Cargando Google Maps...</div>;
  }

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", minHeight: "100vh" }}>
      <Header onLogout={handleLogout} />
      <div style={{ padding: "20px" }}>
        <div className="container-fluid">
          <div className="row g-3">
            {/* Lista de cargas pendientes */}
            <div className="col-lg-4">
              <div className="border rounded p-3 h-100">
                <h3>Cargas Pendientes</h3>
                {cargas.length === 0 ? (
                  <p>No hay cargas pendientes.</p>
                ) : (
                  cargas.map((carga) => (
                    <div
                      key={carga.id_carga}
                      className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom"
                      style={{ backgroundColor: "#f8f9fa", cursor: "pointer" }}
                      onClick={() => setSelectedCarga(carga)}
                    >
                      <div>
                        <p>
                          <strong>Cliente:</strong> {carga.cliente}
                          <br />
                          <strong>Peso:</strong> {carga.peso} kg
                          <br />
                          <strong>Tipo Carga:</strong> {carga.tipo_carga}
                          <br />
                          <strong>Entrega:</strong>{" "}
                          {format(new Date(carga.fecha_entrega), "dd/MM/yyyy hh:mm a")}
                        </p>
                      </div>
                      <button className="btn btn-dark">Seleccionar</button>
                    </div>
                  ))
                )}
                <h4 className="mt-3">Añadir Nueva Carga</h4>
                <form onSubmit={handleCreateCarga}>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Cliente"
                    value={newCarga.cliente}
                    onChange={(e) =>
                      setNewCarga({ ...newCarga, cliente: e.target.value })
                    }
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="form-control mb-2"
                    placeholder="Peso (kg)"
                    value={newCarga.peso}
                    onChange={(e) =>
                      setNewCarga({ ...newCarga, peso: e.target.value })
                    }
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="form-control mb-2"
                    placeholder="Volumen (m³)"
                    value={newCarga.volumen}
                    onChange={(e) =>
                      setNewCarga({ ...newCarga, volumen: e.target.value })
                    }
                    required
                  />
                  <textarea
                    className="form-control mb-2"
                    placeholder="Descripción"
                    value={newCarga.descripcion}
                    onChange={(e) =>
                      setNewCarga({ ...newCarga, descripcion: e.target.value })
                    }
                  />
                  <select
                    className="form-control mb-2"
                    value={newCarga.tipo_carga}
                    onChange={(e) =>
                      setNewCarga({ ...newCarga, tipo_carga: e.target.value })
                    }
                    required
                  >
                    <option value="">Selecciona el tipo de carga</option>
                    {tiposCarga.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    className="form-control mb-2"
                    value={newCarga.fecha_entrega}
                    onChange={(e) =>
                      setNewCarga({ ...newCarga, fecha_entrega: e.target.value })
                    }
                    required
                  />
                  <button type="submit" className="btn btn-success w-100">
                    Añadir Carga
                  </button>
                </form>
              </div>
            </div>

            {/* Asignar Viaje */}
            <div className="col-lg-4">
              <div className="border rounded p-3 h-100">
                <h3>Asignar Viaje</h3>
                {selectedCarga ? (
                  <form onSubmit={handleAsignarViaje}>
                    <p>
                      <strong>Carga Seleccionada:</strong> {selectedCarga.cliente} -{" "}
                      {selectedCarga.peso} kg - {selectedCarga.tipo_carga}
                    </p>
                    <div className="mb-2">
                      <label htmlFor="origen" className="form-label">
                        Origen:
                      </label>
                      <Autocomplete
                        onLoad={(autocomplete) => {
                          autocomplete.addListener("place_changed", () => {
                            const place = autocomplete.getPlace();
                            if (!place.geometry) {
                              Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: "Selecciona un lugar válido para el origen.",
                              });
                              setOrigenSelected(false);
                              return;
                            }
                            const coords = {
                              lat: place.geometry.location.lat(),
                              lng: place.geometry.location.lng(),
                            };
                            setNewViaje((prev) => ({
                              ...prev,
                              origen_latitud: coords.lat,
                              origen_longitud: coords.lng,
                            }));
                            setOrigenInput(place.formatted_address);
                            setOrigenSelected(true);
                          });
                        }}
                      >
                        <input
                          type="text"
                          id="origen"
                          className="form-control"
                          placeholder="Busca el origen"
                          value={origenInput}
                          onChange={(e) => {
                            setOrigenInput(e.target.value);
                            setOrigenSelected(false);
                          }}
                          required
                        />
                      </Autocomplete>
                    </div>
                    <div className="mb-2">
                      <label htmlFor="destino" className="form-label">
                        Destino:
                      </label>
                      <Autocomplete
                        onLoad={(autocomplete) => {
                          autocomplete.addListener("place_changed", () => {
                            const place = autocomplete.getPlace();
                            if (!place.geometry) {
                              Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: "Selecciona un lugar válido para el destino.",
                              });
                              setDestinoSelected(false);
                              return;
                            }
                            const coords = {
                              lat: place.geometry.location.lat(),
                              lng: place.geometry.location.lng(),
                            };
                            setNewViaje((prev) => ({
                              ...prev,
                              destino_latitud: coords.lat,
                              destino_longitud: coords.lng,
                            }));
                            setDestinoInput(place.formatted_address);
                            setDestinoSelected(true);
                          });
                        }}
                      >
                        <input
                          type="text"
                          id="destino"
                          className="form-control"
                          placeholder="Busca el destino"
                          value={destinoInput}
                          onChange={(e) => {
                            setDestinoInput(e.target.value);
                            setDestinoSelected(false);
                          }}
                          required
                        />
                      </Autocomplete>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-success w-100"
                      disabled={!origenSelected || !destinoSelected}
                    >
                      Asignar Viaje
                    </button>
                  </form>
                ) : (
                  <p>Selecciona una carga para asignar un viaje.</p>
                )}
              </div>
            </div>
            {/* Lista de Viajes */}
            <div className="col-lg-4">
              <div className="border rounded p-3 h-100">
                <h3>Viajes Actuales</h3>
                {viajes.length === 0 ? (
                  <p>No hay viajes actuales.</p>
                ) : (
                  viajes.map((viaje) => (
                    <div
                      key={viaje.id_viaje}
                      className="d-flex align-items-center mb-2 p-2 border-bottom"
                      style={{ backgroundColor: "#f8f9fa", cursor: "pointer" }}
                    >
                      <div className="flex-grow-1">
                        <p>
                          <strong>ID Viaje:</strong> {viaje.id_viaje}
                          <br />
                          <strong>Estado:</strong> {viaje.estado}
                          <br />
                          <strong>Conductor:</strong> {viaje.conductor}
                          <br />
                          <strong>Cliente(s):</strong>{" "}
                          {viaje.cargas.map((c) => c.cliente).join(", ") || "N/A"}
                          <br />
                        </p>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            padding: "4px 10px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowModal(viaje);
                          }}
                        >
                          Ver más
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          style={{
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            padding: "4px 10px",
                            backgroundColor: "#007bff",
                            borderColor: "#007bff",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowDetailsForm(viaje);
                          }}
                        >
                          Agregar detalles
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para detalles del viaje */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Viaje</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedViaje && (
            <div>
              <p>
                <strong>ID Viaje:</strong> {selectedViaje.id_viaje}
                <br />
                <strong>Vehículo:</strong>{" "}
                {selectedViaje.id_vehiculo || "No asignado"}
                <br />
                <strong>Conductor:</strong> {selectedViaje.conductor}
                <br />
                <strong>Estado:</strong> {selectedViaje.estado}
                <br />
                <strong>Origen:</strong> {origenAddress || "Cargando..."}
                <br />
                <strong>Destino:</strong> {destinoAddress || "Cargando..."}
                <br />
                <strong>Fecha Entrega:</strong>{" "}
                {formatLocalDate(selectedViaje.fecha_entrega)}
                <br />
                <strong>Fecha Salida:</strong>{" "}
                {selectedViaje.fecha_salida
                  ? formatLocalDate(selectedViaje.fecha_salida)
                  : "No iniciada"}
                <br />
                <strong>Detalles del Viaje:</strong>{" "}
                {selectedViaje.detalles_viaje || "Sin detalles"}
                <br />
                <strong>Cargas:</strong>
                <ul>
                  {selectedViaje.cargas.map((carga, index) => (
                    <li key={index}>
                      {carga.cliente} - {carga.peso} kg - {carga.volumen} m³ -{" "}
                      {carga.tipo_carga}
                    </li>
                  ))}
                </ul>
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={() => handleShowDetailsForm(selectedViaje)}
          >
            Editar Detalles
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para agregar/editar detalles */}
      <Modal show={showDetailsFormModal} onHide={handleCloseDetailsForm}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar/Editar Detalles del Viaje</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleDetailsSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Detalles del Viaje</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={tripDetails}
                onChange={handleDetailsChange}
                placeholder="Ingresa los detalles del viaje (opcional)"
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Guardar Detalles
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Viajes;