import { useState } from 'react'
import axios from 'axios';
import './App.css'

function App() {
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

export default App
