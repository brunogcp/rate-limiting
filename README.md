<div align="center">
  <h3 align="center">Rate Limiting</h3>
  <div>
  <a href="https://bgcp.vercel.app/article/b051b018-9516-41f0-9419-e6d73a11a01c">
  <img src="https://img.shields.io/badge/Download PDF (ENGLISH)-black?style=for-the-badge&logoColor=white&color=000000" alt="three.js" />
  </a>
  </div>
</div>

## 🚀 Introdução ao Rate Limiting e Blacklist de IPs

Neste tutorial, vamos explorar como implementar o rate limiting e a blacklist de IPs para proteger suas aplicações Node.js. Essas estratégias são fundamentais para manter a integridade e a disponibilidade dos seus serviços, limitando o número de requisições que um usuário pode fazer em um determinado período e bloqueando acessos indesejados de endereços IP específicos.

### 🌟 Principais Características:

- **Rate Limiting**:
  - **🛑 Limitação de Requisições**: Previne o abuso de serviços limitando o número de requisições que um usuário pode fazer.
  - **📈 Gerenciamento de Tráfego**: Ajuda a distribuir o tráfego uniformemente, evitando picos que podem levar à queda dos serviços.

- **Blacklist de IPs**:
  - **🚫 Bloqueio de Acessos Indesejados**: Permite bloquear endereços IP específicos que são considerados uma ameaça.
  - **🔒 Segurança Aprimorada**: Adiciona uma camada extra de segurança, protegendo a aplicação contra ataques maliciosos.

## 🛠️ Instalação

### Windows, Linux (Ubuntu/Debian), e macOS:

Certifique-se de ter Node.js e NPM instalados. Vamos utilizar o `express-rate-limit` para o rate limiting e o `express` para a criação do servidor. O SQLite será usado para armazenar a blacklist de IPs.

```bash
npm install express express-rate-limit sqlite3 ip cors
```

## 📊 Uso Básico

### Configuração Inicial:

Para começar, configure sua aplicação Node.js para utilizar o rate limiting e gerenciar uma blacklist de IPs. Usaremos o Express como nosso framework de servidor.
<div style="page-break-after: always;"></div>



1. **Instalação dos Pacotes**:

```bash
npm install express express-rate-limit sqlite3 ip cors
```

2. **Configuração do Servidor Express com Rate Limiting**:

Crie um arquivo `app.js`:

```js
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

// Inicialização do Banco de Dados para Blacklist
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
  db.get('SELECT ip FROM blacklist WHERE ip = ?', [ip], (err, row) => {
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
```

## 📈 Uso de Rate Limiting e Blacklist de IPs para Melhoria de Segurança

### Teoria:

💡 Implementar o rate limiting e a blacklist de IPs ajuda a proteger sua aplicação contra ataques de força bruta, DDoS e outros abusos, garantindo que serviços permaneçam disponíveis e seguros para usuários legítimos.

### Motivo para Utilizar:

🚀 Utilizar essas práticas fortalece a segurança e a estabilidade da sua aplicação web, prevenindo acessos não autorizados e garantindo uma distribuição equilibrada das requisições.

### 👨‍💻 Implementação Prática:

### Backend:

#### 1. Adicionando à Blacklist após Exceder o Rate Limit:

```js
const express = require('express');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');
const ip = require('ip');
const cors = require('cors')

const app = express();
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

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
```

#### 2. Autenticação Básica com Credenciais Mocadas:
```js
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

```

#### Frontend:

1. **Criação do Formulário de Login**:
	1. instalar o axios: `npm install axios`

- Utilize o React para criar um componente de formulário de login que se comunique com o backend.
```js
import React, { useState } from 'react';
import axios from 'axios';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(null); // Adiciona estado para tentativas restantes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpa erros anteriores
    setAttemptsLeft(null); // Limpa tentativas restantes anteriores
    try {
      const response = await axios.post('http://localhost:3000/login', { username, password });
      alert(response.data.message); // Exibe mensagem de sucesso
      // Reset das tentativas após sucesso, se necessário
      setAttemptsLeft(null);
    } catch (error) {
      // Atualiza o estado com o erro e tentativas restantes baseado na resposta do backend
      setError(error.response.data.message); // Assume que o backend envia uma mensagem de erro
      if (error.response.data.attemptsLeft !== undefined) {
        setAttemptsLeft(error.response.data.attemptsLeft); // Atualiza as tentativas restantes
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Usuário:</label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <label>Senha:</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
      {attemptsLeft !== null && <p>Tentativas restantes: {attemptsLeft}</p>} {/* Exibe as tentativas restantes */}
    </form>
  );
}

```
### Configuração Avançada do Rate Limiting e Blacklist:

- **Personalize as Regras de Rate Limiting** conforme as necessidades específicas da sua aplicação, ajustando o número de requisições permitidas e a janela de tempo.

- **Atualize a Blacklist de IPs** dinamicamente, permitindo adicionar ou remover IPs com base no comportamento observado ou em feeds de ameaças.

### 🔍 Testes

#### 1. Testar a Efetividade do Rate Limiting:

- Realize requisições sucessivas para a aplicação e observe se o limite estabelecido é respeitado.

#### 2. Verificar a Blacklist de IPs:

- Tente acessar a aplicação a partir de um IP bloqueado e verifique se o acesso é negado.

## 🏆 Conclusão

A implementação do rate limiting e da blacklist de IPs é vital para a segurança e a estabilidade de aplicações Node.js. Essas estratégias ajudam a prevenir abusos e garantem que apenas tráfego legítimo tenha acesso aos seus serviços. Continue explorando e ajustando essas técnicas para atender às necessidades específicas da sua aplicação, mantendo-a segura e acessível. 👨‍💻