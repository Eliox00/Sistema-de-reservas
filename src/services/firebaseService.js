// src/services/firebaseService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Servicios para Salas
export const salasService = {
  // Crear sala
  async crear(sala) {
    try {
      const docRef = await addDoc(collection(db, 'salas'), {
        ...sala,
        disponibilidad: true,
        fechaCreacion: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando sala:', error);
      throw error;
    }
  },

  // Obtener todas las salas
  async obtenerTodas() {
    try {
      const querySnapshot = await getDocs(collection(db, 'salas'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo salas:', error);
      throw error;
    }
  },

  // Buscar salas por nombre
  async buscarPorNombre(nombre) {
    try {
      const q = query(
        collection(db, 'salas'),
        where('nombre', '>=', nombre),
        where('nombre', '<=', nombre + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error buscando salas:', error);
      throw error;
    }
  },

  // Actualizar sala
  async actualizar(id, datos) {
    try {
      const salaRef = doc(db, 'salas', id);
      await updateDoc(salaRef, datos);
    } catch (error) {
      console.error('Error actualizando sala:', error);
      throw error;
    }
  },

  // Eliminar sala
  async eliminar(id) {
    try {
      await deleteDoc(doc(db, 'salas', id));
    } catch (error) {
      console.error('Error eliminando sala:', error);
      throw error;
    }
  }
};

// Servicios para Reservas
export const reservasService = {
  // Crear reserva
  async crear(reserva) {
    try {
      // Primero verificar si ya existe una reserva en conflicto
      const conflicto = await this.verificarConflicto(
        reserva.idSala, 
        reserva.fechaInicio, 
        reserva.fechaFin
      );

      if (conflicto) {
        throw new Error('Ya existe una reserva en este horario para esta sala');
      }

      const docRef = await addDoc(collection(db, 'reservas'), {
        ...reserva,
        estado: 'activa',
        fechaCreacion: new Date()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creando reserva:', error);
      throw error;
    }
  },

  // Verificar conflictos de horarios
  async verificarConflicto(idSala, fechaInicio, fechaFin) {
    try {
      const q = query(
        collection(db, 'reservas'),
        where('idSala', '==', idSala),
        where('estado', '==', 'activa')
      );
      
      const querySnapshot = await getDocs(q);
      const reservasExistentes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const nuevaInicio = new Date(fechaInicio);
      const nuevaFin = new Date(fechaFin);

      // Verificar solapamiento con reservas existentes
      const conflicto = reservasExistentes.some(reserva => {
        const reservaInicio = new Date(reserva.fechaInicio);
        const reservaFin = new Date(reserva.fechaFin);

        // Verificar si hay solapamiento
        return (nuevaInicio < reservaFin && nuevaFin > reservaInicio);
      });

      return conflicto;
    } catch (error) {
      console.error('Error verificando conflictos:', error);
      throw error;
    }
  },

  // Obtener todas las reservas
  async obtenerTodas() {
    try {
      const q = query(collection(db, 'reservas'), orderBy('fechaCreacion', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo reservas:', error);
      throw error;
    }
  },

  // Finalizar reserva
  async finalizar(id) {
    try {
      const reservaRef = doc(db, 'reservas', id);
      await updateDoc(reservaRef, { 
        estado: 'finalizada',
        fechaFinalizacion: new Date()
      });
    } catch (error) {
      console.error('Error finalizando reserva:', error);
      throw error;
    }
  },

  // Obtener reservas activas
  async obtenerActivas() {
    try {
      const q = query(
        collection(db, 'reservas'),
        where('estado', '==', 'activa')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo reservas activas:', error);
      throw error;
    }
  },

  // Obtener reservas por sala
  async obtenerPorSala(idSala) {
    try {
      const q = query(
        collection(db, 'reservas'),
        where('idSala', '==', idSala),
        where('estado', '==', 'activa')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo reservas por sala:', error);
      throw error;
    }
  }
};