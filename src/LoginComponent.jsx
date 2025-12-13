import { Button, Card, Label, TextInput } from "flowbite-react";
import { useState } from "react";

export function LoginComponent({ onLogin}) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('Creating account and setting up storage...');

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, size: parseInt(size) })
      });

      const data = await response.json();
      console.log('Registration response:', data); // Debug log

      if (response.ok && data.success) {
        setMessage('Registration and storage setup complete!');
        setTimeout(() => {
          alert('Registration successful! Please login.');
          setIsLogin(true);
          setPassword('');
          setSize('');
          setMessage('');
        }, 1000);
      } else {
        setMessage(data.error || 'Registration failed');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
      console.error('Registration error:', err);
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success && data.user) {
        onLogin(data.user); // Pass the user object to parent
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <Card className="max-w-sm bg-white dark:bg-gray-800 p-8">
      <form className="flex flex-col gap-4" onSubmit={isLogin ? handleLogin : handleRegister}>
        <h2 className="text-2xl font-bold text-center">
          {isLogin ? 'Login' : 'Register'}
        </h2>

        {message && (
          <div className={`p-3 rounded ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <div>
          <div className="mb-2 block">
            <Label htmlFor="username">Your username</Label>
          </div>
          <TextInput
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="password1">Your password</Label>
          </div>
          <TextInput
            id="password1"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {!isLogin && (
          <div>
            <div className="mb-2 block">
              <Label htmlFor="size">Size</Label>
            </div>
            <div className="relative">
              <TextInput
                id="size"
                type="number"
                required
                min="1"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                GB
              </span>
            </div>
          </div>
        )}

        <Button type="submit">{isLogin ? 'Login' : 'Register'}</Button>
        <Button
          type="button"
          color="light"
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
            setSize("");
          }}
        >
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </Button>
      </form>
    </Card>
  );
}

export default LoginComponent;