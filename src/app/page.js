'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function HomePage() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pokemon, setPokemon] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pokemonList, setPokemonList] = useState([]);

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const results = response.data.results;
        const names = results.map((p) => p.name.charAt(0).toUpperCase() + p.name.slice(1)); // Capitalize
        setPokemonList(names);
      } catch (error) {
        console.error('Failed to fetch Pokémon:', error);
      }
    };

    fetchPokemon();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    const allowedTypes = ['image/png', 'image/jpeg'];

    if (file && allowedTypes.includes(file.type)) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    } else {
      alert('Only PNG or JPEG images are allowed');
    }
  };

  const handleSubmit = async () => {
    if (!image || !pokemon) {
      alert('Please upload a PNG or JPEG image and select a Pokémon');
      return;
    }

    const formData = new FormData();
    formData.append('file', image);
    formData.append('pokemon', pokemon);

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/generate-image/', formData);

      // Backend now returns base64-encoded image in res.data.image
      const base64Data = res.data.image;
      const imgUrl = `data:image/png;base64,${base64Data}`;
      setResultImage(imgUrl);
    } catch (err) {
      alert('Failed to generate image: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">CarsNPoke - Test Image Generator</h1>

      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        onChange={handleImageChange}
        className="mb-4 text-sm"
      />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-64 h-auto rounded-lg mb-4 border border-gray-700"
        />
      )}

      <select
        value={pokemon}
        onChange={(e) => setPokemon(e.target.value)}
        className="mb-4 p-2 text-white rounded bg-gray-800"
      >
        <option value="">Select a Pokémon</option>
        {pokemonList.map((name, index) => (
          <option key={index} value={name}>
            {name}
          </option>
        ))}
      </select>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold"
      >
        {loading ? 'Generating...' : 'Generate Image'}
      </button>

      {resultImage && (
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <img
            src={resultImage}
            alt="Generated"
            className="w-64 h-auto rounded-lg border border-gray-700"
          />
        </div>
      )}
    </main>
  );
}
