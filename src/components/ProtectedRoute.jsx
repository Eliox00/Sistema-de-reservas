// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, user, requireAdmin = false }) {
  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere admin y el usuario no es admin, mostrar acceso denegado
  if (requireAdmin && user.rol !== 'admin') {
    return (
      <div className="text-center py-5">
        <div className="alert alert-warning">
          <h4>🚫 Acceso Denegado</h4>
          <p>No tienes permisos para acceder a esta sección.</p>
          <p className="text-muted">Solo los administradores pueden acceder al panel de administración.</p>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;