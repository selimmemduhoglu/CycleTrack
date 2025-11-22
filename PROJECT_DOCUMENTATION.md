# CycleTrack - Döngü Takibi Uygulaması
## Detaylı Proje Dokümantasyonu

---

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Teknoloji Stack](#teknoloji-stack)
3. [Proje Yapısı](#proje-yapısı)
4. [Veri Yapıları ve Storage](#veri-yapıları-ve-storage)
5. [Sayfa Yapıları ve Flow](#sayfa-yapıları-ve-flow)
6. [Route Yapısı](#route-yapısı)
7. [State Management](#state-management)
8. [Özellikler ve İşlevler](#özellikler-ve-işlevler)
9. [Mimari Kararlar](#mimari-kararlar)
10. [Gelecek Geliştirmeler için Notlar](#gelecek-geliştirmeler-için-notlar)

---

## 🎯 Proje Genel Bakış

**CycleTrack**, kadınların adet döngülerini takip etmeleri için geliştirilmiş bir React Native uygulamasıdır. Expo SDK 54, TypeScript, NativeWind (TailwindCSS) ve Expo Router kullanılarak geliştirilmiştir.

### Temel Özellikler
- ✅ Adet başlangıç tarihi kaydetme
- ✅ Takvim üzerinde görselleştirme
- ✅ Tahmini sonraki regl tarihi hesaplama
- ✅ Geçmiş döngüleri görüntüleme
- ✅ İstatistikler (ortalama, en kısa/uzun döngü)
- ✅ Özelleştirilebilir döngü ve kanama süresi
- ✅ Veri kalıcılığı (AsyncStorage)

### Kaldırılan Özellikler
- ❌ Bildirimler (expo-notifications) - Hata nedeniyle kaldırıldı, gelecekte tekrar eklenebilir

---

## 🛠 Teknoloji Stack

### Core
- **React Native**: 0.81.5
- **React**: 19.1.0
- **Expo SDK**: ~54.0.0
- **TypeScript**: ^5.6.0

### Routing & Navigation
- **Expo Router**: ~6.0.15 (File-based routing)

### Styling
- **NativeWind**: ^4.0.1 (TailwindCSS for React Native)
- **TailwindCSS**: ^3.4.0

### Data & Storage
- **@react-native-async-storage/async-storage**: ^2.1.0

### UI Components
- **react-native-calendars**: ^1.1301.0
- **react-native-safe-area-context**: ~5.6.0
- **react-native-screens**: ~4.16.0

### Utilities
- **date-fns**: ^3.0.0 (Tarih işlemleri)

---

## 📁 Proje Yapısı

```
CycleTrack/
├── app/                          # Expo Router dosyaları
│   ├── _layout.tsx              # Root layout (Stack navigator)
│   ├── index.tsx                # Ana sayfa (Takvim ve özet)
│   ├── history.tsx              # Geçmiş döngüler sayfası
│   ├── statistics.tsx           # İstatistikler sayfası
│   └── settings.tsx             # Ayarlar sayfası
├── assets/                      # Statik dosyalar (şu an boş)
├── global.css                   # TailwindCSS global stilleri
├── nativewind-env.d.ts          # NativeWind TypeScript tanımları
├── babel.config.js              # Babel yapılandırması
├── metro.config.js              # Metro bundler yapılandırması (NativeWind için)
├── tailwind.config.js           # TailwindCSS yapılandırması
├── tsconfig.json                # TypeScript yapılandırması
├── app.json                     # Expo yapılandırması
├── package.json                 # Bağımlılıklar
└── PROJECT_DOCUMENTATION.md     # Bu dosya
```

---

## 💾 Veri Yapıları ve Storage

### AsyncStorage Anahtarları

Tüm veriler `@react-native-async-storage/async-storage` kullanılarak saklanır.

#### 1. Son Regl Başlangıcı
```typescript
Key: "@CycleTrack:lastPeriodStart"
Type: string | null
Format: "YYYY-MM-DD" (ISO date string)
Örnek: "2025-11-22"
```

#### 2. Geçmiş Döngüler
```typescript
Key: "@CycleTrack:periodsHistory"
Type: string[] (JSON stringified)
Format: ["YYYY-MM-DD", "YYYY-MM-DD", ...]
Örnek: ["2025-11-22", "2025-10-25", "2025-09-27"]
```

**Not**: Her yeni regl başlangıcı eklendiğinde otomatik olarak bu listeye eklenir. Duplikasyon kontrolü yapılır.

#### 3. Ayarlar
```typescript
Key: "@CycleTrack:settings"
Type: object (JSON stringified)
Format: {
  cycleLength: number,    // 21-45 arası
  bleedingDays: number    // 1-10 arası
}
Örnek: {
  "cycleLength": 28,
  "bleedingDays": 5
}
```

**Varsayılan Değerler**:
- `cycleLength`: 28 gün
- `bleedingDays`: 5 gün

### Veri Yükleme Stratejisi

1. **Uygulama Açılışı**: `useFocusEffect` hook'u ile otomatik yükleme
2. **Sayfa Focus**: Her sayfa focus olduğunda veriler yeniden yüklenir
3. **Veri Değişikliği**: State değiştiğinde otomatik kaydetme (`useEffect`)

---

## 📱 Sayfa Yapıları ve Flow

### 1. Ana Sayfa (`app/index.tsx`)

#### State Yönetimi
```typescript
- lastPeriodStart: string | null      // Son kaydedilen regl başlangıcı
- isLoading: boolean                  // Yükleme durumu
- cycleLength: number                 // Döngü süresi (ayarlardan)
- bleedingDays: number                // Kanama süresi (ayarlardan)
```

#### Flow
1. **Sayfa Açılışı**
   - `useFocusEffect` → `loadData()` çağrılır
   - AsyncStorage'dan `lastPeriodStart` ve `settings` yüklenir
   - `isLoading` false olur

2. **Tarih Seçimi**
   - Kullanıcı takvimde bir güne tıklar
   - `handleDayPress()` → `setLastPeriodStart(selectedDate)`
   - `useEffect` tetiklenir → `savePeriodStart()` çağrılır
   - AsyncStorage'a kaydedilir
   - Geçmiş listesine eklenir (duplikasyon kontrolü ile)

3. **Hesaplamalar**
   - `getNextPeriodDate()`: Son regl + cycleLength
   - `getDaysUntilNextPeriod()`: Bugünden sonraki regle kalan gün
   - `getMarkedDates()`: Takvimde işaretlenecek günler

4. **Takvim İşaretlemeleri**
   - **Koyu Pembe (#C2185B)**: Regl başlangıcı ve kanama günleri
   - **Açık Pembe Dot (#FFB6C1)**: Tahmini sonraki regl günleri

#### UI Bileşenleri
- Başlık alanı (mor arka plan)
- Bilgi kartı (tahmini tarih ve kalan gün)
- Hızlı erişim butonları (3 adet, tam genişlik)
- Takvim (react-native-calendars)
- Alt bilgilendirme butonu

### 2. Geçmiş Sayfası (`app/history.tsx`)

#### State Yönetimi
```typescript
- periods: string[]        // Tüm geçmiş tarihler
- isLoading: boolean       // Yükleme durumu
```

#### Flow
1. **Sayfa Açılışı**
   - `useEffect` → `loadHistory()` çağrılır
   - AsyncStorage'dan `periodsHistory` yüklenir
   - Tarihler sıralanır (en yeni en üstte)

2. **Görüntüleme**
   - Her tarih için kart gösterilir
   - İlk kayıt "YENİ" badge'i ile işaretlenir
   - İki tarih arasındaki gün sayısı hesaplanır ve gösterilir

#### UI Bileşenleri
- Header (geri butonu, başlık, kayıt sayısı)
- Boş durum (kayıt yoksa)
- Tarih kartları (her biri için)

### 3. İstatistikler Sayfası (`app/statistics.tsx`)

#### State Yönetimi
```typescript
- periods: string[]         // Tüm geçmiş tarihler
- lastPeriod: string | null // Son regl başlangıcı
- isLoading: boolean        // Yükleme durumu
```

#### Hesaplama Fonksiyonları

**Ortalama Döngü Süresi**:
```typescript
getAverageCycleLength(): number | null
- En az 2 kayıt gerekli
- Ardışık tarihler arasındaki günler hesaplanır
- Ortalama alınır ve yuvarlanır
```

**En Kısa Döngü**:
```typescript
getShortestCycle(): number | null
- Tüm döngü süreleri arasından minimum değer
```

**En Uzun Döngü**:
```typescript
getLongestCycle(): number | null
- Tüm döngü süreleri arasından maximum değer
```

#### Flow
1. **Sayfa Açılışı**
   - `useEffect` → `loadData()` çağrılır
   - `periodsHistory` ve `lastPeriodStart` yüklenir

2. **Hesaplamalar**
   - Tüm istatistikler hesaplanır
   - Yetersiz veri durumunda null döner

3. **Görüntüleme**
   - Büyük kartlar ile istatistikler gösterilir
   - Boş durum mesajı (yetersiz veri)

#### UI Bileşenleri
- Header
- Toplam kayıt kartı
- Ortalama döngü süresi kartı
- En kısa/uzun döngü kartları (yan yana)
- Son regl kartı

### 4. Ayarlar Sayfası (`app/settings.tsx`)

#### State Yönetimi
```typescript
- cycleLength: string      // Input string olarak (validasyon için)
- bleedingDays: string     // Input string olarak
- isLoading: boolean       // Yükleme durumu
```

#### Validasyon Kuralları
- **Döngü Süresi**: 21-45 gün arası
- **Kanama Süresi**: 1-10 gün arası
- Geçersiz değerlerde Alert gösterilir

#### Flow
1. **Sayfa Açılışı**
   - `useEffect` → `loadSettings()` çağrılır
   - Mevcut ayarlar yüklenir, yoksa varsayılanlar kullanılır

2. **Ayarları Kaydetme**
   - `saveSettings()` çağrılır
   - Validasyon yapılır
   - AsyncStorage'a kaydedilir
   - Başarı mesajı gösterilir
   - Ana sayfaya dönülür

3. **Ana Sayfada Güncelleme**
   - `useFocusEffect` sayesinde ayarlar otomatik yeniden yüklenir
   - Hesaplamalar yeni ayarlara göre güncellenir

#### UI Bileşenleri
- Header
- Döngü süresi input kartı
- Kanama süresi input kartı
- Kaydet butonu
- Bilgi kartı

---

## 🗺 Route Yapısı

Expo Router file-based routing kullanır.

### Route'lar

| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/` | `app/index.tsx` | Ana sayfa |
| `/history` | `app/history.tsx` | Geçmiş döngüler |
| `/statistics` | `app/statistics.tsx` | İstatistikler |
| `/settings` | `app/settings.tsx` | Ayarlar |

### Navigation

```typescript
import { useRouter } from "expo-router";

const router = useRouter();

// Sayfaya git
router.push("/history");
router.push("/statistics");
router.push("/settings");

// Geri dön
router.back();
```

### Layout Yapılandırması

`app/_layout.tsx`:
- Stack navigator kullanılır
- Header gizlidir (her sayfa kendi header'ını yönetir)
- Global CSS import edilir

---

## 🔄 State Management

### Local State (useState)
Her sayfa kendi state'ini yönetir:
- Form input'ları
- Loading durumları
- UI state'leri

### Persistent State (AsyncStorage)
Kalıcı veriler AsyncStorage'da saklanır:
- Son regl başlangıcı
- Geçmiş döngüler
- Ayarlar

### State Senkronizasyonu

1. **Sayfa Focus**: `useFocusEffect` ile otomatik yeniden yükleme
2. **Veri Değişikliği**: `useEffect` ile otomatik kaydetme
3. **Ayarlar Değişikliği**: Ana sayfada `useFocusEffect` ile otomatik güncelleme

---

## ⚙️ Özellikler ve İşlevler

### 1. Regl Başlangıcı Kaydetme
- Takvimde güne tıklayarak kayıt
- Otomatik AsyncStorage'a kaydetme
- Geçmiş listesine ekleme (duplikasyon kontrolü)

### 2. Takvim Görselleştirme
- **Koyu Pembe**: Mevcut regl günleri (başlangıç + kanama süresi)
- **Açık Pembe Dot**: Tahmini sonraki regl günleri
- Swipe ile ay değiştirme

### 3. Tahmin Hesaplama
- Son regl başlangıcı + döngü süresi = Sonraki tahmini tarih
- Bugünden sonraki regle kalan gün hesaplama

### 4. İstatistikler
- Toplam kayıt sayısı
- Ortalama döngü süresi
- En kısa döngü
- En uzun döngü
- Son regl başlangıcı

### 5. Özelleştirme
- Döngü süresi (21-45 gün)
- Kanama süresi (1-10 gün)
- Validasyon ile güvenli kayıt

---

## 🏗 Mimari Kararlar

### 1. File-based Routing
- Expo Router kullanıldı
- Dosya yapısı route yapısını belirler
- Type-safe navigation

### 2. NativeWind (TailwindCSS)
- Utility-first CSS
- Responsive tasarım
- Tutarlı stil sistemi

### 3. AsyncStorage
- Basit key-value storage
- JSON serialization
- Senkron API (async/await)

### 4. Date-fns
- Hafif ve modüler
- TypeScript desteği
- Tarih formatlama ve hesaplama

### 5. TypeScript
- Tip güvenliği
- Daha iyi IDE desteği
- Hata önleme

---

## 🚀 Gelecek Geliştirmeler için Notlar

### 1. Bildirimler (expo-notifications)
**Durum**: Kaldırıldı (hata nedeniyle)
**Gelecek Plan**: 
- Development build kullanılmalı (Expo Go'da çalışmıyor)
- Local notifications için yeniden implementasyon
- Push notifications için backend gerekli

**Gerekli Veriler**:
```typescript
// Bildirim planlama için
{
  notificationId: string,
  scheduledDate: Date,
  periodStartDate: string
}
```

### 2. Veri Yedekleme
**Öneri**: 
- Cloud backup (Firebase, Supabase)
- Export/Import özelliği
- CSV/JSON export

**Gerekli Veriler**:
```typescript
// Export formatı
{
  version: "1.0.0",
  exportDate: string,
  settings: Settings,
  periods: string[],
  lastPeriodStart: string | null
}
```

### 3. Çoklu Döngü Takibi
**Öneri**: 
- Birden fazla kullanıcı profili
- Farklı döngü tipleri

**Gerekli Veri Yapısı**:
```typescript
interface UserProfile {
  id: string,
  name: string,
  cycleLength: number,
  bleedingDays: number,
  periods: string[],
  lastPeriodStart: string | null
}
```

### 4. Semptom Takibi
**Öneri**: 
- Ağrı seviyesi
- Ruh hali
- Diğer semptomlar

**Gerekli Veri Yapısı**:
```typescript
interface PeriodEntry {
  date: string,
  symptoms?: {
    painLevel?: number,      // 1-10
    mood?: string,           // "happy", "sad", "anxious"
    notes?: string
  }
}
```

### 5. İstatistik Geliştirmeleri
**Öneri**:
- Grafikler (react-native-chart-kit)
- Trend analizi
- Düzensizlik uyarıları

### 6. Tema Desteği
**Öneri**:
- Dark mode
- Renk özelleştirme
- Font boyutu ayarı

**Gerekli Veri Yapısı**:
```typescript
interface ThemeSettings {
  mode: "light" | "dark",
  primaryColor: string,
  fontSize: "small" | "medium" | "large"
}
```

### 7. Çoklu Dil Desteği
**Öneri**: 
- i18n (react-i18next)
- Türkçe, İngilizce

### 8. Veri Analizi
**Öneri**:
- Döngü düzensizliği tespiti
- Tahmin doğruluğu analizi
- Pattern recognition

---

## 📊 Veri Formatları Özeti

### AsyncStorage Keys
```typescript
const STORAGE_KEYS = {
  LAST_PERIOD_START: "@CycleTrack:lastPeriodStart",
  PERIODS_HISTORY: "@CycleTrack:periodsHistory",
  SETTINGS: "@CycleTrack:settings"
};
```

### Settings Format
```typescript
interface Settings {
  cycleLength: number;    // 21-45
  bleedingDays: number;   // 1-10
}
```

### Period History Format
```typescript
type PeriodHistory = string[];  // ["YYYY-MM-DD", ...]
```

### Date Format
```typescript
// Tüm tarihler ISO formatında: "YYYY-MM-DD"
// Örnek: "2025-11-22"
```

---

## 🔧 Önemli Notlar

### 1. Babel Yapılandırması
- NativeWind 4 için özel yapılandırma gerekli
- `babel.config.js` sadece `babel-preset-expo` içerir
- NativeWind Metro config'de işlenir

### 2. Metro Yapılandırması
- `metro.config.js` NativeWind için `withNativeWind` wrapper'ı kullanır
- `global.css` input olarak verilir

### 3. TypeScript
- Strict mode açık
- NativeWind types import edilmiş

### 4. Expo SDK 54
- React 19.1.0 kullanılıyor
- React Native 0.81.5
- Expo Router 6.0.15

### 5. Platform Desteği
- iOS: Destekleniyor
- Android: Destekleniyor
- Web: Destekleniyor (Metro bundler)

---

## 📝 Kod Örnekleri

### Yeni Sayfa Ekleme
```typescript
// app/new-page.tsx
import { View, Text } from "react-native";
import { useRouter } from "expo-router";

export default function NewPage() {
  const router = useRouter();
  
  return (
    <View>
      <Text>Yeni Sayfa</Text>
    </View>
  );
}
```

### AsyncStorage Kullanımı
```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

// Kaydet
await AsyncStorage.setItem("key", JSON.stringify(data));

// Yükle
const data = await AsyncStorage.getItem("key");
const parsed = data ? JSON.parse(data) : null;

// Sil
await AsyncStorage.removeItem("key");
```

### Tarih Hesaplama
```typescript
import { addDays, format, differenceInDays } from "date-fns";

// Tarih ekleme
const nextDate = addDays(new Date("2025-11-22"), 28);

// Formatlama
const formatted = format(nextDate, "dd MMMM yyyy");

// Gün farkı
const days = differenceInDays(date1, date2);
```

---

## 🐛 Bilinen Sorunlar

1. **Bildirimler**: Expo Go'da çalışmıyor, development build gerekli
2. **Locale**: date-fns locale desteği eklenmedi (Türkçe tarih formatları için)

---

## 📞 İletişim ve Destek

Bu dokümantasyon, projeye 1 ay sonra devam etmek için gerekli tüm bilgileri içermektedir. 

**Önemli**: Yeni bir model ile devam ederken:
1. Bu dokümantasyonu okuyun
2. Veri formatlarını kontrol edin
3. AsyncStorage anahtarlarını değiştirmeyin
4. Route yapısını koruyun
5. TypeScript tiplerini kullanın

---

**Son Güncelleme**: 2025-11-22
**Versiyon**: 1.0.0
**Expo SDK**: 54.0.0

