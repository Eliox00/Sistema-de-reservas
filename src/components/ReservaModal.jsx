// src/components/ReservaModal.jsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { reservasService } from '../services/firebaseService';

function ReservaModal({ show, onHide, sala, onReservaExitosa, user, reservaExistente }) {
  const [formData, setFormData] = useState({
    fechaReserva: '',
    horaInicio: '',
    horaFin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificandoConflicto, setVerificandoConflicto] = useState(false);

  useEffect(() => {
    if (show) {
      // Limpiar formulario cuando se abre el modal
      setFormData({
        fechaReserva: '',
        horaInicio: '',
        horaFin: ''
      });
      setError('');
    }
  }, [show]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const crearFechaCompleta = (fecha, hora) => {
    return new Date(`${fecha}T${hora}:00`);
  };

  const verificarDisponibilidad = async (fechaInicio, fechaFin) => {
    try {
      setVerificandoConflicto(true);
      const hayConflicto = await reservasService.verificarConflicto(
        sala.id, 
        fechaInicio.toISOString(), 
        fechaFin.toISOString()
      );
      
      if (hayConflicto) {
        setError('⚠️ Ya existe una reserva activa en este horario para esta sala. Por favor, selecciona otro horario.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      setError('Error al verificar la disponibilidad. Inténtalo nuevamente.');
      return false;
    } finally {
      setVerificandoConflicto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fechaReserva || !formData.horaInicio || !formData.horaFin) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (formData.horaInicio >= formData.horaFin) {
      setError('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // Validar que la fecha no sea en el pasado
    const fechaSeleccionada = new Date(formData.fechaReserva);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < hoy) {
      setError('No puedes reservar en fechas pasadas');
      return;
    }

    // Validar que no sea una fecha muy futura (más de 30 días)
    const fechaMaxima = new Date();
    fechaMaxima.setDate(fechaMaxima.getDate() + 30);
    fechaMaxima.setHours(23, 59, 59, 999);
    
    if (fechaSeleccionada > fechaMaxima) {
      setError('No puedes reservar con más de 30 días de anticipación');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Crear fechas completas con hora
      const fechaInicio = crearFechaCompleta(formData.fechaReserva, formData.horaInicio);
      const fechaFin = crearFechaCompleta(formData.fechaReserva, formData.horaFin);

      console.log('🔍 Verificando disponibilidad:', {
        idSala: sala.id,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString()
      });

      // Verificar disponibilidad antes de crear la reserva
      const estaDisponible = await verificarDisponibilidad(fechaInicio, fechaFin);
      
      if (!estaDisponible) {
        return; // El error ya se setea en verificarDisponibilidad
      }

      console.log('✅ Horario disponible, creando reserva...');

      const reservaData = {
        idSala: sala.id,
        nombreSala: sala.nombre,
        usuario: user.nombre || user.displayName || user.email,
        usuarioId: user.uid,
        usuarioEmail: user.email,
        fechaReserva: formData.fechaReserva,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        // Campos unificados para búsquedas y comparaciones
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        estado: 'activa'
      };

      await reservasService.crear(reservaData);
      
      console.log('✅ Reserva creada exitosamente');
      
      // Limpiar formulario
      setFormData({
        fechaReserva: '',
        horaInicio: '',
        horaFin: ''
      });

      // Notificar al componente padre
      if (onReservaExitosa) {
        onReservaExitosa();
      }
      
    } catch (err) {
      console.error('❌ Error al crear reserva:', err);
      setError('Error al crear la reserva: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fechaReserva: '',
      horaInicio: '',
      horaFin: ''
    });
    setError('');
    onHide();
  };

  // Obtener fecha mínima (hoy)
  const getFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  // Obtener fecha máxima (30 días desde hoy)
  const getFechaMaxima = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 30);
    return fecha.toISOString().split('T')[0];
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {reservaExistente ? `Detalles - ${sala?.nombre}` : `Reservar ${sala?.nombre}`}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Mostrar información de reserva existente si la sala está ocupada */}
        {reservaExistente && (
          <Alert variant="warning" className="mb-3">
            <h6 className="text-warning mb-2">🔒 Sala Actualmente Ocupada</h6>
            <p className="mb-1"><strong>Reservada por:</strong> {reservaExistente.usuario}</p>
            <p className="mb-1"><strong>Fecha:</strong> {reservaExistente.fechaReserva}</p>
            <p className="mb-1"><strong>Horario:</strong> {reservaExistente.horaInicio} - {reservaExistente.horaFin}</p>
            <p className="mb-0"><strong>Termina:</strong> {new Date(reservaExistente.fechaFin).toLocaleString()}</p>
          </Alert>
        )}

        {/* Información del Usuario */}
        <div className="mb-3 p-3 bg-primary bg-opacity-10 rounded">
          <h6 className="text-primary mb-2">👤 Información del Usuario:</h6>
          <p className="mb-1"><strong>Nombre:</strong> {user?.nombre || user?.displayName || 'No especificado'}</p>
          <p className="mb-0"><strong>Email:</strong> {user?.email}</p>
        </div>

        {/* Información de la Sala */}
        {sala && (
          <div className="mb-3 p-3 bg-light rounded">
            <h6>🏟️ Detalles de la instalación:</h6>
            <p className="mb-1"><strong>Nombre:</strong> {sala.nombre}</p>
            {sala.descripcion && (
              <p className="mb-1"><strong>Descripción:</strong> {sala.descripcion}</p>
            )}
            {sala.ubicacion && (
              <p className="mb-1"><strong>Ubicación:</strong> {sala.ubicacion}</p>
            )}
            <p className="mb-0"><strong>Capacidad:</strong> {sala.capacidad || 'No especificada'} personas</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {/* Solo mostrar el formulario si no hay reserva existente */}
        {!reservaExistente && (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Reserva *</Form.Label>
              <Form.Control
                type="date"
                name="fechaReserva"
                value={formData.fechaReserva}
                onChange={handleChange}
                min={getFechaMinima()}
                max={getFechaMaxima()}
                required
              />
              <Form.Text className="text-muted">
                Puedes reservar hasta 30 días por adelantado
              </Form.Text>
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Hora de Inicio *</Form.Label>
                  <Form.Control
                    type="time"
                    name="horaInicio"
                    value={formData.horaInicio}
                    onChange={handleChange}
                    min="06:00"
                    max="22:00"
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Hora de Fin *</Form.Label>
                  <Form.Control
                    type="time"
                    name="horaFin"
                    value={formData.horaFin}
                    onChange={handleChange}
                    min="06:00"
                    max="23:00"
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <div className="alert alert-info">
              <small>
                <strong>📋 Instrucciones:</strong><br />
                • Las reservas solo pueden realizarse de 6:00 AM a 11:00 PM<br />
                • Se verificará automáticamente que el horario esté disponible<br />
                • Al confirmar la reserva, la instalación quedará marcada como "Ocupada"<br />
                • Para finalizar el uso, contacta al administrador
              </small>
            </div>

            {/* Botón de envío dentro del Form para que funcione el onSubmit */}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" onClick={handleClose} disabled={loading || verificandoConflicto}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="primary" 
                disabled={loading || verificandoConflicto}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Reservando...
                  </>
                ) : verificandoConflicto ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Verificando disponibilidad...
                  </>
                ) : (
                  '✅ Confirmar Reserva'
                )}
              </Button>
            </div>
          </Form>
        )}

        {/* Si hay reserva existente, solo mostrar botón de cerrar */}
        {reservaExistente && (
          <div className="d-flex justify-content-end mt-3">
            <Button variant="secondary" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default ReservaModal;