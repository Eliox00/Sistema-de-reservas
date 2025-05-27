// src/App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';

// Componentes
import Navbar from './components/Navbar';
import Home from './components/Home';
import SalasList from './components/SalasList';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Obtener información adicional del usuario de Firestore
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          // Determinar el rol del usuario
          const isAdmin = userData.rol === 'admin' || firebaseUser.email === 'admin@centro.com';
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nombre: userData.nombre || firebaseUser.email.split('@')[0],
            rol: isAdmin ? 'admin' : 'usuario'
          });
        } catch (error) {
          console.error('Error obteniendo datos del usuario:', error);
          // Si hay error obteniendo datos adicionales, usar solo info básica
          const isAdmin = firebaseUser.email === 'admin@centro.com';
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nombre: firebaseUser.email.split('@')[0],
            rol: isAdmin ? 'admin' : 'usuario'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Mostrar spinner mientras se verifica la autenticación
  if (loading || !authChecked) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <Navbar user={user} onLogout={handleLogout} />
      <Container className="mt-4">
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute user={user}>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/salas" 
            element={
              <ProtectedRoute user={user}>
                <SalasList user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute user={user} requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/login" 
            element={<Navigate to="/" replace />} 
          />
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </Container>
    </div>
  );
}

export default App;