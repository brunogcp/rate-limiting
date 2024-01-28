const express = require('express');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');
const ip = require('ip');
const cors = require('cors')

const app = express();
app.use(express.json())
app.use(cors())

// Função para adicionar IP à blacklist
function addToBlacklist(ip) {
  db.run('INSERT OR IGNORE INTO blacklist (ip) VALUES (?)', [ip], (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`IP adicionado à blacklist: ${ip}`);
  });
}

// Customizando o handler do rate limit para adicionar à blacklist após 3 violações
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutos
  max: 10, // limite cada IP a 10 requisições por janela de tempo
  handler: (req, res) => {
    const clientIp = ip.address() || req.ip;
    addToBlacklist(clientIp);
    
    // Em seguida, envie uma resposta de limite excedido
    res.status(429).json({
      message: "Too many requests, you've been blacklisted."
    });
  }
});

// Aplicando o Rate Limiting globalmente
app.use(limiter);

// Inicialização do Banco de Dados para Blacklist
db.run('CREATE TABLE IF NOT EXISTS blacklist (ip TEXT UNIQUE)');
db.run('CREATE TABLE IF NOT EXISTS loginAttempts (ip TEXT UNIQUE, attempts INTEGER)');

// Função para adicionar ou atualizar tentativas de login
function updateLoginAttempts(ip, success = false, callback) {
  if (success) {
    db.run('DELETE FROM loginAttempts WHERE ip = ?', [ip], () => {
      callback(true); // Indica sucesso sem restrições
    });
  } else {
    db.get('SELECT attempts FROM loginAttempts WHERE ip = ?', [ip], (err, row) => {
      if (row) {
        const newAttempts = row.attempts + 1;
        if (newAttempts >= 5) {
          addToBlacklist(ip); // Adiciona à blacklist se atingir 5 tentativas falhas
          db.run('DELETE FROM loginAttempts WHERE ip = ?', [ip], () => {
            callback(false, 0, true); // Indica bloqueio
          });
        } else {
          db.run('UPDATE loginAttempts SET attempts = ? WHERE ip = ?', [newAttempts, ip], () => {
            callback(false, 5 - newAttempts); // Retorna tentativas restantes
          });
        }
      } else {
        db.run('INSERT INTO loginAttempts (ip, attempts) VALUES (?, 1)', [ip], () => {
          callback(false, 4); // Primeira falha, 4 tentativas restantes
        });
      }
    });
  }
}

// Função de autenticação básica
function authenticate(username, password) {
  // Credenciais mocadas para exemplo
  const mockUsername = 'user';
  const mockPassword = 'pass';
  return username === mockUsername && password === mockPassword;
}

// Middleware para verificar a Blacklist de IPs
app.use((req, res, next) => {
  const clientIp = ip.address() || req.ip;
  db.get('SELECT ip FROM blacklist WHERE ip = ?', [clientIp], (err, row) => {
    if (row) {
      res.status(403).json({ message: 'Acesso negado.' });
    } else {
      next();
    }
  });
});

// Middleware para login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const isAuthenticated = authenticate(username, password);
  const clientIp = ip.address() || req.ip
  
  if (!isAuthenticated) {
    updateLoginAttempts(clientIp, false, (success, attemptsLeft, isBlocked) => {
      if (isBlocked) {
        res.status(403).json({ message: 'Seu IP foi bloqueado devido a tentativas de login excessivas.', attemptsLeft: 0 });
      } else {
        res.status(401).json({ message: 'Login falhou. Tente novamente.', attemptsLeft });
      }
    });
  } else {
    // Se autenticado, zera as tentativas de login
    updateLoginAttempts(clientIp, true, () => {
      res.json({ message: 'Login bem-sucedido!' });
    });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));