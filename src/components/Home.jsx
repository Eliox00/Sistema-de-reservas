// src/components/Home.jsx
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white text-center py-5 mb-5 rounded">
        <Container>
          <h1 className="display-4 fw-bold">Centro Deportivo Universitario</h1>
          <p className="lead mb-4">
            Tu espacio para el deporte y la recreación. Reserva nuestras instalaciones deportivas de forma fácil y rápida.
          </p>
          <Button as={Link} to="/salas" variant="light" size="lg">
            Ver Instalaciones Disponibles
          </Button>
        </Container>
      </div>

      {/* Features Section */}
      <Container>
        <Row className="mb-5">
          <Col>
            <h2 className="text-center mb-4">¿Por qué elegir nuestro centro?</h2>
          </Col>
        </Row>
        
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 text-center border-0 shadow-sm">
              <Card.Body>
                <div className="display-4 text-primary mb-3">🏀</div>
                <Card.Title>Instalaciones Modernas</Card.Title>
                <Card.Text>
                  Contamos con las mejores instalaciones deportivas equipadas con tecnología de punta para tu comodidad.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 text-center border-0 shadow-sm">
              <Card.Body>
                <div className="display-4 text-success mb-3">📅</div>
                <Card.Title>Reservas Fáciles</Card.Title>
                <Card.Text>
                  Sistema de reservas online las 24 horas. Reserva tu espacio favorito cuando quieras, donde quieras.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 text-center border-0 shadow-sm">
              <Card.Body>
                <div className="display-4 text-warning mb-3">⭐</div>
                <Card.Title>Excelente Ubicación</Card.Title>
                <Card.Text>
                  Ubicado en el corazón del campus universitario, fácil acceso y estacionamiento disponible.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Services Section */}
        <Row className="mt-5">
          <Col>
            <h2 className="text-center mb-4">Nuestros Servicios</h2>
          </Col>
        </Row>
        
        <Row className="g-3">
          <Col md={6} lg={3}>
            <Card className="text-center border-primary">
              <Card.Body>
                <div className="h4 text-primary mb-2">🏐</div>
                <Card.Title className="h6">Canchas de Voleibol</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3}>
            <Card className="text-center border-success">
              <Card.Body>
                <div className="h4 text-success mb-2">⚽</div>
                <Card.Title className="h6">Canchas de Fútbol</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3}>
            <Card className="text-center border-warning">
              <Card.Body>
                <div className="h4 text-warning mb-2">🏀</div>
                <Card.Title className="h6">Canchas de Básquetbol</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3}>
            <Card className="text-center border-info">
              <Card.Body>
                <div className="h4 text-info mb-2">🎾</div>
                <Card.Title className="h6">Canchas de Tenis</Card.Title>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Call to Action */}
        <Row className="mt-5 py-4">
          <Col className="text-center">
            <h3>¿Listo para comenzar?</h3>
            <p className="lead text-muted mb-4">
              Explora nuestras instalaciones y realiza tu reserva hoy mismo
            </p>
            <Button as={Link} to="/salas" variant="primary" size="lg" className="me-3">
              Ver Instalaciones
            </Button>
            <Button as={Link} to="/admin" variant="outline-primary" size="lg">
              Panel de Administración
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Home;