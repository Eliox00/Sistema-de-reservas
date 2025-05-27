// src/components/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Button, Table, Badge, Alert, Spinner, 
  Modal, Tab, Tabs 
} from 'react-bootstrap';
import { salasService, reservasService } from '../services/firebaseService';
import SalaForm from './SalaForm';

function AdminPanel() {
  const [salas, setSalas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [salaEditando, setSalaEditando] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salaAEliminar, setSalaAEliminar] = useState(null);
  const [activeTab, setActiveTab] = useState('salas');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Cargando datos del panel de administración...');
      
      const [salasData, reservasData] = await Promise.all([
        salasService.obtenerTodas(),
        reservasService.obtenerTodas()
      ]);
      
      console.log('📋 Datos cargados:', {
        salas: salasData.length,
        reservas: reservasData.length
      });
      
      setSalas(Array.isArray(salasData) ? salasData : []);
      setReservas(Array.isArray(reservasData) ? reservasData : []);
      
    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
      setError('Error al cargar los datos: ' + err.message);
      setSalas([]);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSala = () => {
    setSalaEditando(null);
    setShowModal(true);
  };

  const handleEditarSala = (sala) => {
    setSalaEditando(sala);
    setShowModal(true);
  };

  const handleEliminarSala = (sala) => {
    setSalaAEliminar(sala);
    setShowDeleteModal(true);
  };

  const confirmarEliminar = async () => {
    try {
      console.log('🗑️ Eliminando sala:', salaAEliminar.nombre);
      await salasService.eliminar(salaAEliminar.id);
      setShowDeleteModal(false);
      setSalaAEliminar(null);
      cargarDatos();
      console.log('✅ Sala eliminada exitosamente');
    } catch (err) {
      console.error('❌ Error al eliminar sala:', err);
      setError('Error al eliminar la sala: ' + err.message);
    }
  };

  const handleGuardarSala = () => {
    setShowModal(false);
    setSalaEditando(null);
    cargarDatos();
  };

  const finalizarReserva = async (reserva) => {
    try {
      console.log('🏁 Finalizando reserva:', reserva.id);
      await reservasService.finalizar(reserva.id);
      cargarDatos();
      console.log('✅ Reserva finalizada exitosamente');
    } catch (err) {
      console.error('❌ Error al finalizar reserva:', err);
      setError('Error al finalizar la reserva: ' + err.message);
    }
  };

  const toggleEstadoSala = async (sala) => {
    try {
      const nuevoEstado = !sala.activa;
      console.log(`🔄 Cambiando estado de sala ${sala.nombre} a:`, nuevoEstado ? 'activa' : 'inactiva');
      
      await salasService.actualizar(sala.id, { activa: nuevoEstado });
      cargarDatos();
      
      console.log('✅ Estado de sala actualizado exitosamente');
    } catch (err) {
      console.error('❌ Error al cambiar estado de sala:', err);
      setError('Error al cambiar el estado de la sala: ' + err.message);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    
    // Si es un timestamp de Firebase
    if (fecha.seconds) {
      return new Date(fecha.seconds * 1000).toLocaleString('es-ES');
    }
    
    // Si es una fecha ISO string
    if (typeof fecha === 'string') {
      return new Date(fecha).toLocaleString('es-ES');
    }
    
    // Si es un objeto Date
    return new Date(fecha).toLocaleString('es-ES');
  };

  const obtenerEstadoSala = (sala) => {
    // Verificar si la sala está activa
    if (sala.activa === false) {
      return { texto: 'Inactiva', variant: 'secondary', ocupada: false };
    }

    // Verificar si tiene reservas activas
    const ahora = new Date();
    const tieneReservaActiva = reservas.some(reserva => {
      if (reserva.idSala !== sala.id || reserva.estado !== 'activa') {
        return false;
      }
      
      const inicioReserva = new Date(reserva.fechaInicio);
      const finReserva = new Date(reserva.fechaFin);
      
      return inicioReserva <= ahora && finReserva >= ahora;
    });

    if (tieneReservaActiva) {
      return { texto: 'Ocupada', variant: 'danger', ocupada: true };
    }

    return { texto: 'Disponible', variant: 'success', ocupada: false };
  };

  const getEstadisticas = () => {
    const totalSalas = salas.length;
    const salasActivas = salas.filter(s => s.activa !== false).length;
    const salasInactivas = totalSalas - salasActivas;
    
    // Calcular ocupadas (salas activas con reservas en curso)
    const ahora = new Date();
    const salasOcupadas = salas.filter(sala => {
      if (sala.activa === false) return false;
      
      return reservas.some(reserva => {
        if (reserva.idSala !== sala.id || reserva.estado !== 'activa') {
          return false;
        }
        
        const inicioReserva = new Date(reserva.fechaInicio);
        const finReserva = new Date(reserva.fechaFin);
        
        return inicioReserva <= ahora && finReserva >= ahora;
      });
    }).length;
    
    const salasDisponibles = salasActivas - salasOcupadas;
    const reservasActivas = reservas.filter(r => r.estado === 'activa').length;
    const reservasFinalizadas = reservas.filter(r => r.estado === 'finalizada').length;

    return {
      totalSalas,
      salasActivas,
      salasInactivas,
      salasDisponibles,
      salasOcupadas,
      reservasActivas,
      reservasFinalizadas,
      totalReservas: reservas.length
    };
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando panel de administración...</p>
      </div>
    );
  }

  const stats = getEstadisticas();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏛️ Panel de Administración</h2>
        <Button variant="primary" onClick={handleCrearSala}>
          ➕ Nueva Instalación
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center border-primary">
            <Card.Body>
              <Card.Title className="h4 text-primary">{stats.totalSalas}</Card.Title>
              <Card.Text className="small">Total Instalaciones</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center border-success">
            <Card.Body>
              <Card.Title className="h4 text-success">{stats.salasDisponibles}</Card.Title>
              <Card.Text className="small">Disponibles</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center border-danger">
            <Card.Body>
              <Card.Title className="h4 text-danger">{stats.salasOcupadas}</Card.Title>
              <Card.Text className="small">Ocupadas</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center border-warning">
            <Card.Body>
              <Card.Title className="h4 text-warning">{stats.reservasActivas}</Card.Title>
              <Card.Text className="small">Reservas Activas</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center border-info">
            <Card.Body>
              <Card.Title className="h4 text-info">{stats.reservasFinalizadas}</Card.Title>
              <Card.Text className="small">Finalizadas</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center border-secondary">
            <Card.Body>
              <Card.Title className="h4 text-secondary">{stats.totalReservas}</Card.Title>
              <Card.Text className="small">Total Reservas</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="salas" title="🏟️ Gestión de Instalaciones">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Instalaciones Deportivas</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {salas.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No hay instalaciones registradas</p>
                  <Button variant="primary" onClick={handleCrearSala}>
                    Crear Primera Instalación
                  </Button>
                </div>
              ) : (
                <Table responsive hover>
                  <thead className="table-light">
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Ubicación</th>
                      <th>Capacidad</th>
                      <th>Estado</th>
                      <th>Equipamiento</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salas.map((sala) => {
                      const estadoSala = obtenerEstadoSala(sala);
                      return (
                        <tr key={sala.id}>
                          <td>
                            <strong>{sala.nombre}</strong>
                          </td>
                          <td>
                            <span className="text-muted">
                              {sala.descripcion || 'Sin descripción'}
                            </span>
                          </td>
                          <td>{sala.ubicacion || 'No especificada'}</td>
                          <td>{sala.capacidad || 'N/A'} personas</td>
                          <td>
                            <Badge bg={estadoSala.variant}>
                              {estadoSala.texto}
                            </Badge>
                          </td>
                          <td>
                            {sala.equipamiento && sala.equipamiento.length > 0 ? (
                              <div>
                                {sala.equipamiento.slice(0, 2).map((equipo, idx) => (
                                  <Badge key={idx} bg="light" text="dark" className="me-1 mb-1">
                                    {equipo}
                                  </Badge>
                                ))}
                                {sala.equipamiento.length > 2 && (
                                  <Badge bg="secondary">+{sala.equipamiento.length - 2}</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">Sin equipamiento</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditarSala(sala)}
                                title="Editar instalación"
                              >
                                ✏️
                              </Button>
                              <Button
                                variant={sala.activa === false ? "outline-success" : "outline-warning"}
                                size="sm"
                                onClick={() => toggleEstadoSala(sala)}
                                title={sala.activa === false ? "Activar" : "Desactivar"}
                              >
                                {sala.activa === false ? "🟢" : "⏸️"}
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleEliminarSala(sala)}
                                title="Eliminar instalación"
                              >
                                🗑️
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="reservas" title="📅 Gestión de Reservas">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Historial de Reservas</h5>
              <Button variant="outline-primary" size="sm" onClick={cargarDatos}>
                🔄 Actualizar
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {reservas.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No hay reservas registradas</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead className="table-light">
                    <tr>
                      <th>Usuario</th>
                      <th>Instalación</th>
                      <th>Fecha</th>
                      <th>Horario</th>
                      <th>Estado</th>
                      <th>Creada</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas
                      .sort((a, b) => {
                        // Ordenar por fecha de creación, más recientes primero
                        const fechaA = a.fechaCreacion?.seconds || new Date(a.fechaCreacion || 0).getTime() / 1000;
                        const fechaB = b.fechaCreacion?.seconds || new Date(b.fechaCreacion || 0).getTime() / 1000;
                        return fechaB - fechaA;
                      })
                      .map((reserva) => (
                        <tr key={reserva.id}>
                          <td>
                            <div>
                              <strong>{reserva.usuario}</strong>
                              <div className="small text-muted">
                                {reserva.usuarioEmail}
                              </div>
                            </div>
                          </td>
                          <td>{reserva.nombreSala}</td>
                          <td>{reserva.fechaReserva}</td>
                          <td>
                            <strong>{reserva.horaInicio} - {reserva.horaFin}</strong>
                          </td>
                          <td>
                            <Badge bg={reserva.estado === 'activa' ? 'warning' : 'success'}>
                              {reserva.estado === 'activa' ? 'Activa' : 'Finalizada'}
                            </Badge>
                          </td>
                          <td className="small text-muted">
                            {formatearFecha(reserva.fechaCreacion)}
                          </td>
                          <td>
                            {reserva.estado === 'activa' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => finalizarReserva(reserva)}
                                title="Finalizar reserva"
                              >
                                ✅ Finalizar
                              </Button>
                            )}
                            {reserva.estado === 'finalizada' && (
                              <Badge bg="light" text="dark">
                                Completada
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal para crear/editar sala */}
      <SalaForm
        show={showModal}
        onHide={() => setShowModal(false)}
        sala={salaEditando}
        onGuardar={handleGuardarSala}
      />

      {/* Modal de confirmación para eliminar */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <p>¿Estás seguro de que deseas eliminar la instalación <strong>"{salaAEliminar?.nombre}"</strong>?</p>
            <hr />
            <div className="small">
              <strong>⚠️ Esta acción:</strong>
              <ul className="mb-0">
                <li>Eliminará permanentemente la instalación</li>
                <li>No afectará las reservas existentes</li>
                <li>No se puede deshacer</li>
              </ul>
            </div>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmarEliminar}>
            🗑️ Eliminar Permanentemente
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminPanel;