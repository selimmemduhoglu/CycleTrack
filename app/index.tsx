import { View, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 items-center justify-center">
        <Text className="text-3xl font-bold text-blue-600">
          CycleTrack
        </Text>
        <Text className="mt-4 text-lg text-gray-600">
          Hoş geldiniz!
        </Text>
      </View>
    </SafeAreaView>
  );
}

