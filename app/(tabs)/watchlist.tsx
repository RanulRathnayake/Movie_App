import { useCallback, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Image } from "react-native";
import { useFocusEffect } from "expo-router";

import { images } from "@/constants/images";
import { icons } from "@/constants/icons";

import { fetchWatchlistMovies } from "@/services/api";
import { getWatchlistMovieIds } from "@/services/appwrite";

import MovieDisplayCard from "@/components/MovieCard";

const Watchlist = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadWatchlist = async () => {
    try {
      setError(null);
      // 1) saved ids from Appwrite  2) movie details from TMDB
      const ids = await getWatchlistMovieIds();
      const data = await fetchWatchlistMovies(ids);
      setMovies(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload every time the tab comes into focus, so a movie saved
  // on the details page shows up here straight away
  useFocusEffect(
    useCallback(() => {
      loadWatchlist();
    }, [])
  );

  return (
    <View className="flex-1 bg-primary">
      <Image
        source={images.bg}
        className="flex-1 absolute w-full z-0"
        resizeMode="cover"
      />

      <FlatList
        className="px-5"
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MovieDisplayCard {...item} />}
        numColumns={3}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          gap: 16,
          marginVertical: 16,
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadWatchlist();
        }}
        ListHeaderComponent={
          <>
            <View className="w-full flex-row justify-center mt-20 items-center">
              <Image source={icons.logo} className="w-12 h-10" />
            </View>

            <Text className="text-white text-xl font-bold mt-6">
              My Watchlist
            </Text>
            <Text className="text-light-300 text-sm mt-1">
              {movies.length > 0
                ? `${movies.length} ${movies.length === 1 ? "movie" : "movies"} waiting for movie night`
                : "Movies you save will show up here"}
            </Text>

            {loading && (
              <ActivityIndicator
                size="large"
                color="#0000ff"
                className="my-5"
              />
            )}

            {error && (
              <Text className="text-red-500 my-3">Error: {error.message}</Text>
            )}
          </>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View className="mt-10 px-5">
              <Text className="text-center text-gray-500">
                Your watchlist is empty. Open any movie and tap the heart to
                save it.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default Watchlist;
