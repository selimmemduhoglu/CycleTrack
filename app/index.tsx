import { useState, useEffect, useCallback } from "react";
import { View, Text, StatusBar, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { addDays, format, differenceInDays, startOfDay } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";

// AsyncStorage anahtarları
const STORAGE_KEY = "@CycleTrack:lastPeriodStart";
const PERIODS_HISTORY_KEY = "@CycleTrack:periodsHistory";
const SETTINGS_KEY = "@CycleTrack:settings";

// Varsayılan ayarlar
const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_BLEEDING_DAYS = 5;

const { width } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  
  // State tanımlamaları
  const [lastPeriodStart, setLastPeriodStart] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cycleLength, setCycleLength] = useState(DEFAULT_CYCLE_LENGTH);
  const [bleedingDays, setBleedingDays] = useState(DEFAULT_BLEEDING_DAYS);

  // Uygulama açıldığında ve sayfa focus olduğunda verileri yükle
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Verileri yükle
  const loadData = async () => {
    try {
      // Son regl başlangıcını yükle
      const savedDate = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDate !== null) {
        setLastPeriodStart(savedDate);
      }

      // Ayarları yükle
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setCycleLength(settings.cycleLength || DEFAULT_CYCLE_LENGTH);
        setBleedingDays(settings.bleedingDays || DEFAULT_BLEEDING_DAYS);
      } else {
        // Varsayılan ayarları kullan
        setCycleLength(DEFAULT_CYCLE_LENGTH);
        setBleedingDays(DEFAULT_BLEEDING_DAYS);
      }
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // lastPeriodStart değiştiğinde AsyncStorage'a kaydet
  useEffect(() => {
    if (!isLoading) {
      savePeriodStart();
    }
  }, [lastPeriodStart, isLoading]);

  // AsyncStorage'a regl başlangıç tarihini kaydet
  const savePeriodStart = async () => {
    try {
      if (lastPeriodStart !== null) {
        await AsyncStorage.setItem(STORAGE_KEY, lastPeriodStart);
        
        // Geçmişe ekle
        const history = await getPeriodHistory();
        if (!history.includes(lastPeriodStart)) {
          history.push(lastPeriodStart);
          await AsyncStorage.setItem(PERIODS_HISTORY_KEY, JSON.stringify(history));
        }
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Veri kaydetme hatası:", error);
    }
  };

  // Geçmiş döngüleri al
  const getPeriodHistory = async (): Promise<string[]> => {
    try {
      const history = await AsyncStorage.getItem(PERIODS_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      return [];
    }
  };

  // Takvimde güne tıklama işlemi
  const handleDayPress = (day: DateData) => {
    const selectedDate = day.dateString; // YYYY-MM-DD formatında
    setLastPeriodStart(selectedDate);
  };

  // MarkedDates hesaplama - Takvimde işaretlemeler
  const getMarkedDates = () => {
    const markedDates: any = {};

    if (lastPeriodStart) {
      const startDate = new Date(lastPeriodStart);
      
      // Regl başlangıcı ve kanama günlerini işaretle (Koyu Pembe)
      for (let i = 0; i < bleedingDays; i++) {
        const periodDate = addDays(startDate, i);
        const dateKey = format(periodDate, "yyyy-MM-dd");
        markedDates[dateKey] = {
          selected: true,
          selectedColor: "#C2185B", // Koyu Pembe
          selectedTextColor: "#ffffff",
        };
      }

      // Sonraki tahmini regl tarihlerini hesapla ve işaretle (Açık Pembe)
      const nextPeriodStart = addDays(startDate, cycleLength);
      
      // Sonraki döngünün kanama günlerini işaretle
      for (let i = 0; i < bleedingDays; i++) {
        const predictedDate = addDays(nextPeriodStart, i);
        const dateKey = format(predictedDate, "yyyy-MM-dd");
        
        // Eğer bu tarih zaten regl başlangıcı olarak işaretlenmemişse
        if (!markedDates[dateKey]) {
          markedDates[dateKey] = {
            marked: true,
            dotColor: "#FFB6C1", // Açık Pembe
            selected: false,
          };
        }
      }
    }

    return markedDates;
  };

  // Sonraki tahmini regl tarihini hesapla
  const getNextPeriodDate = (): string | null => {
    if (!lastPeriodStart) return null;
    const startDate = new Date(lastPeriodStart);
    const nextPeriod = addDays(startDate, cycleLength);
    return format(nextPeriod, "dd MMMM yyyy");
  };

  // Döngüye kalan günü hesapla
  const getDaysUntilNextPeriod = (): number | null => {
    if (!lastPeriodStart) return null;
    const startDate = new Date(lastPeriodStart);
    const nextPeriod = addDays(startDate, cycleLength);
    const today = startOfDay(new Date());
    const daysLeft = differenceInDays(nextPeriod, today);
    return daysLeft >= 0 ? daysLeft : null;
  };

  const nextPeriodDate = getNextPeriodDate();
  const daysLeft = getDaysUntilNextPeriod();

  // Yükleme sırasında boş ekran göster
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-purple-600 text-lg">Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Başlık Alanı - Modern Tasarım */}
      <View className="bg-purple-200 pt-10 pb-12 px-6 shadow-md">
        <Text className="text-5xl font-extrabold text-purple-900 text-center tracking-tight mb-2">
          Döngü Takibi
        </Text>
        <Text className="text-base text-purple-700 text-center font-medium">
          Sağlığınızı takip edin, kendinizi tanıyın
        </Text>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 30 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Bilgi Kartı - Modern Tasarım */}
        {lastPeriodStart && (
          <View className="mx-5 mt-6 mb-6 rounded-3xl bg-pink-50 p-6 shadow-xl border-2 border-pink-200">
            {nextPeriodDate && (
              <View className="mb-5 pb-5 border-b-2 border-pink-200">
                <View className="flex-row items-center mb-2">
                  <Text className="text-2xl mr-2">📅</Text>
                  <Text className="text-xs text-purple-600 font-bold mb-1 uppercase tracking-wider">
                    Tahmini Sonraki Regl
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-purple-900 leading-tight">
                  {nextPeriodDate}
                </Text>
              </View>
            )}
            {daysLeft !== null && daysLeft >= 0 && (
              <View>
                <View className="flex-row items-center mb-2">
                  <Text className="text-2xl mr-2">⏰</Text>
                  <Text className="text-xs text-purple-600 font-bold mb-1 uppercase tracking-wider">
                    Döngüye Kalan Gün
                  </Text>
                </View>
                <View className="flex-row items-baseline">
                  <Text className="text-5xl font-extrabold text-pink-600 mr-3">
                    {daysLeft}
                  </Text>
                  <Text className="text-xl text-purple-700 font-bold">
                    gün
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Hızlı Erişim Butonları - Büyük ve Belirgin */}
        <View className="mx-5 mb-6">
          <Text className="text-xl font-bold text-purple-900 mb-4 px-1">Hızlı Erişim</Text>
          
          {/* Geçmiş Butonu - Tam Genişlik */}
          <TouchableOpacity
            className="rounded-3xl p-6 mb-4 shadow-lg border-2 border-purple-300 bg-purple-100"
            onPress={() => router.push("/history")}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="bg-purple-200 rounded-2xl p-4 mr-4">
                <Text className="text-4xl">📅</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-purple-900 mb-1">
                  Geçmiş Döngüler
                </Text>
                <Text className="text-sm text-purple-600">
                  Tüm kayıtlarınızı görüntüleyin
                </Text>
              </View>
              <Text className="text-2xl text-purple-400">→</Text>
            </View>
          </TouchableOpacity>

          {/* İstatistikler Butonu - Tam Genişlik */}
          <TouchableOpacity
            className="rounded-3xl p-6 mb-4 shadow-lg border-2 border-pink-300 bg-pink-100"
            onPress={() => router.push("/statistics")}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="bg-pink-200 rounded-2xl p-4 mr-4">
                <Text className="text-4xl">📊</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-pink-900 mb-1">
                  İstatistikler
                </Text>
                <Text className="text-sm text-pink-600">
                  Analiz ve detaylı raporlar
                </Text>
              </View>
              <Text className="text-2xl text-pink-400">→</Text>
            </View>
          </TouchableOpacity>

          {/* Ayarlar Butonu - Tam Genişlik */}
          <TouchableOpacity
            className="rounded-3xl p-6 shadow-lg border-2 border-indigo-300 bg-indigo-100"
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="bg-indigo-200 rounded-2xl p-4 mr-4">
                <Text className="text-4xl">⚙️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-indigo-900 mb-1">
                  Ayarlar
                </Text>
                <Text className="text-sm text-indigo-600">
                  Döngü süresini özelleştirin
                </Text>
              </View>
              <Text className="text-2xl text-indigo-400">→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Takvim Container - Modern Tasarım */}
        <View className="mx-5 mt-2 mb-6 rounded-3xl overflow-hidden shadow-2xl bg-white border-2 border-purple-100">
          <Calendar
            // Tema renkleri - Modern pastel tonlar
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#a855f7', // Eflatun
              selectedDayBackgroundColor: '#C2185B', // Koyu Pembe
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#ec4899',
              dayTextColor: '#4b5563',
              textDisabledColor: '#d1d5db',
              dotColor: '#ec4899',
              selectedDotColor: '#ffffff',
              arrowColor: '#a855f7',
              monthTextColor: '#7c3aed', // Koyu eflatun
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 13,
            }}
            style={{
              borderRadius: 24,
            }}
            markingType="custom"
            markedDates={getMarkedDates()}
            onDayPress={handleDayPress}
            enableSwipeMonths={true}
            hideExtraDays={true}
          />
        </View>

        {/* Regl Başlangıcı Ekle Butonu - Modern Tasarım */}
        <View className="px-5 mb-5">
          <TouchableOpacity
            className="rounded-3xl py-5 px-8 shadow-xl border-2 border-pink-400"
            style={{ backgroundColor: '#FF69B4' }}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-3xl mr-3">➕</Text>
              <Text className="text-white text-xl font-bold tracking-wide">
                Takvimden Tarih Seç
              </Text>
            </View>
            <Text className="text-white text-sm text-center mt-2 opacity-90">
              Takvimde bir güne dokunarak regl başlangıcı ekleyebilirsiniz
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
