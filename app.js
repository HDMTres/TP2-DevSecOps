// Fichier test pour déclencher Semgrep SAST

const express = require('express');
const app = express();

// Vulnérabilité 1: Hardcoded admin password (détecté par règle custom)
const adminPassword = "admin";

// Vulnérabilité 2: SQL Injection risk
function getUser(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId + ";";
  return db.query(query);
}

// Vulnérabilité 3: Hardcoded secret (détecté par p/secrets)
const apiKey = "sk_test_FAKE_KEY_FOR_DEMO_PURPOSES";

// Vulnérabilité 4: Eval usage (détecté par p/owasp-top-ten)
function processInput(userCode) {
  return eval(userCode);
}

// Vulnérabilité 5: Missing rate limiting (détecté par p/owasp-top-ten)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // No rate limiting or brute force protection
  if (username === 'admin' && password === adminPassword) {
    res.json({ token: generateToken() });
  }
});

app.listen(3000);
