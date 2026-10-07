<div align="center">

# 🎬 React Native Movie App

**Find movies by title, by mood, or by what's on your mind, and keep a personal watchlist.**

<img src="https://img.shields.io/badge/-React_Native-black?style=for-the-badge&logoColor=white&logo=react&color=61DAFB" alt="React Native" />
<img src="https://img.shields.io/badge/-Expo-black?style=for-the-badge&logoColor=white&logo=expo&color=000020" alt="Expo" />
<img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="TypeScript" />
<img src="https://img.shields.io/badge/-NativeWind-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="NativeWind" />
<img src="https://img.shields.io/badge/-Appwrite-black?style=for-the-badge&logoColor=white&logo=appwrite&color=F02E65" alt="Appwrite" />
<img src="https://img.shields.io/badge/-TMDB-black?style=for-the-badge&logoColor=white&logo=themoviedatabase&color=01B4E4" alt="TMDB" />

</div>

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center"><img src="assets/screenshots/home.png" width="230" /><br /><b>Home</b><br /><sub>Trending + latest movies</sub></td>
    <td align="center"><img src="assets/screenshots/search.png" width="230" /><br /><b>Search</b><br /><sub>Search by movie title</sub></td>
    <td align="center"><img src="assets/screenshots/mood.png" width="230" /><br /><b>Mood</b><br /><sub>Search by thought or feeling</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/screenshots/details.png" width="230" /><br /><b>Movie details</b><br /><sub>Overview, genres, budget</sub></td>
    <td align="center"><img src="assets/screenshots/details-saved.png" width="230" /><br /><b>Saved to watchlist</b><br /><sub>Heart button at top right</sub></td>
    <td align="center"><img src="assets/screenshots/watchlist.png" width="230" /><br /><b>Watchlist</b><br /><sub>Your saved movies</sub></td>
  </tr>
</table>

---

## ✨ Features

- **Home:** Shows the most searched movies as a "Trending" row, plus a grid of the latest movies from TMDB.
- **Search by title:** Type a movie name and get matching results as you type (debounced to avoid spamming the API).
- **Trending from real usage:** Each search is counted in Appwrite, and the most searched movies appear in the Trending row.
- **Mood search:** Type a thought like *"I'm sad because of my breakup"* and get films that fit it. The screen also shows which themes were matched.
- **Remembered thoughts:** Your past thoughts are saved on the device. Tap one to run it again, or delete it.
- **Watchlist:** Tap the heart on any movie to save it. Only the movie ID is stored in Appwrite, and the full movie data is fetched from TMDB each time.
- **Movie details:** Poster, runtime, rating, overview, genres, budget, revenue and production companies.

---

## 🧠 How the Mood search works

TMDB has no "search by feeling" endpoint, so the app combines two of its endpoints:

1. `GET /search/keyword?query=breakup` turns the words in the thought into TMDB keyword IDs.
2. `GET /discover/movie?with_keywords=id1|id2|...` returns movies tagged with any of those keywords (`|` means OR).

Before step 1, the thought is cleaned: stop words such as "I", "my" and "because" are removed, so
*"I'm so sad because of my breakup"* becomes the terms `sad breakup`, `sad` and `breakup`.

If fewer than 5 movies are found, a **mood-to-genre fallback** kicks in (for example sad → Drama + Romance, scared → Horror + Thriller) so the user still gets suggestions.

## 🔖 How the Watchlist works

```
Heart tapped ──► Appwrite  { user_id, movie_id }
                      │
Watchlist tab ◄── list of movie IDs ──► TMDB /movie/{id} ──► movie cards
```

The app has no login, so each install generates a random `user_id`, stores it on the device, and uses it to keep one person's watchlist separate from another's.

---

## 🛠️ Tech Stack

