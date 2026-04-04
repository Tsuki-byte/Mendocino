// ==========================================
// Configuración de Supabase (Backend/Database)
// ==========================================

// IMPORTANTE: Debes reemplazar estos dos valores con los de tu proyecto Supabase.
// Los encuentras en Project Settings > API
const SUPABASE_URL = 'https://errspjsarhkqexanostz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycnNwanNhcmhrcWV4YW5vc3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjEzNDgsImV4cCI6MjA5MDYzNzM0OH0.Cs-VzZVnYz614Ogg9DHy-3mEkCXRzq9uMxninyCFv9w';

// Inicialización del cliente Supabase desde el CDN
// Sobreescribimos el objeto global window.supabase pasándole sus credenciales para que actúe como cliente
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase Cliente Inicializado correctamente (esperando consultar la BD...)");
