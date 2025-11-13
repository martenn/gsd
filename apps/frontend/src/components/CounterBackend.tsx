import { useState, useEffect } from 'react';

export default function CounterBackend() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Fetch initial count from backend
  useEffect(() => {
    fetch('http://localhost:3000/counter')
      .then((res) => res.json())
      .then((data) => setCount(data.count))
      .catch((err) => console.error('Error fetching counter:', err));
  }, []);

  const handleIncrement = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/counter/increment', {
        method: 'POST',
      });
      const data = await response.json();
      setCount(data.count);
    } catch (err) {
      console.error('Error incrementing counter:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-green-300 rounded-lg bg-green-50">
      <h2 className="text-xl font-bold mb-2">Backend Counter (PoC)</h2>
      <p className="mb-4">Count: {count}</p>
      <button
        onClick={() => void handleIncrement()}
        disabled={loading}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
      >
        {loading ? 'Loading...' : 'Increment'}
      </button>
    </div>
  );
}
