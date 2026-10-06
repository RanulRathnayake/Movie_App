import { Client, TablesDB, Databases, ID, Query } from "react-native-appwrite";
import AsyncStorage from "@react-native-async-storage/async-storage";


const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!;
const WATCHLIST_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_WATCHLIST_COLLECTION_ID!;


const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const table = new TablesDB(client);
const database = new Databases(client);

export const updateSearchCount = async (query: string, movie: Movie) => {
  try {
    const result = await table.listRows(DATABASE_ID, COLLECTION_ID, [
      Query.equal("searchTerm", query),
    ]);

    if (result.rows.length > 0) {
      const existingMovie = result.rows[0];
      await table.updateRow(
        DATABASE_ID,
        COLLECTION_ID,
        existingMovie.$id,
        {
          count: existingMovie.count + 1,
        }
      );
    } else {
      await table.createRow(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm: query,
        movie_id: movie.id,
        title: movie.title,
        count: 1,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error("Error updating search count:", error);
    throw error;
  }
};

export const getTrendingMovies = async (): Promise<
  TrendingMovie[] | undefined
> => {
  try {
    const result = await table.listRows(DATABASE_ID, COLLECTION_ID, [
      Query.limit(5),
      Query.orderDesc("count"),
    ]);

    return result.rows as unknown as TrendingMovie[];
  } catch (error) {
    console.error(error);
    return undefined;
  }
};




/* ------------------------------------------------------------------ */
/*  WATCHLIST                                                          */
/* ------------------------------------------------------------------ */

// The app has no login, so each install gets a random id that is stored on
// the device and used to keep one person's watchlist apart from another's.
const USER_ID_KEY = "watchlist_user_id";

const getUserId = async (): Promise<string> => {
  let userId = await AsyncStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = ID.unique();
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

/** Returns the TMDB ids saved in the watchlist, newest first. */
export const getWatchlistMovieIds = async (): Promise<number[]> => {
  const userId = await getUserId();
  const result = await database.listDocuments(
    DATABASE_ID,
    WATCHLIST_COLLECTION_ID,
    [
      Query.equal("user_id", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(100), // Appwrite returns only 25 by default
    ]
  );
  return result.documents.map((doc) => doc.movie_id as number);
};

export const isInWatchlist = async (movieId: number): Promise<boolean> => {
  try {
    const userId = await getUserId();
    const result = await database.listDocuments(
      DATABASE_ID,
      WATCHLIST_COLLECTION_ID,
      [
        Query.equal("user_id", userId),
        Query.equal("movie_id", movieId),
        Query.limit(1),
      ]
    );
    return result.documents.length > 0;
  } catch (error) {
    console.error("Error checking watchlist:", error);
    return false;
  }
};

export const addToWatchlist = async (movieId: number) => {
  const userId = await getUserId();

  // Avoid saving the same movie twice
  if (await isInWatchlist(movieId)) return;

  await database.createDocument(
    DATABASE_ID,
    WATCHLIST_COLLECTION_ID,
    ID.unique(),
    { user_id: userId, movie_id: movieId }
  );
};

export const removeFromWatchlist = async (movieId: number) => {
  const userId = await getUserId();
  const result = await database.listDocuments(
    DATABASE_ID,
    WATCHLIST_COLLECTION_ID,
    [Query.equal("user_id", userId), Query.equal("movie_id", movieId)]
  );

  await Promise.all(
    result.documents.map((doc) =>
      database.deleteDocument(DATABASE_ID, WATCHLIST_COLLECTION_ID, doc.$id)
    )
  );
};