// src/components/Navbar.jsx
import { Navbar as BootstrapNavbar, Nav, Container, Dropdown, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

function Navbar({ user, onLogout }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <LinkContainer to="/">
          <BootstrapNavbar.Brand>
            🏃‍♂️ Centro Deportivo Universitario
          </BootstrapNavbar.Brand>
        </LinkContainer>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/">
              <Nav.Link>Inicio</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/salas">
              <Nav.Link>Instalaciones</Nav.Link>
            </LinkContainer>
            {user && user.rol === 'admin' && (
              <LinkContainer to="/admin">
                <Nav.Link>Administración</Nav.Link>
              </LinkContainer>
            )}
          </Nav>

          {user && (
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                  <span className="me-2">👤</span>
                  {user.nombre}
                  {user.rol === 'admin' && (
                    <Badge bg="warning" className="ms-2">Admin</Badge>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Header>
                    <div>
                      <strong>{user.nombre}</strong>
                    </div>
                    <div className="small text-muted">{user.email}</div>
                    <div className="small">
                      <Badge bg={user.rol === 'admin' ? 'warning' : 'primary'}>
                        {user.rol === 'admin' ? 'Administrador' : 'Usuario'}
                      </Badge>
                    </div>
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <LinkContainer to="/perfil">
                    <Dropdown.Item>
                      ⚙️ Mi Perfil
                    </Dropdown.Item>
                  </LinkContainer>
                  {user.rol === 'admin' && (
                    <LinkContainer to="/admin">
                      <Dropdown.Item>
                        🛠️ Panel Admin
                      </Dropdown.Item>
                    </LinkContainer>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    🚪 Cerrar Sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          )}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;