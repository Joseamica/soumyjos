// ============================================
// Firebase — proyecto soumyjose
// ============================================
//
// Credenciales del proyecto Firebase. Son públicas por diseño:
// Firebase Web SDKs las expone en el cliente. La seguridad real
// vive en database.rules.json.
//
// Nota: Firebase no incluyó `databaseURL` en el bloque original
// porque la app Web se registró antes de crear la Realtime Database.
// El URL se deriva del projectId + la región (us-central1 → .firebaseio.com).
// Si por alguna razón la DB quedó en otra región, actualiza databaseURL
// con el URL exacto que muestra la pestaña "Realtime Database" de Firebase.

var FIREBASE_CONFIG = {
  apiKey: "AIzaSyAYWXS85xnnRuOmeXeMXC1yT-rnspz83vA",
  authDomain: "soumyjose.firebaseapp.com",
  databaseURL: "https://soumyjose-default-rtdb.firebaseio.com",
  projectId: "soumyjose",
  storageBucket: "soumyjose.firebasestorage.app",
  messagingSenderId: "569237294690",
  appId: "1:569237294690:web:a2c0fcec3c25b583880b3b",
  measurementId: "G-6ZWZLYW3B4"
};
