const express = require('express');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');
const ip = require('ip');

const app = express();

// Middleware de Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutos
  max: 10 // limite cada IP a 10 requisições por janela de tempo
});

// Aplicando o Rate Limiting globalmente
app.use(limiter);

function addToBlacklist(ip) {
  db.run('INSERT OR IGNORE INTO blacklist (ip) VALUES (?)', [ip], (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`IP adicionado à blacklist: ${ip}`);
  });
}

const blockedIps = ['192.168.1.10'];

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS blacklist (ip TEXT UNIQUE)');

  blockedIps.forEach((ip) => addToBlacklist(ip));
});

// Middleware para verificar a Blacklist de IPs
app.use((req, res, next) => {
  const clientIp = ip.address() || req.ip;
  db.get('SELECT ip FROM blacklist WHERE ip = ?', [clientIp], (err, row) => {
    if (row) {
      res.status(403).send('Acesso negado.');
    } else {
      next();
    }
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));