import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Keyboard,
} from "react-native";

import { images } from "@/constants/images";
import { icons } from "@/constants/icons";

import { fetchMoviesByThought } from "@/services/api";
import {
  SavedThought,
  getThoughts,
  saveThought,
  deleteThought,
  clearThoughts,
} from "@/services/thoughtHistory";

import MovieDisplayCard from "@/components/MovieCard";

const Thoughts = () => {
  const [thought, setThought] = useState("");
  const [activeThought, setActiveThought] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [history, setHistory] = useState<SavedThought[]>([]);

  // Load remembered thoughts when the screen mounts
  useEffect(() => {
    getThoughts().then(setHistory);
  }, []);

  const runSearch = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    Keyboard.dismiss();
    setThought(clean);
    setActiveThought(clean);
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await fetchMoviesByThought(clean);
      setMovies(result.movies);
      setMatchedKeywords(result.matchedKeywords);

      // Remember what the user typed
      const updated = await saveThought(clean);
      setHistory(updated);
    } catch (err) {
      setMovies([]);
      setMatchedKeywords([]);
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setHistory(await deleteThought(id));
  };

  const handleClearAll = async () => {
    await clearThoughts();
    setHistory([]);
  };

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
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <View className="w-full flex-row justify-center mt-20 items-center">
              <Image source={icons.logo} className="w-12 h-10" />
            </View>

            <Text className="text-white text-xl font-bold mt-6">
              How are you feeling?
            </Text>
            <Text className="text-light-300 text-sm mt-1">
              Tell us what's on your mind and we'll find films that fit.
            </Text>

            {/* Thought input */}
            <View className="bg-dark-200 rounded-2xl px-5 py-4 mt-4">
              <TextInput
                value={thought}
                onChangeText={setThought}
                placeholder="e.g. I'm sad because of my breakup..."
                placeholderTextColor="#A8B5DB"
                className="text-white min-h-[60px]"
                multiline
                textAlignVertical="top"
                maxLength={200}
              />
            </View>

            <TouchableOpacity
              onPress={() => runSearch(thought)}
              disabled={loading || !thought.trim()}
              className={`rounded-full py-4 mt-3 items-center ${
                thought.trim() ? "bg-accent" : "bg-dark-200"
              }`}
            >
              <Text className="text-white font-bold">Find films</Text>
            </TouchableOpacity>

            {/* Remembered thoughts */}
            {history.length > 0 && (
              <View className="mt-6">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white font-bold">Your past thoughts</Text>
                  <TouchableOpacity onPress={handleClearAll}>
                    <Text className="text-light-300 text-xs">Clear all</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row flex-wrap gap-2 mt-3">
                  {history.map((item) => (
                    <View
                      key={item.id}
                      className="flex-row items-center bg-dark-200 rounded-full pl-4 pr-2 py-2"
                    >
                      <TouchableOpacity onPress={() => runSearch(item.text)}>
                        <Text
                          className="text-light-200 text-xs max-w-[220px]"
                          numberOfLines={1}
                        >
                          {item.text}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        hitSlop={8}
                        className="ml-2 px-2"
                      >
                        <Text className="text-light-300 text-xs">✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

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

            {!loading && !error && hasSearched && movies.length > 0 && (
              <View className="mt-6">
                <Text className="text-xl text-white font-bold">
                  Films for{" "}
                  <Text className="text-accent">"{activeThought}"</Text>
                </Text>

                {matchedKeywords.length > 0 && (
                  <Text className="text-light-300 text-xs mt-1">
                    Matched themes: {matchedKeywords.join(", ")}
                  </Text>
                )}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View className="mt-10 px-5">
              <Text className="text-center text-gray-500">
                {hasSearched
                  ? "No films matched that thought. Try different words, like \"heartbreak\" or \"friendship\"."
                  : "Write a thought above to get film suggestions"}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default Thoughts;
