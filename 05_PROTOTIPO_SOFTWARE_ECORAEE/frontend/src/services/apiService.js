// Servicio de comunicación REST con backend FastAPI y almacenamiento local resiliente
import { INITIAL_USERS, INITIAL_CENTERS, INITIAL_BATCHES, INITIAL_DEVICES, INITIAL_MOVEMENTS } from "../data/seedData";

const API_BASE_URL = "http://localhost:8000/api/v1";

const STORAGE_KEYS = {
  USERS: "ecoraee_users",
  DEVICES: "ecoraee_devices",
  BATCHES: "ecoraee_batches",
  CENTERS: "ecoraee_centers",
  MOVEMENTS: "ecoraee_movements",
  SESSION: "ecoraee_active_session"
};

export const StorageService = {
  get(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error al leer ${key} de localStorage:`, e);
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error al escribir ${key} en localStorage:`, e);
    }
  },
  initSeed() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CENTERS)) {
      this.set(STORAGE_KEYS.CENTERS, INITIAL_CENTERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BATCHES)) {
      this.set(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEVICES)) {
      this.set(STORAGE_KEYS.DEVICES, INITIAL_DEVICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
      this.set(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSION)) {
      this.set(STORAGE_KEYS.SESSION, INITIAL_USERS[1]); // carlos.operador por defecto
    }
  }
};

export const ApiService = {
  async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch("http://localhost:8000/health", {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async login(username, password) {
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${API_BASE_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return { success: true, token: data.access_token, fromBackend: true };
      }
    } catch (e) {
      // Fallback a modo local
    }

    // Validación local segura
    const users = StorageService.get(STORAGE_KEYS.USERS, INITIAL_USERS);
    const foundUser = users.find(u => u.username === username && u.password === password);

    if (foundUser) {
      return { success: true, user: foundUser, fromBackend: false };
    }
    return { success: false, error: "Credenciales institucionales incorrectas" };
  }
};

export { STORAGE_KEYS };
