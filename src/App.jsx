import { useState } from 'react';
import LoginComponent from './LoginComponent';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    console.log('User logged in:', userData); // Debug log
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginComponent onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;