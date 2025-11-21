import { View, Text, StatusBar, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";

export default function Index() {
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
        {/* Takvim Container - Yuvarlatılmış Köşeler */}
        <View className="mx-4 mt-6 mb-6 rounded-3xl overflow-hidden shadow-lg bg-white">
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
            markingType="simple"
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