| Area | Technology |
|---|---|
| Framework | React Native 0.76 with Expo SDK 52 |
| Navigation | Expo Router (file-based routing) |
| Language | TypeScript |
| Styling | NativeWind (Tailwind CSS for React Native) |
| Movie data | [TMDB API](https://developer.themoviedb.org/docs) |
| Backend / database | [Appwrite](https://appwrite.io) (search counts and watchlist) |
| Local storage | `@react-native-async-storage/async-storage` (thought history, device ID) |

---

## 📁 Project Structure

```
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Bottom tab bar (Home, Search, Mood, Watchlist)
│   │   ├── index.tsx          # Home: trending + latest movies
│   │   ├── search.tsx         # Search by title
│   │   ├── thoughts.tsx       # Mood search + remembered thoughts
│   │   └── watchlist.tsx      # Saved movies
│   ├── movie/[id].tsx         # Movie details + heart button
│   └── _layout.tsx            # Root stack
├── components/                # MovieCard, SearchBar, TrendingCard
├── services/
│   ├── api.ts                 # TMDB requests (movies, details, mood search, watchlist data)
│   ├── appwrite.ts            # Appwrite: search counts + watchlist
│   ├── thoughtHistory.ts      # Saves past thoughts on the device
│   └── usefetch.ts            # Reusable data-fetching hook
├── constants/                 # Icons and images
├── interfaces/                # Shared TypeScript types
└── assets/                    # Fonts, icons, images, screenshots
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (LTS)
- [Expo Go](https://expo.dev/go) on your phone, or an Android/iOS emulator
- A free [TMDB](https://www.themoviedb.org/settings/api) account
- A free [Appwrite Cloud](https://cloud.appwrite.io) account

### 1. Clone and install

```bash
git clone <your-repo-url>
cd <your-project-folder>
npm install
```

### 2. Set up Appwrite

Create a project and a database, then add **two collections**.

**Collection 1: `metrics`** (stores search counts for the Trending row)

| Attribute | Type | Size | Required |
|---|---|---|---|
| `searchTerm` | String | 255 | yes |
| `movie_id` | Integer | – | yes |
| `title` | String | 255 | yes |
| `count` | Integer | – | yes |
| `poster_url` | String (or URL) | 500 | yes |

**Collection 2: `watchlist`** (stores saved movies)

| Attribute | Type | Size | Required |
|---|---|---|---|
| `user_id` | String | 64 | yes |
| `movie_id` | Integer | – | yes |

Also add a key index on `user_id` in the `watchlist` collection.

For both collections, open **Settings → Permissions** and give the role **Any** these permissions:

- `metrics`: Create, Read, Update
- `watchlist`: Create, Read, Delete

> ⚠️ This is the simplest setup for a demo. For real users, switch to Appwrite authentication with per-user permissions.

### 3. Add environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_MOVIE_API_KEY=your_tmdb_read_access_token
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_appwrite_project_id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_appwrite_database_id
EXPO_PUBLIC_APPWRITE_COLLECTION_ID=your_metrics_collection_id
EXPO_PUBLIC_APPWRITE_WATCHLIST_COLLECTION_ID=your_watchlist_collection_id
```

Use the TMDB **API Read Access Token** (the long one), not the short API key.

### 4. Run the app

```bash
npx expo start -c
```

Scan the QR code with Expo Go. If your phone is on a different network, use `npx expo start --tunnel`.

---

## ⚠️ Known Limitations

- **Mood search depends on TMDB keywords.** Common themes (breakup, grief, friendship, revenge) work well, while very unusual phrases may fall back to genres.
- **English only.** Thoughts in other languages are not translated before searching.
- **Watchlist is tied to the device.** Reinstalling the app creates a new ID, so the old list is no longer reachable until accounts are added.
- **Open collection permissions.** See the note in the Appwrite setup.

## 🔮 Future Ideas

- User accounts with Appwrite Auth, so the watchlist follows the user across devices
- Smarter mood detection with an LLM or sentiment model, including Sinhala input
- "Watched" status and ratings on the watchlist
- Filters by genre and year on the search screen
- Share a watchlist with friends

---

## 🙏 Credits

- Movie data from [The Movie Database (TMDB)](https://www.themoviedb.org). *This product uses the TMDB API but is not endorsed or certified by TMDB.*
- The base app (Home, Search, Details, Trending) follows the [JavaScript Mastery](https://www.youtube.com/@javascriptmastery) React Native movie app tutorial. The Mood search and Watchlist features were added on top of it.
