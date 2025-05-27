// src/components/Login.jsx
import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Iniciar sesión
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        // Obtener información del usuario de Firestore
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        // Determinar el rol del usuario
        const isAdmin = userData.rol === 'admin' || formData.email === 'admin@centro.com';
        
        onLogin({
          uid: user.uid,
          email: user.email,
          nombre: userData.nombre || user.email.split('@')[0],
          rol: isAdmin ? 'admin' : 'usuario'
        });
      } else {
        // Registrarse
        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }

        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        // Determinar si es admin basado en el email
        const isAdmin = formData.email === 'admin@centro.com';
        
        // Guardar información adicional en Firestore
        await setDoc(doc(db, 'usuarios', user.uid), {
          nombre: formData.nombre,
          email: formData.email,
          rol: isAdmin ? 'admin' : 'usuario',
          fechaCreacion: new Date()
        });

        onLogin({
          uid: user.uid,
          email: user.email,
          nombre: formData.nombre,
          rol: isAdmin ? 'admin' : 'usuario'
        });
      }
    } catch (err) {
      console.error('Error de autenticación:', err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No existe una cuenta con este email');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta');
          break;
        case 'auth/email-already-in-use':
          setError('Ya existe una cuenta con este email');
          break;
        case 'auth/weak-password':
          setError('La contraseña es muy débil');
          break;
        case 'auth/invalid-email':
          setError('Email inválido');
          break;
        default:
          setError('Error al autenticar: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      nombre: '',
      confirmPassword: ''
    });
    setError('');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg border-0">
              <Card.Header className="bg-primary text-white text-center py-4">
                <h3 className="mb-0">
                  🏃‍♂️ Centro Deportivo Universitario
                </h3>
                <p className="mb-0 mt-2">
                  {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </p>
              </Card.Header>
              
              <Card.Body className="p-4">
                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  {!isLogin && (
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre Completo</Form.Label>
                      <Form.Control
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ingresa tu nombre completo"
                        required={!isLogin}
                      />
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu-email@ejemplo.com"
                      required
                    />
                    <Form.Text className="text-muted">
                      Usa admin@centro.com para acceso de administrador
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </Form.Group>

                  {!isLogin && (
                    <Form.Group className="mb-3">
                      <Form.Label>Confirmar Contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repite tu contraseña"
                        required={!isLogin}
                      />
                    </Form.Group>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                      </>
                    ) : (
                      isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
                    )}
                  </Button>
                </Form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="mb-2">
                    {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                  </p>
                  <Button
                    variant="outline-primary"
                    onClick={switchMode}
                    disabled={loading}
                  >
                    {isLogin ? 'Crear Nueva Cuenta' : 'Iniciar Sesión'}
                  </Button>
                </div>

                {/* Información de prueba */}
                <div className="mt-4 p-3 bg-light rounded">
                  <small className="text-muted">
                    <strong>Cuentas de prueba:</strong><br />
                    <strong>Admin:</strong> admin@centro.com / admin123<br />
                    <strong>Usuario:</strong> usuario@test.com / user123
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Login;