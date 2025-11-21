import { useState } from "react";
import { View, Text, StatusBar, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { addDays, format, differenceInDays, startOfDay } from "date-fns";

export default function Index() {
  // State tanımlamaları
  const [lastPeriodStart, setLastPeriodStart] = useState<string | null>(null);
  const cycleLength = 28; // Döngü süresi (gün)
  const bleedingDays = 5; // Kanama süresi (gün)

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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Başlık Alanı - Pastel Pembe/Eflatun */}
      <View className="bg-purple-100 pt-6 pb-8 px-6">
        <Text className="text-4xl font-bold text-purple-700 text-center">
          Döngü Takibi
        </Text>
        <Text className="text-base text-purple-600 text-center mt-2">
          Sağlığınızı takip edin
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Bilgi Kartı - Tahmini Sonraki Regl ve Kalan Gün */}
        {lastPeriodStart && (
          <View className="mx-4 mt-6 mb-4 rounded-2xl bg-pink-50 p-5 shadow-md border border-pink-200">
            {nextPeriodDate && (
              <View className="mb-3">
                <Text className="text-sm text-purple-600 font-semibold mb-1">
                  Tahmini Sonraki Regl
                </Text>
                <Text className="text-xl font-bold text-purple-800">
                  {nextPeriodDate}
                </Text>
              </View>
            )}
            {daysLeft !== null && daysLeft >= 0 && (
              <View>
                <Text className="text-sm text-purple-600 font-semibold mb-1">
                  Döngüye Kalan Gün
                </Text>
                <Text className="text-2xl font-bold text-pink-600">
                  {daysLeft} gün
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Takvim Container - Yuvarlatılmış Köşeler */}
        <View className="mx-4 mt-2 mb-6 rounded-3xl overflow-hidden shadow-lg bg-white">
          <Calendar
            // Tema renkleri - Pastel tonlar
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#a855f7', // Eflatun
              selectedDayBackgroundColor: '#ec4899', // Pembe
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#ec4899',
              dayTextColor: '#6b7280',
              textDisabledColor: '#d1d5db',
              dotColor: '#ec4899',
              selectedDotColor: '#ffffff',
              arrowColor: '#a855f7',
              monthTextColor: '#7c3aed', // Koyu eflatun
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            // Yuvarlatılmış stil için
            style={{
              borderRadius: 24,
            }}
            // Görünüm ayarları
            markingType="custom"
            markedDates={getMarkedDates()}
            onDayPress={handleDayPress}
            enableSwipeMonths={true}
            hideExtraDays={true}
          />
        </View>

        {/* Regl Başlangıcı Ekle Butonu */}
        <View className="px-4">
          <TouchableOpacity
            className="rounded-2xl py-5 px-6 shadow-md"
            style={{ backgroundColor: '#FF69B4' }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-xl font-bold text-center">
              Regl Başlangıcı Ekle
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
