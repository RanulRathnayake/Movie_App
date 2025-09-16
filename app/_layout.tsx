import { Stack } from "expo-router";
import './globals.css';
import { StatusBar } from "react-native";

export default function RootLayout() {
  return (<>
    <StatusBar hidden={true}/>
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "" }} />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, title: ""}} />
      <Stack.Screen
        name="movie/[id]"
        options={{ headerShown: false, title: "" }} />
    </Stack>
  </>
  );
}
