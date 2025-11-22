import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, parseISO, differenceInDays } from "date-fns";

const PERIODS_HISTORY_KEY = "@CycleTrack:periodsHistory";

export default function History() {
  const router = useRouter();
  const [periods, setPeriods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(PERIODS_HISTORY_KEY);
      if (history) {
        const parsed = JSON.parse(history);
        // Tarihleri sırala (en yeni en üstte)
        const sorted = parsed.sort((a: string, b: string) => {
          return new Date(b).getTime() - new Date(a).getTime();
        });
        setPeriods(sorted);
      }
    } catch (error) {
      console.error("Geçmiş yükleme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // İki tarih arasındaki gün sayısını hesapla
  const getDaysBetween = (date1: string, date2: string): number => {
    const d1 = parseISO(date1);
    const d2 = parseISO(date2);
    return Math.abs(differenceInDays(d1, d2));
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
          <Text className="text-3xl font-bold text-purple-800">Geçmiş Döngüler</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {periods.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">📅</Text>
            <Text className="text-xl text-purple-700 font-semibold mb-2">
              Henüz kayıt yok
            </Text>
            <Text className="text-purple-500 text-center">
              Takvimde bir tarih seçerek başlayabilirsiniz
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {periods.map((period, index) => {
              const nextPeriod = periods[index - 1];
              const cycleLength = nextPeriod ? getDaysBetween(period, nextPeriod) : null;
              
              return (
                <View
                  key={period}
                  className="bg-pink-50 rounded-2xl p-5 border-2 border-pink-200 shadow-md"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-lg font-bold text-purple-900">
                      {format(parseISO(period), "dd MMMM yyyy")}
                    </Text>
                    <View className="bg-pink-200 rounded-full px-3 py-1">
                      <Text className="text-xs font-semibold text-pink-800">
                        {format(parseISO(period), "EEEE")}
                      </Text>
                    </View>
                  </View>
                  {cycleLength !== null && (
                    <Text className="text-sm text-purple-600 mt-2">
                      Sonraki döngü: {cycleLength} gün sonra
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

