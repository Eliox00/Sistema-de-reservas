// src/components/SalaForm.jsx
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { salasService } from '../services/firebaseService';

function SalaForm({ show, onHide, sala, onGuardar }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    capacidad: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sala) {
      setFormData({
        nombre: sala.nombre || '',
        descripcion: sala.descripcion || '',
        ubicacion: sala.ubicacion || '',
        capacidad: sala.capacidad || ''
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        ubicacion: '',
        capacidad: ''
      });
    }
    setError('');
  }, [sala, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    
    if (!formData.descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    
    if (!formData.ubicacion.trim()) {
      setError('La ubicación es obligatoria');
      return;
    }
    
    if (!formData.capacidad || formData.capacidad <= 0) {
      setError('La capacidad debe ser un número mayor a 0');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const salaData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        ubicacion: formData.ubicacion.trim(),
        capacidad: parseInt(formData.capacidad)
      };

      if (sala) {
        // Actualizar sala existente
        await salasService.actualizar(sala.id, salaData);
      } else {
        // Crear nueva sala
        await salasService.crear(salaData);
      }

      onGuardar();
    } catch (err) {
      setError(`Error al ${sala ? 'actualizar' : 'crear'} la sala: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      ubicacion: '',
      capacidad: ''
    });
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {sala ? '✏️ Editar Instalación' : '➕ Nueva Instalación'}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Nombre de la Instalación *</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Cancha de Fútbol Principal"
              required
            />
            <Form.Text className="text-muted">
              Nombre descriptivo de la instalación deportiva
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Descripción *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe las características y equipamiento de la instalación..."
              required
            />
            <Form.Text className="text-muted">
              Detalla las características, equipamiento y servicios disponibles
            </Form.Text>
          </Form.Group>

          <div className="row">
            <div className="col-md-8">
              <Form.Group className="mb-3">
                <Form.Label>Ubicación *</Form.Label>
                <Form.Control
                  type="text"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  placeholder="Ej: Pabellón A, Segundo Piso"
                  required
                />
                <Form.Text className="text-muted">
                  Ubicación específica dentro del centro deportivo
                </Form.Text>
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Capacidad *</Form.Label>
                <Form.Control
                  type="number"
                  name="capacidad"
                  value={formData.capacidad}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  required
                />
                <Form.Text className="text-muted">
                  Número máximo de personas
                </Form.Text>
              </Form.Group>
            </div>
          </div>

          <div className="alert alert-info">
            <small>
              <strong>Nota:</strong> Las nuevas instalaciones se crean como "Disponibles" por defecto. 
              Puedes cambiar su estado desde la lista de instalaciones.
            </small>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                {sala ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              sala ? 'Actualizar Instalación' : 'Crear Instalación'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default SalaForm;