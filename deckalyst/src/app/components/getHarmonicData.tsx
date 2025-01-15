'use client';

import { useState } from 'react';

export default function GetHarmonicData () {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/harmonic', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log(data)
      if (data) {

        setAnalysis(JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
          <label className="block mb-2">Enter API KEY</label>
          <input
            type="text"
            name="apikey"
            className="border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">Enter website</label>
          <input
            type="text"
            name="website"
            className="border p-2 rounded"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isLoading ? 'Fetching...' : 'Get'}
        </button>
      </form>

      {analysis && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Result</h2>
          <div className="whitespace-pre-wrap">{analysis}</div>
        </div>
      )}
    </div>
  );
} 