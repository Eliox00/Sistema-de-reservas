// src/components/SalasList.jsx
import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, InputGroup, Badge, Alert, Spinner } from 'react-bootstrap';
import { salasService, reservasService } from '../services/firebaseService';
import ReservaModal from './ReservaModal';

function SalasList({ user }) {
  const [salas, setSalas] = useState([]);
  const [salasOriginal, setSalasOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [reservas, setReservas] = useState([]);

  // Cargar salas y reservas al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Aplicar filtros cuando cambien los valores de búsqueda
  useEffect(() => {
    aplicarFiltros();
  }, [busqueda, filtroDisponibilidad, salasOriginal, reservas]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Iniciando carga de datos...');
      
      const [salasData, reservasData] = await Promise.all([
        salasService.obtenerTodas(),
        reservasService.obtenerTodas()
      ]);
      
      console.log('📋 Salas obtenidas:', salasData.length);
      console.log('📅 Reservas obtenidas:', reservasData.length);
      
      // Verificar que salasData sea un array
      if (!Array.isArray(salasData)) {
        console.error('❌ salasData no es un array:', salasData);
        throw new Error('Los datos de salas no tienen el formato esperado');
      }
      
      setSalasOriginal(salasData);
      setReservas(Array.isArray(reservasData) ? reservasData : []);
      
      console.log('✅ Datos cargados correctamente');
      
    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
      setError(`Error al cargar las salas: ${err.message || 'Error desconocido'}`);
      setSalasOriginal([]);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    console.log('🔍 Aplicando filtros...');
    console.log('- Salas originales:', salasOriginal.length);
    console.log('- Término de búsqueda:', busqueda);
    console.log('- Filtro disponibilidad:', filtroDisponibilidad);
    
    let salasFiltradas = [...salasOriginal];

    // Filtro por búsqueda (nombre o descripción)
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase().trim();
      salasFiltradas = salasFiltradas.filter(sala => {
        const coincideNombre = sala.nombre && sala.nombre.toLowerCase().includes(termino);
        const coincideDescripcion = sala.descripcion && sala.descripcion.toLowerCase().includes(termino);
        return coincideNombre || coincideDescripcion;
      });
      console.log('- Después del filtro de búsqueda:', salasFiltradas.length);
    }

    // Filtro por disponibilidad
    if (filtroDisponibilidad !== 'todas') {
      const ahora = new Date();
      console.log('- Aplicando filtro de disponibilidad para:', ahora.toISOString());
      
      salasFiltradas = salasFiltradas.filter(sala => {
        if (!sala.id) {
          console.warn('⚠️ Sala sin ID:', sala);
          return false;
        }
        
        const tieneReservaActiva = reservas.some(reserva => {
          // Usar los campos unificados
          const salaId = reserva.idSala;
          const fechaInicio = reserva.fechaInicio;
          const fechaFin = reserva.fechaFin;
          const estado = reserva.estado;
          
          if (!salaId || !fechaInicio || !fechaFin || !estado) {
            console.warn('⚠️ Reserva con datos incompletos:', reserva);
            return false;
          }
          
          const inicioReserva = new Date(fechaInicio);
          const finReserva = new Date(fechaFin);
          
          const esEstadoActivo = estado === 'activa';
          const coincideSala = salaId === sala.id;
          const estaEnRango = inicioReserva <= ahora && finReserva >= ahora;
          
          const resultado = coincideSala && esEstadoActivo && estaEnRango;
          
          if (resultado) {
            console.log('🔒 Sala ocupada encontrada:', {
              salaId,
              nombreSala: sala.nombre,
              inicio: inicioReserva.toISOString(),
              fin: finReserva.toISOString(),
              ahora: ahora.toISOString()
            });
          }
          
          return resultado;
        });

        // CORREGIDO: Usar activa en lugar de disponibilidad
        const estaDisponible = !tieneReservaActiva && sala.activa !== false;
        
        if (filtroDisponibilidad === 'disponibles') {
          return estaDisponible;
        } else if (filtroDisponibilidad === 'ocupadas') {
          return tieneReservaActiva;
        }
        
        return true;
      });
      
      console.log('- Después del filtro de disponibilidad:', salasFiltradas.length);
    }

    console.log('🎯 Salas finales a mostrar:', salasFiltradas.length);
    setSalas(salasFiltradas);
  };

  const obtenerEstadoSala = (sala) => {
    if (sala.activa === false) {
      return { estado: 'inactiva', texto: 'Inactiva', variant: 'secondary' };
    }

    const ahora = new Date();
    const reservaActiva = reservas.find(reserva => {
      // Usar los campos unificados
      const salaId = reserva.idSala;
      const fechaInicio = reserva.fechaInicio;
      const fechaFin = reserva.fechaFin;
      const estado = reserva.estado;
      
      if (!salaId || !fechaInicio || !fechaFin || !estado) {
        return false;
      }
      
      const inicioReserva = new Date(fechaInicio);
      const finReserva = new Date(fechaFin);
      
      const esEstadoActivo = estado === 'activa';
      
      return salaId === sala.id && 
             esEstadoActivo &&
             inicioReserva <= ahora && 
             finReserva >= ahora;
    });

    if (reservaActiva) {
      return { 
        estado: 'ocupada', 
        texto: 'Ocupada', 
        variant: 'danger',
        reserva: reservaActiva
      };
    }

    return { estado: 'disponible', texto: 'Disponible', variant: 'success' };
  };

  const abrirModal = (sala) => {
    setSalaSeleccionada(sala);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setSalaSeleccionada(null);
  };

  const handleReservaCreada = () => {
    console.log('🔄 Reserva creada, recargando datos...');
    cerrarModal();
    // Pequeño delay para asegurar que los datos se hayan guardado
    setTimeout(() => {
      cargarDatos();
    }, 500);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-3">Cargando salas...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Debug info - Remover en producción */}
      {process.env.NODE_ENV === 'development' && (
        <Alert variant="info" className="mb-3">
          <small>
            <strong>Debug:</strong> 
            Salas originales: {salasOriginal.length} | 
            Salas filtradas: {salas.length} | 
            Reservas: {reservas.length} |
            Reservas activas: {reservas.filter(r => r.estado === 'activa').length}
          </small>
        </Alert>
      )}

      {/* Filtros y búsqueda */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Buscar salas por nombre o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={filtroDisponibilidad}
            onChange={(e) => setFiltroDisponibilidad(e.target.value)}
          >
            <option value="todas">Todas las salas</option>
            <option value="disponibles">Solo disponibles</option>
            <option value="ocupadas">Solo ocupadas</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button variant="outline-primary" onClick={cargarDatos} className="w-100">
            Actualizar
          </Button>
        </Col>
      </Row>

      {/* Mensajes de error */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Lista de salas */}
      {salas.length === 0 ? (
        <Alert variant="info">
          {salasOriginal.length === 0 
            ? 'No hay salas registradas en el sistema.'
            : 'No se encontraron salas que coincidan con los filtros aplicados.'
          }
        </Alert>
      ) : (
        <Row>
          {salas.map((sala) => {
            const estadoSala = obtenerEstadoSala(sala);
            return (
              <Col md={6} lg={4} key={sala.id} className="mb-4">
                <Card className="h-100">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">{sala.nombre || 'Sala sin nombre'}</h6>
                    <Badge bg={estadoSala.variant}>
                      {estadoSala.texto}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    {sala.descripcion && (
                      <Card.Text className="text-muted small">
                        {sala.descripcion}
                      </Card.Text>
                    )}
                    
                    <div className="mb-3">
                      <small className="text-muted">
                        <strong>Capacidad:</strong> {sala.capacidad || 'No especificada'} personas
                      </small>
                    </div>

                    {/* Mostrar información de reserva activa */}
                    {estadoSala.estado === 'ocupada' && estadoSala.reserva && (
                      <div className="mb-3 p-2 bg-danger bg-opacity-10 rounded">
                        <small className="text-danger">
                          <strong>Ocupada por:</strong> {estadoSala.reserva.usuario}<br />
                          <strong>Hasta:</strong> {new Date(estadoSala.reserva.fechaFin).toLocaleString()}
                        </small>
                      </div>
                    )}

                    {sala.equipamiento && sala.equipamiento.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">
                          <strong>Equipamiento:</strong>
                        </small>
                        <div>
                          {sala.equipamiento.map((equipo, index) => (
                            <Badge 
                              key={index} 
                              bg="light" 
                              text="dark" 
                              className="me-1 mb-1"
                            >
                              {equipo}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card.Body>
                  <Card.Footer>
                    <Button
                      variant={estadoSala.estado === 'disponible' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => abrirModal(sala)}
                      disabled={sala.activa === false || !user}
                      className="w-100"
                    >
                      {!user 
                        ? 'Inicia sesión para reservar'
                        : estadoSala.estado === 'disponible' 
                          ? 'Reservar sala'
                          : estadoSala.estado === 'ocupada'
                            ? 'Ver detalles (Ocupada)'
                            : 'Ver detalles'
                      }
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Modal de reserva */}
      {showModal && salaSeleccionada && (
        <ReservaModal
          show={showModal}
          onHide={cerrarModal}
          sala={salaSeleccionada}
          user={user}
          onReservaExitosa={handleReservaCreada}
          reservaExistente={obtenerEstadoSala(salaSeleccionada).reserva}
        />
      )}
    </div>
  );
}

export default SalasList;