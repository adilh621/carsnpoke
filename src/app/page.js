'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Components/Header';
import { supabase } from '../../lib/supabaseClient';

export default function HomePage() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pokemon, setPokemon] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pokemonList, setPokemonList] = useState([]);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // useEffect(() => {
  //   const fetchPokemon = async () => {
  //     try {
  //       const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1025');
  //       const results = response.data.results;

  //       const pokemonDetails = await Promise.all(
  //         results.map(async (pokemon) => {
  //           const res = await axios.get(pokemon.url);
  //           return {
  //             name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
  //             id: res.data.id
  //           };
  //         })
  //       );

  //       setPokemonList(pokemonDetails);
  //     } catch (error) {
  //       console.error('Failed to fetch Pokémon:', error);
  //     }
  //   };

  //   fetchPokemon();
  // }, []);
  useEffect(() => {
  const fetchPokemon = async () => {
    try {
      const response = await fetch('/pokedex.json'); // Since it's in /public
      const data = await response.json();

      // Map it into { name, id } using the English name
      const simplifiedList = data.map(pokemon => ({
        name: pokemon.name.english,
        id: pokemon.id
      }));

      setPokemonList(simplifiedList);
    } catch (error) {
      console.error('Failed to load pokedex.json:', error);
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
      setResultImage(null);
    } else {
      alert('Only PNG or JPEG images are allowed');
    }
  };

  const handleSubmit = async () => {
    if (!image || !pokemon) {
      alert('Please upload an image and select a Pokémon');
      return;
    }

    setLoading(true);

    try {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `user_uploads/${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('uploadedimage')
        .upload(filePath, image, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw new Error(`Upload failed: ${error.message}`);

      const { data: publicUrlData } = supabase.storage
        .from('uploadedimage')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      const res = await axios.post('https://carsnpoke-backend-production.up.railway.app/generate-image/', {
        image_url: imageUrl,
        pokemon_name: pokemon.name,
        pokemon_id: pokemon.id
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

        {/* Upload + Controls */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
          <label className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded cursor-pointer inline-block">
            Upload Image
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <select
            value={pokemon?.name || ''}
            onChange={(e) => {
              const selected = pokemonList.find(p => p.name === e.target.value);
              setPokemon(selected);
            }}
            className="p-2 text-white rounded bg-gray-800"
          >
            <option value="">Select a Pokémon</option>
            {pokemonList.map((p, index) => (
              <option key={index} value={p.name}>{p.name}</option>
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

        {/* Unified Image Preview / Result */}
        {/* Unified Image Preview / Result */}
        <div className="w-full max-w-2xl border border-gray-700 rounded-lg p-4 bg-gray-900 flex flex-col items-center justify-center min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-white">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-300">Generating image...</p>
            </div>
          ) : resultImage ? (
            <>
              <img src={resultImage} alt="Result" className="rounded max-w-full max-h-[480px] mb-4" />
              <a
                href={resultImage}
                download="carsnpoke_result.png"
                className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
              >
                Download Image
              </a>
            </>
          ) : preview ? (
            <img src={preview} alt="Preview" className="rounded max-w-full max-h-[480px]" />
          ) : (
            <p className="text-gray-500">No image selected</p>
          )}
        </div>

      </main>
    </>
  );
}
