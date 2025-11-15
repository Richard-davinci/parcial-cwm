/**
 * -----------------------------------------------------------
 * 📄 supabase.js
 * -----------------------------------------------------------
 * Este módulo inicializa y exporta el cliente de Supabase
 * para que pueda ser utilizado en todo el proyecto.
 *
 * 🧠 Supabase es una plataforma backend-as-a-service que provee:
 * - Autenticación de usuarios
 * - Base de datos PostgreSQL con API REST automática
 * - Almacenamiento de archivos
 * - Funciones edge (serverless)
 *
 * ⚙️ En este archivo solo se crea la instancia del cliente,
 * usando las variables de entorno configuradas en el archivo `.env`.
 * -----------------------------------------------------------
 */
import {createClient} from '@supabase/supabase-js' // 📦 Importamos la función para crear el cliente
/**
 * 🌐 URL base de tu proyecto Supabase
 * 🗝️ Clave pública anónima (anon key)
 *
 * ⚠️ Estas variables deben estar definidas en tu archivo `.env` como:
 * VITE_SUPABASE_URL="https://tuproyecto.supabase.co"
 * VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR..."
 */
const SUPABASE_URL = 'https://zjapqwsywcctjswzxsik.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EGGEdpMYn-emz83WOws1pA_yj_yIkYw';

/**
 * 🛠️ Crear instancia global de Supabase
 *
 * - Esta instancia es la que se usará en todos los servicios del proyecto.
 * - Permite interactuar con la base de datos, autenticación y almacenamiento.
 * - No se deben exponer claves privadas en el frontend (usar solo `anon key`).
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ Ahora podés importar y usar este cliente desde cualquier servicio:
// import { supabase } from '../services/supabase.js'