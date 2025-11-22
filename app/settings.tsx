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
      Alert.alert("Başarılı", "Ayarlar kaydedildi!");
      router.back();
    } catch (error) {
      console.error("Ayarlar kaydetme hatası:", error);
      Alert.alert("Hata", "Ayarlar kaydedilemedi.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-purple-600">Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-purple-100 pt-6 pb-6 px-6 border-b border-purple-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-purple-800">Ayarlar</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="gap-6">
          {/* Döngü Süresi */}
          <View className="bg-purple-50 rounded-3xl p-6 border-2 border-purple-200 shadow-lg">
            <Text className="text-lg font-bold text-purple-900 mb-2">
              Döngü Süresi (Gün)
            </Text>
            <Text className="text-sm text-purple-600 mb-4">
              Varsayılan: 28 gün (21-45 gün arası)
            </Text>
            <TextInput
              className="bg-white rounded-2xl p-4 text-xl font-semibold text-purple-900 border-2 border-purple-200"
              value={cycleLength}
              onChangeText={setCycleLength}
              keyboardType="numeric"
              placeholder="28"
            />
          </View>

          {/* Kanama Süresi */}
          <View className="bg-pink-50 rounded-3xl p-6 border-2 border-pink-200 shadow-lg">
            <Text className="text-lg font-bold text-purple-900 mb-2">
              Kanama Süresi (Gün)
            </Text>
            <Text className="text-sm text-purple-600 mb-4">
              Varsayılan: 5 gün (1-10 gün arası)
            </Text>
            <TextInput
              className="bg-white rounded-2xl p-4 text-xl font-semibold text-purple-900 border-2 border-pink-200"
              value={bleedingDays}
              onChangeText={setBleedingDays}
              keyboardType="numeric"
              placeholder="5"
            />
          </View>

          {/* Kaydet Butonu */}
          <TouchableOpacity
            className="rounded-3xl py-6 px-8 shadow-lg border-2 border-purple-300 bg-purple-600"
            onPress={saveSettings}
            activeOpacity={0.8}
          >
            <Text className="text-white text-2xl font-bold text-center tracking-wide">
              💾 Ayarları Kaydet
            </Text>
          </TouchableOpacity>

          {/* Bilgi Kartı */}
          <View className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-200">
            <Text className="text-blue-800 font-semibold mb-2">ℹ️ Bilgi</Text>
            <Text className="text-blue-700 text-sm leading-5">
              Bu ayarlar tahmini regl tarihlerinin hesaplanmasında kullanılır. 
              Kişisel döngünüze göre özelleştirebilirsiniz.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

