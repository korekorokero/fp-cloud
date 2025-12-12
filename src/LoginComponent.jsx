import { Button, Card, Label, TextInput } from "flowbite-react";
import { useState } from "react";

export function LoginComponent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const body = isLogin 
      ? { username, password }
      : { username, password, size: parseInt(size) };
    
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(isLogin ? 'Login successful!' : 'Registration successful!');
        setUsername("");
        setPassword("");
        setSize("");
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Server error. Please try again.');
    }
  };

  return (
    <Card className="max-w-sm bg-white dark:bg-gray-800 p-8">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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