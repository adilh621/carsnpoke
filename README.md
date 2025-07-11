# 🚗 CarsNPoke

**CarsNPoke** is a full-stack web application that allows users to upload a photo of their real-life car and select a Pokémon to be added seamlessly into the image. The app uses AI to generate a composite image where the selected Pokémon is naturally placed into the scene with appropriate lighting, scale, and shadows — like it's actually part of the photo.

---

## 📸 Demo

Live app: [https://carsnpoke.vercel.app](https://carsnpoke.vercel.app)

---

## 🧩 Features

- 🔐 Google OAuth authentication (via Supabase)
- 🖼 Upload real car photos
- 🎨 AI-generated image composition (adds a Pokémon in a natural, stylized way)
- 🧠 Smart prompt engineering to maintain Pokémon's official anime style
- 📁 Secure user-specific image storage using Supabase Storage
- 📥 Download button to save final generated image
- 📱 Fully responsive frontend (mobile and desktop)
- 🧭 Live Pokémon sprite reference for accuracy using PokeAPI

---

## 🛠️ Technologies Used

### 🔷 Frontend
- **Next.js 14 (App Router)**
- **Tailwind CSS** for styling
- **Axios** for HTTP requests
- **Supabase Auth** for user login
- **Supabase Storage** for image uploads
- **PokeAPI** for real Pokémon name/id list and sprites

### 🔶 Backend
- **FastAPI (Python)** for the `/generate-image` endpoint
- **DALL·E (GPT-4o)** API call to generate images from prompts
- **Base64 Image Encoding** for sending generated images back to the frontend

---

## 🚀 How It Works

1. **User logs in** with Google (OAuth via Supabase)
2. **User uploads a car image** (PNG or JPEG)
3. **User selects a Pokémon** from the full Pokédex (using live data from PokeAPI)
4. **Image is uploaded** to Supabase Storage
5. **Frontend sends a request** to the backend with:
   - image URL
   - Pokémon name
   - Pokémon ID (used to fetch sprite from PokeAPI)
6. **Backend generates the final image** using the OpenAI API, applying prompt engineering and sprite reference
7. **Result image is sent back**, displayed in-app, and made downloadable.

---
