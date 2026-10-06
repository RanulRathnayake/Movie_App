export const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
  },
};

export const fetchMovies = async ({
  query,
}: {
  query: string;
}): Promise<Movie[]> => {
  const endpoint = query
    ? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
    : `${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=popularity.desc`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch movies: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
};


export const fetchMovieDetails = async (
  movieId: string
): Promise<MovieDetails> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?api_key=${TMDB_CONFIG.API_KEY}`,
      {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch movie details: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
};


/* ------------------------------------------------------------------ */
/*  THOUGHT-BASED SEARCH  (uses TMDB /search/keyword + /discover/movie) */
/* ------------------------------------------------------------------ */

const STOP_WORDS = new Set([
  "i", "im", "i'm", "me", "my", "mine", "myself", "we", "our", "you", "your",
  "a", "an", "the", "and", "or", "but", "so", "if", "then", "than", "that",
  "this", "these", "those", "is", "am", "are", "was", "were", "be", "been",
  "being", "do", "does", "did", "have", "has", "had", "having", "will",
  "would", "can", "could", "should", "just", "really", "very", "too", "much",
  "of", "to", "in", "on", "at", "for", "with", "about", "from", "by", "as",
  "it", "its", "it's", "not", "no", "feel", "feeling", "feels", "felt",
  "today", "now", "still", "about", "after", "because", "when", "what",
  "want", "wanna", "need", "like", "get", "got", "some", "something",
  "movie", "movies", "film", "films", "watch", "thinking", "think",
]);

// Fallback: map a mood word to TMDB genre IDs (OR-ed together)
// Genre IDs: 18 Drama, 10749 Romance, 35 Comedy, 27 Horror, 53 Thriller,
// 28 Action, 12 Adventure, 14 Fantasy, 10751 Family, 99 Documentary, 10402 Music
const MOOD_GENRES: Record<string, number[]> = {
  sad: [18, 10749],
  cry: [18, 10749],
  crying: [18, 10749],
  heartbroken: [10749, 18],
  lonely: [18, 10749],
  alone: [18],
  depressed: [18, 35],
  grief: [18],
  happy: [35, 10751],
  excited: [28, 12],
  bored: [12, 28, 35],
  angry: [28, 53],
  scared: [27, 53],
  anxious: [35, 10751],
  stressed: [35, 10751],
  tired: [35, 10751],
  hopeful: [18, 12],
  motivated: [18, 99],
  inspired: [18, 99],
  nostalgic: [10751, 10749],
  love: [10749],
};

const tmdbGet = async (path: string) => {
  const response = await fetch(`${TMDB_CONFIG.BASE_URL}${path}`, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.statusText}`);
  }
  return response.json();
};

/** Turn "I feel sad after my breakup" into ["sad", "breakup", "sad breakup"...] */
export const extractThoughtTerms = (thought: string): string[] => {
  const words = thought
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const unique = Array.from(new Set(words));
  const terms: string[] = [];

  // Short thought: try the whole phrase first (e.g. "break up", "lost my job")
  if (unique.length >= 2 && unique.length <= 3) terms.push(unique.join(" "));

  terms.push(...unique);

  // Cap the number of keyword lookups so we don't spam the API
  return terms.slice(0, 5);
};

export interface ThoughtSearchResult {
  movies: Movie[];
  matchedKeywords: string[]; // shown to the user as chips
}

export const fetchMoviesByThought = async (
  thought: string
): Promise<ThoughtSearchResult> => {
  const terms = extractThoughtTerms(thought);

  // 1) Resolve each term into TMDB keyword IDs (in parallel)
  const keywordResponses = await Promise.all(
    terms.map((term) =>
      tmdbGet(`/search/keyword?query=${encodeURIComponent(term)}&page=1`)
        .then((data) => (data.results ?? []) as { id: number; name: string }[])
        .catch(() => [])
    )
  );

  const keywordMap = new Map<number, string>();
  keywordResponses.forEach((results) => {
    // top 2 matches per term is enough
    results.slice(0, 2).forEach((k) => keywordMap.set(k.id, k.name));
  });

  const keywordIds = Array.from(keywordMap.keys()).slice(0, 8);

  // 2) Discover movies that have ANY of those keywords ("|" = OR, "," = AND)
  let movies: Movie[] = [];
  if (keywordIds.length > 0) {
    const data = await tmdbGet(
      `/discover/movie?with_keywords=${keywordIds.join("|")}` +
        `&sort_by=popularity.desc&vote_count.gte=50&include_adult=false`
    );
    movies = data.results ?? [];
  }

  // 3) Fallback: if keywords gave little, use mood -> genre mapping
  if (movies.length < 5) {
    const genreIds = Array.from(
      new Set(terms.flatMap((t) => MOOD_GENRES[t] ?? []))
    );

    if (genreIds.length > 0) {
      const data = await tmdbGet(
        `/discover/movie?with_genres=${genreIds.join("|")}` +
          `&sort_by=vote_average.desc&vote_count.gte=500&include_adult=false`
      );
      const existing = new Set(movies.map((m) => m.id));
      const extra = ((data.results ?? []) as Movie[]).filter(
        (m) => !existing.has(m.id)
      );
      movies = [...movies, ...extra];
    }
  }

  return {
    movies,
    matchedKeywords: Array.from(keywordMap.values()).slice(0, 6),
  };
};


/* ------------------------------------------------------------------ */
/*  WATCHLIST  (ids come from Appwrite, movie data comes from TMDB)    */
/* ------------------------------------------------------------------ */

/** Fetches full movie info from TMDB for each saved id, keeping the saved order. */
export const fetchWatchlistMovies = async (
  movieIds: number[]
): Promise<Movie[]> => {
  const settled = await Promise.allSettled(
    movieIds.map((id) => fetchMovieDetails(id.toString()))
  );

  const movies: Movie[] = [];
  settled.forEach((result) => {
    // Skip any movie that failed to load instead of breaking the whole list
    if (result.status === "fulfilled") {
      const m = result.value;
      movies.push({
        id: m.id,
        title: m.title,
        adult: m.adult,
        backdrop_path: m.backdrop_path ?? "",
        genre_ids: m.genres?.map((g) => g.id) ?? [],
        original_language: m.original_language,
        original_title: m.original_title,
        overview: m.overview ?? "",
        popularity: m.popularity,
        poster_path: m.poster_path ?? "",
        release_date: m.release_date,
        video: m.video,
        vote_average: m.vote_average,
        vote_count: m.vote_count,
      });
    }
  });

  return movies;
};
