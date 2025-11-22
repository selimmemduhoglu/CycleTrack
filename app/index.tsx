import { useState, useEffect, useRef } from "react";
import { View, Text, StatusBar, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { addDays, format, differenceInDays, startOfDay, setHours, setMinutes } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

// Bildirim handler yapılandırması
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// AsyncStorage anahtarları
const STORAGE_KEY = "@CycleTrack:lastPeriodStart";
const NOTIFICATION_ID_KEY = "@CycleTrack:notificationId";

export default function Index() {
  // State tanımlamaları
  const [lastPeriodStart, setLastPeriodStart] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Yükleme durumu
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const cycleLength = 28; // Döngü süresi (gün)
  const bleedingDays = 5; // Kanama süresi (gün)

  // Uygulama açıldığında AsyncStorage'dan veriyi yükle ve bildirim iznini kontrol et
  useEffect(() => {
    loadPeriodStart();
    checkNotificationPermission();
    
    // Bildirim listener'ları
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Bildirim alındı:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Bildirime tıklandı:", response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Bildirim iznini kontrol et
  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationPermission(status === "granted");
  };

  // Bildirim izni iste
  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setNotificationPermission(true);
        Alert.alert("Başarılı", "Bildirim izni verildi!");
        
        // Eğer zaten bir tarih varsa bildirimi planla
        if (lastPeriodStart) {
          scheduleNotification();
        }
      } else {
        Alert.alert("İzin Reddedildi", "Bildirimler için izin gereklidir.");
      }
    } catch (error) {
      console.error("Bildirim izni hatası:", error);
      Alert.alert("Hata", "Bildirim izni alınamadı.");
    }
  };

  // AsyncStorage'dan regl başlangıç tarihini yükle
  const loadPeriodStart = async () => {
    try {
      const savedDate = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDate !== null) {
        setLastPeriodStart(savedDate);
      }
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // lastPeriodStart değiştiğinde AsyncStorage'a kaydet ve bildirimi planla
  useEffect(() => {
    if (!isLoading) {
      savePeriodStart();
      if (lastPeriodStart && notificationPermission) {
        scheduleNotification();
      }
    }
  }, [lastPeriodStart, isLoading, notificationPermission]);

  // AsyncStorage'a regl başlangıç tarihini kaydet
  const savePeriodStart = async () => {
    try {
      if (lastPeriodStart !== null) {
        await AsyncStorage.setItem(STORAGE_KEY, lastPeriodStart);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        // Tarih silindiğinde bildirimi de iptal et
        cancelNotification();
      }
    } catch (error) {
      console.error("Veri kaydetme hatası:", error);
    }
  };

  // Bildirimi planla
  const scheduleNotification = async () => {
    if (!lastPeriodStart) return;

    try {
      // Önce eski bildirimi iptal et
      await cancelNotification();

      // Sonraki tahmini regl tarihini hesapla
      const startDate = new Date(lastPeriodStart);
      const nextPeriodStart = addDays(startDate, cycleLength);
      
      // Bildirim tarihi: Tahmini regl tarihinden 2 gün önce
      const notificationDate = addDays(nextPeriodStart, -2);
      
      // Bugünden önceki bir tarihse bildirim planlama
      const today = startOfDay(new Date());
      if (notificationDate < today) {
        console.log("Bildirim tarihi geçmişte, planlanmadı");
        return;
      }

      // Saat 09:00 için tarih ayarla
      const notificationDateTime = setMinutes(setHours(notificationDate, 9), 0);

      // Bildirim içeriği
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Döngü Takibi",
          body: "Tahmini reglinize 2 gün kaldı.",
          sound: true,
        },
        trigger: notificationDateTime,
      });

      // Bildirim ID'sini kaydet
      await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId.toString());
      console.log("Bildirim planlandı:", notificationId, "Tarih:", format(notificationDateTime, "dd MMMM yyyy HH:mm"));
    } catch (error) {
      console.error("Bildirim planlama hatası:", error);
    }
  };

  // Bildirimi iptal et
  const cancelNotification = async () => {
    try {
      const savedNotificationId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
      if (savedNotificationId) {
        await Notifications.cancelScheduledNotificationAsync(parseInt(savedNotificationId));
        await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
        console.log("Bildirim iptal edildi:", savedNotificationId);
      }
    } catch (error) {
      console.error("Bildirim iptal hatası:", error);
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

  // Yükleme sırasında boş ekran göster (isteğe bağlı)
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-purple-600">Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

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
        {/* Bildirim İzni Butonu */}
        {!notificationPermission && (
          <View className="mx-4 mt-4 mb-2">
            <TouchableOpacity
              className="rounded-xl py-3 px-4 bg-yellow-100 border border-yellow-300"
              onPress={requestNotificationPermission}
              activeOpacity={0.8}
            >
              <Text className="text-yellow-800 font-semibold text-center">
                🔔 Bildirim İzni İste
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bildirim İzni Durumu */}
        {notificationPermission && (
          <View className="mx-4 mt-4 mb-2">
            <View className="rounded-xl py-2 px-4 bg-green-100 border border-green-300">
              <Text className="text-green-800 font-semibold text-center text-sm">
                ✅ Bildirim izni verildi
              </Text>
            </View>
          </View>
        )}

        {/* Bilgi Kartı - Tahmini Sonraki Regl ve Kalan Gün */}
        {lastPeriodStart && (
          <View className="mx-4 mt-4 mb-4 rounded-2xl bg-pink-50 p-5 shadow-md border border-pink-200">
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
