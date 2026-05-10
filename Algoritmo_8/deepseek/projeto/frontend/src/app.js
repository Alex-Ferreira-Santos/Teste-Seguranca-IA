import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3333/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState('');

  // Configurar axios com token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      setUser(response.data.user);
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      setMessage(`Bem-vindo, ${response.data.user.nome}!`);
      setEmail('');
      setPassword('');
    } catch (error) {
      setMessage('Erro no login: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setMessage('Você saiu do sistema');
    setPosts([]);
    setComentarios([]);
    setUsuarios([]);
  };

  const fetchPublico = async () => {
    try {
      const response = await axios.get(`${API_URL}/publico`);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Erro: ' + error.message);
    }
  };

  const fetchPerfil = async () => {
    try {
      const response = await axios.get(`${API_URL}/perfil`);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Erro: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      setPosts(response.data.posts);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Erro ao buscar posts: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchComentarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/comentarios`);
      setComentarios(response.data.comentarios);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Erro ao buscar comentários: ' + (error.response?.data?.message || error.message));
    }
  };

  const createPost = async () => {
    if (!newPostTitle) return;
    try {
      const response = await axios.post(`${API_URL}/posts`, { titulo: newPostTitle });
      setMessage(response.data.message);
      setNewPostTitle('');
      fetchPosts();
    } catch (error) {
      setMessage('Erro ao criar post: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/usuarios`);
      setUsuarios(response.data);
      setMessage('Lista de usuários carregada');
    } catch (error) {
      setMessage('Erro ao buscar usuários: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteUsuario = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/usuarios/${id}`);
      setMessage(response.data.message);
      fetchUsuarios();
    } catch (error) {
      setMessage('Erro ao deletar: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="App">
      <h1>Sistema RBAC - Controle de Acesso por Papéis</h1>
      
      {!user ? (
        <div className="login-form">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Entrar</button>
          </form>
          <div className="test-accounts">
            <h3>Contas para teste:</h3>
            <p><strong>Admin:</strong> admin@email.com / admin123</p>
            <p><strong>Editor:</strong> editor@email.com / editor123</p>
            <p><strong>Usuário:</strong> user@email.com / user123</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="user-info">
            <h3>👤 Logado como: <strong>{user.nome}</strong> ({user.role})</h3>
            <button onClick={handleLogout}>Sair</button>
          </div>

          <div className="buttons">
            <button onClick={fetchPublico}>🌐 Conteúdo Público</button>
            <button onClick={fetchPerfil}>👤 Meu Perfil</button>
            <button onClick={fetchComentarios}>💬 Ver Comentários</button>
            
            {(user.role === 'editor' || user.role === 'admin') && (
              <>
                <button onClick={fetchPosts}>📝 Ver Posts</button>
                <div className="create-post">
                  <input
                    type="text"
                    placeholder="Título do post"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                  <button onClick={createPost}>➕ Criar Post</button>
                </div>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <button onClick={fetchUsuarios}>👥 Gerenciar Usuários</button>
              </>
            )}
          </div>

          {message && <div className="message">{message}</div>}

          {posts.length > 0 && (
            <div className="posts">
              <h3>Posts:</h3>
              <ul>{posts.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          )}

          {comentarios.length > 0 && (
            <div className="comentarios">
              <h3>Comentários:</h3>
              <ul>{comentarios.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}

          {usuarios.length > 0 && user.role === 'admin' && (
            <div className="usuarios">
              <h3>Gerenciar Usuários (Admin only):</h3>
              <table>
                <thead>
                  <tr><th>ID</th><th>Nome</th><th>Email</th><th>Papel</th><th>Ação</th></tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td><td>{u.nome}</td><td>{u.email}</td><td>{u.role}</td>
                      <td><button onClick={() => deleteUsuario(u.id)}>Excluir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;