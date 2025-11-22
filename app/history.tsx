import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
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
            <Text className="text-3xl font-extrabold text-purple-900">Geçmiş Döngüler</Text>
            <Text className="text-sm text-purple-700 mt-1">{periods.length} kayıt</Text>
          </View>
          <View className="w-12" />
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {periods.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View className="bg-purple-100 rounded-full p-8 mb-6">
              <Text className="text-6xl">📅</Text>
            </View>
            <Text className="text-2xl text-purple-900 font-bold mb-3">
              Henüz kayıt yok
            </Text>
            <Text className="text-purple-600 text-center text-base leading-6 max-w-xs">
              Takvimde bir tarih seçerek başlayabilirsiniz. 
              Kayıtlarınız burada görünecek.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {periods.map((period, index) => {
              const nextPeriod = periods[index - 1];
              const cycleLength = nextPeriod ? getDaysBetween(period, nextPeriod) : null;
              const isRecent = index === 0;
              
              return (
                <View
                  key={period}
                  className={`rounded-3xl p-6 shadow-lg border-2 ${
                    isRecent 
                      ? 'bg-pink-50 border-pink-300' 
                      : 'bg-purple-50 border-purple-200'
                  }`}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Text className="text-2xl mr-2">🌸</Text>
                        <Text className="text-lg font-bold text-purple-900">
                          {format(parseISO(period), "dd MMMM yyyy")}
                        </Text>
                      </View>
                      <View className="bg-purple-200 rounded-full px-4 py-1.5 self-start mt-2">
                        <Text className="text-xs font-semibold text-purple-800">
                          {format(parseISO(period), "EEEE")}
                        </Text>
                      </View>
                    </View>
                    {isRecent && (
                      <View className="bg-pink-300 rounded-full px-3 py-1">
                        <Text className="text-xs font-bold text-pink-900">YENİ</Text>
                      </View>
                    )}
                  </View>
                  {cycleLength !== null && (
                    <View className="mt-3 pt-3 border-t border-purple-200">
                      <View className="flex-row items-center">
                        <Text className="text-purple-600 text-sm font-semibold mr-2">
                          Sonraki döngü:
                        </Text>
                        <Text className="text-purple-900 font-bold text-base">
                          {cycleLength} gün sonra
                        </Text>
                      </View>
                    </View>
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
