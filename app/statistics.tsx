import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseISO, differenceInDays, format } from "date-fns";

const PERIODS_HISTORY_KEY = "@CycleTrack:periodsHistory";
const STORAGE_KEY = "@CycleTrack:lastPeriodStart";

const { width } = Dimensions.get("window");

export default function Statistics() {
  const router = useRouter();
  const [periods, setPeriods] = useState<string[]>([]);
  const [lastPeriod, setLastPeriod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const history = await AsyncStorage.getItem(PERIODS_HISTORY_KEY);
      const last = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (history) {
        const parsed = JSON.parse(history);
        setPeriods(parsed.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime()));
      }
      if (last) {
        setLastPeriod(last);
      }
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ortalama döngü süresini hesapla
  const getAverageCycleLength = (): number | null => {
    if (periods.length < 2) return null;
    
    const cycles: number[] = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const days = Math.abs(differenceInDays(parseISO(periods[i]), parseISO(periods[i + 1])));
      cycles.push(days);
    }
    
    if (cycles.length === 0) return null;
    const sum = cycles.reduce((a, b) => a + b, 0);
    return Math.round(sum / cycles.length);
  };

  // En kısa döngü
  const getShortestCycle = (): number | null => {
    if (periods.length < 2) return null;
    
    const cycles: number[] = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const days = Math.abs(differenceInDays(parseISO(periods[i]), parseISO(periods[i + 1])));
      cycles.push(days);
    }
    
    return cycles.length > 0 ? Math.min(...cycles) : null;
  };

  // En uzun döngü
  const getLongestCycle = (): number | null => {
    if (periods.length < 2) return null;
    
    const cycles: number[] = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const days = Math.abs(differenceInDays(parseISO(periods[i]), parseISO(periods[i + 1])));
      cycles.push(days);
    }
    
    return cycles.length > 0 ? Math.max(...cycles) : null;
  };

  // Toplam kayıt sayısı
  const totalRecords = periods.length;

  const avgCycle = getAverageCycleLength();
  const shortestCycle = getShortestCycle();
  const longestCycle = getLongestCycle();

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
            <Text className="text-3xl font-extrabold text-purple-900">İstatistikler</Text>
            <Text className="text-sm text-purple-700 mt-1">Detaylı analiz</Text>
          </View>
          <View className="w-12" />
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {totalRecords === 0 ? (
          <View className="items-center justify-center py-20">
            <View className="bg-purple-100 rounded-full p-8 mb-6">
              <Text className="text-6xl">📊</Text>
            </View>
            <Text className="text-2xl text-purple-900 font-bold mb-3">
              Henüz yeterli veri yok
            </Text>
            <Text className="text-purple-600 text-center text-base leading-6 max-w-xs">
              Daha fazla kayıt ekleyerek istatistikleri görebilirsiniz. 
              En az 2 kayıt gereklidir.
            </Text>
          </View>
        ) : (
          <View className="gap-5">
            {/* Toplam Kayıt - Büyük Kart */}
            <View className="bg-purple-50 rounded-3xl p-7 border-2 border-purple-200 shadow-xl">
              <View className="flex-row items-center mb-4">
                <Text className="text-3xl mr-3">📈</Text>
                <Text className="text-sm text-purple-600 font-bold uppercase tracking-wider">
                  Toplam Kayıt
                </Text>
              </View>
              <View className="flex-row items-baseline">
                <Text className="text-6xl font-extrabold text-purple-900 mr-3">
                  {totalRecords}
                </Text>
                <Text className="text-xl text-purple-700 font-semibold">
                  kayıt
                </Text>
              </View>
            </View>

            {/* Ortalama Döngü Süresi */}
            {avgCycle !== null && (
              <View className="bg-pink-50 rounded-3xl p-7 border-2 border-pink-200 shadow-xl">
                <View className="flex-row items-center mb-4">
                  <Text className="text-3xl mr-3">📊</Text>
                  <Text className="text-sm text-purple-600 font-bold uppercase tracking-wider">
                    Ortalama Döngü Süresi
                  </Text>
                </View>
                <View className="flex-row items-baseline">
                  <Text className="text-6xl font-extrabold text-pink-700 mr-3">
                    {avgCycle}
                  </Text>
                  <Text className="text-xl text-purple-700 font-semibold">
                    gün
                  </Text>
                </View>
              </View>
            )}

            {/* En Kısa ve En Uzun Döngü - Yan Yana */}
            {shortestCycle !== null && longestCycle !== null && (
              <View className="flex-row gap-4">
                <View className="flex-1 bg-green-50 rounded-3xl p-6 border-2 border-green-200 shadow-lg">
                  <View className="flex-row items-center mb-3">
                    <Text className="text-2xl mr-2">⬇️</Text>
                    <Text className="text-xs text-green-600 font-bold uppercase tracking-wide">
                      En Kısa
                    </Text>
                  </View>
                  <Text className="text-4xl font-extrabold text-green-800 mb-1">
                    {shortestCycle}
                  </Text>
                  <Text className="text-sm text-green-600 font-semibold">gün</Text>
                </View>
                <View className="flex-1 bg-orange-50 rounded-3xl p-6 border-2 border-orange-200 shadow-lg">
                  <View className="flex-row items-center mb-3">
                    <Text className="text-2xl mr-2">⬆️</Text>
                    <Text className="text-xs text-orange-600 font-bold uppercase tracking-wide">
                      En Uzun
                    </Text>
                  </View>
                  <Text className="text-4xl font-extrabold text-orange-800 mb-1">
                    {longestCycle}
                  </Text>
                  <Text className="text-sm text-orange-600 font-semibold">gün</Text>
                </View>
              </View>
            )}

            {/* Son Regl */}
            {lastPeriod && (
              <View className="bg-blue-50 rounded-3xl p-7 border-2 border-blue-200 shadow-xl">
                <View className="flex-row items-center mb-4">
                  <Text className="text-3xl mr-3">📅</Text>
                  <Text className="text-sm text-blue-600 font-bold uppercase tracking-wider">
                    Son Regl Başlangıcı
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-blue-900">
                  {format(parseISO(lastPeriod), "dd MMMM yyyy")}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
