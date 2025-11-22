import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "@CycleTrack:settings";
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_BLEEDING_DAYS = 5;

export default function Settings() {
  const router = useRouter();
  const [cycleLength, setCycleLength] = useState<string>(DEFAULT_CYCLE_LENGTH.toString());
  const [bleedingDays, setBleedingDays] = useState<string>(DEFAULT_BLEEDING_DAYS.toString());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setCycleLength(settings.cycleLength?.toString() || DEFAULT_CYCLE_LENGTH.toString());
        setBleedingDays(settings.bleedingDays?.toString() || DEFAULT_BLEEDING_DAYS.toString());
      }
    } catch (error) {
      console.error("Ayarlar yükleme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const cycle = parseInt(cycleLength);
      const bleeding = parseInt(bleedingDays);

      // Validasyon
      if (isNaN(cycle) || cycle < 21 || cycle > 45) {
        Alert.alert("Hata", "Döngü süresi 21-45 gün arasında olmalıdır.");
        return;
      }

      if (isNaN(bleeding) || bleeding < 1 || bleeding > 10) {
        Alert.alert("Hata", "Kanama süresi 1-10 gün arasında olmalıdır.");
        return;
      }

      const settings = {
        cycleLength: cycle,
        bleedingDays: bleeding,
      };

      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      Alert.alert("✅ Başarılı", "Ayarlar kaydedildi!", [
        { text: "Tamam", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Ayarlar kaydetme hatası:", error);
      Alert.alert("❌ Hata", "Ayarlar kaydedilemedi.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-purple-600 text-lg">Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header - Modern Tasarım */}
      <View className="bg-purple-200 pt-8 pb-6 px-6 border-b-2 border-purple-300 shadow-md">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="bg-white rounded-full p-3 shadow-md"
            activeOpacity={0.7}
          >
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-3xl font-extrabold text-purple-900">Ayarlar</Text>
            <Text className="text-sm text-purple-700 mt-1">Özelleştirme</Text>
          </View>
          <View className="w-12" />
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-6">
          {/* Döngü Süresi - Modern Kart */}
          <View className="bg-purple-50 rounded-3xl p-6 border-2 border-purple-200 shadow-lg">
            <View className="flex-row items-center mb-4">
              <Text className="text-3xl mr-3">🔄</Text>
              <View className="flex-1">
                <Text className="text-lg font-bold text-purple-900 mb-1">
                  Döngü Süresi
                </Text>
                <Text className="text-sm text-purple-600">
                  Varsayılan: 28 gün (21-45 gün arası)
                </Text>
              </View>
            </View>
            <TextInput
              className="bg-white rounded-2xl p-5 text-2xl font-bold text-purple-900 border-2 border-purple-300 text-center"
              value={cycleLength}
              onChangeText={setCycleLength}
              keyboardType="numeric"
              placeholder="28"
              placeholderTextColor="#a78bfa"
            />
          </View>

          {/* Kanama Süresi - Modern Kart */}
          <View className="bg-pink-50 rounded-3xl p-6 border-2 border-pink-200 shadow-lg">
            <View className="flex-row items-center mb-4">
              <Text className="text-3xl mr-3">🩸</Text>
              <View className="flex-1">
                <Text className="text-lg font-bold text-purple-900 mb-1">
                  Kanama Süresi
                </Text>
                <Text className="text-sm text-purple-600">
                  Varsayılan: 5 gün (1-10 gün arası)
                </Text>
              </View>
            </View>
            <TextInput
              className="bg-white rounded-2xl p-5 text-2xl font-bold text-purple-900 border-2 border-pink-300 text-center"
              value={bleedingDays}
              onChangeText={setBleedingDays}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor="#f9a8d4"
            />
          </View>

          {/* Kaydet Butonu - Modern Tasarım */}
          <TouchableOpacity
            className="rounded-3xl py-6 px-8 shadow-xl border-2 border-purple-400 bg-purple-600"
            onPress={saveSettings}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-3xl mr-3">💾</Text>
              <Text className="text-white text-2xl font-bold tracking-wide">
                Ayarları Kaydet
              </Text>
            </View>
          </TouchableOpacity>

          {/* Bilgi Kartı - Modern Tasarım */}
          <View className="bg-blue-50 rounded-3xl p-6 border-2 border-blue-200 shadow-md">
            <View className="flex-row items-center mb-3">
              <Text className="text-2xl mr-3">ℹ️</Text>
              <Text className="text-blue-800 font-bold text-base">Bilgi</Text>
            </View>
            <Text className="text-blue-700 text-sm leading-6">
              Bu ayarlar tahmini regl tarihlerinin hesaplanmasında kullanılır. 
              Kişisel döngünüze göre özelleştirebilirsiniz. Değişiklikler hemen uygulanır.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
