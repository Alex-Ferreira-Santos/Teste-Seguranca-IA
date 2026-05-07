const API = 'http://localhost:3000';

async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const response = await fetch(`${API}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  document.getElementById('result').innerText = data.message || data.error;
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const response = await fetch(`${API}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.token) {
    localStorage.setItem('token', data.token);
    document.getElementById('result').innerText = 'Login realizado com sucesso';
  } else {
    document.getElementById('result').innerText = data.error;
  }
}

async function profile() {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  document.getElementById('result').innerText = JSON.stringify(data, null, 2);
}