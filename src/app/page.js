'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Components/Header'; // Adjust the import path as necessary
import { supabase } from '../../lib/supabaseClient'; // Adjust the import path as necessary


export default function HomePage() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pokemon, setPokemon] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pokemonList, setPokemonList] = useState([]);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const results = response.data.results;
        const names = results.map((p) => p.name.charAt(0).toUpperCase() + p.name.slice(1));
        setPokemonList(names);
      } catch (error) {
        console.error('Failed to fetch Pokémon:', error);
      }
    };

    fetchPokemon();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleImageChange = (e) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

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

    setLoading(true);

    try {
      // 1. Upload image to Supabase
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('uploadedimage') // 👈 your Supabase bucket name
        .upload(`user_uploads/${fileName}`, image, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw new Error(`Upload failed: ${error.message}`);

      // 2. Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('uploadedimage')
        .getPublicUrl(`user_uploads/${fileName}`);
      
      const imageUrl = publicUrlData.publicUrl;

      // 3. Send to backend as raw JSON
      const res = await axios.post('http://localhost:8000/generate-image/', {
        image_url: imageUrl,
        pokemon,
      });

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
    <>
      <Header />
      {showLoginModal && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
          <h2 className="text-xl text-white font-semibold mb-4">Please sign in to upload</h2>
          <button
            onClick={async () => {
              await supabase.auth.signInWithOAuth({ provider: 'google' });
              setShowLoginModal(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            Sign in with Google
          </button>
          <button
            onClick={() => setShowLoginModal(false)}
            className="mt-4 block text-gray-400 hover:text-white text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )}


      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center pt-28 px-6 pb-12">
        <h1 className="text-4xl font-bold mb-6 text-center">Generate Pokémon + Car Images</h1>

        {/* Input section */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImageChange}
            className="text-sm"
          />

          <select
            value={pokemon}
            onChange={(e) => setPokemon(e.target.value)}
            className="p-2 text-white rounded bg-gray-800"
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
        </div>

        {/* Preview + Result Side-by-Side */}
        <div className="flex flex-col md:flex-row justify-center gap-12 mt-4 w-full max-w-5xl">
          {/* Left: Original Upload */}
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold mb-2">Your Upload</h2>
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full max-w-md h-auto rounded-lg border border-gray-700 mx-auto"
              />
            ) : (
              <div className="text-gray-500">No image selected</div>
            )}
          </div>

          {/* Right: Result or Spinner */}
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold mb-2">Result</h2>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : resultImage ? (
              <img
                src={resultImage}
                alt="Generated"
                className="w-full max-w-md h-auto rounded-lg border border-gray-700 mx-auto"
              />
            ) : (
              <div className="text-gray-500">No result yet</div>
            )}
          </div>
        </div>
      </main>

    </>
  );
}
