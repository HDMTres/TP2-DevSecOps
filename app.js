// Fichier test pour déclencher Semgrep SAST

const express = require('express');
const app = express();

// FIX: Utiliser variable d'environnement au lieu de hardcoded password
const adminPassword = process.env.ADMIN_PASSWORD || "change-me";

// FIX: Utiliser requêtes paramétrées pour éviter SQL injection
function getUser(userId) {
  const query = "SELECT * FROM users WHERE id = ?";
  return db.query(query, [userId]);
}

// FIX: Utiliser variable d'environnement pour les secrets
const apiKey = process.env.STRIPE_API_KEY;

// FIX: Ne jamais utiliser eval() - utiliser JSON.parse() ou alternatives sécurisées
function processInput(userCode) {
  // return eval(userCode); // DANGER - commenté
  return JSON.parse(userCode); // Alternative sécurisée pour JSON
}

// Vulnérabilité 5: Missing rate limiting (reste à corriger)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // TODO: Ajouter rate limiting avec express-rate-limit
  if (username === 'admin' && password === adminPassword) {
    res.json({ token: generateToken() });
  }
});

app.listen(3000);