import { useState, useEffect, useCallback } from "react";
import { View, Text, StatusBar, TouchableOpacity, ScrollView } from "react-native";
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
      <View className="bg-purple-200 pt-8 pb-10 px-6">
        <Text className="text-5xl font-extrabold text-purple-800 text-center tracking-tight">
          Döngü Takibi
        </Text>
        <Text className="text-base text-purple-600 text-center mt-3 font-medium">
          Sağlığınızı takip edin, kendinizi tanıyın
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* Bilgi Kartı - Modern Tasarım */}
        {lastPeriodStart && (
          <View className="mx-5 mt-6 mb-5 rounded-3xl bg-pink-50 p-6 shadow-xl border-2 border-pink-200">
            {nextPeriodDate && (
              <View className="mb-4 pb-4 border-b border-pink-200">
                <Text className="text-xs text-purple-500 font-semibold mb-2 uppercase tracking-wide">
                  Tahmini Sonraki Regl
                </Text>
                <Text className="text-2xl font-bold text-purple-900">
                  {nextPeriodDate}
                </Text>
              </View>
            )}
            {daysLeft !== null && daysLeft >= 0 && (
              <View>
                <Text className="text-xs text-purple-500 font-semibold mb-2 uppercase tracking-wide">
                  Döngüye Kalan Gün
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-4xl font-extrabold text-pink-600 mr-2">
                    {daysLeft}
                  </Text>
                  <Text className="text-lg text-purple-700 font-semibold">
                    gün
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Hızlı Erişim Butonları */}
        <View className="flex-row mx-5 mb-5 gap-3">
          <TouchableOpacity
            className="flex-1 rounded-2xl bg-purple-100 p-4 border-2 border-purple-200"
            onPress={() => router.push("/history")}
            activeOpacity={0.7}
          >
            <Text className="text-center text-purple-800 font-bold text-sm">
              📅 Geçmiş
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-2xl bg-pink-100 p-4 border-2 border-pink-200"
            onPress={() => router.push("/statistics")}
            activeOpacity={0.7}
          >
            <Text className="text-center text-pink-800 font-bold text-sm">
              📊 İstatistikler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-2xl bg-purple-100 p-4 border-2 border-purple-200"
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
          >
            <Text className="text-center text-purple-800 font-bold text-sm">
              ⚙️ Ayarlar
            </Text>
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
            className="rounded-3xl py-6 px-8 shadow-lg border-2 border-pink-300"
            style={{ backgroundColor: '#FF69B4' }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-2xl font-bold text-center tracking-wide">
              ➕ Regl Başlangıcı Ekle
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
