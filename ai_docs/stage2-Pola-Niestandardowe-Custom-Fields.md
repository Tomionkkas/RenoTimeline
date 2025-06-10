# Plan Implementacji: Pola Niestandardowe (Custom Fields)

## Cel

Celem tego zadania jest sfinalizowanie implementacji systemu pól niestandardowych w aplikacji Renotl. Funkcjonalność ta pozwoli użytkownikom na dodawanie własnych pól do zadań i projektów (np. pola tekstowe, listy wyboru, daty, liczby), aby dostosować aplikację do specyficznych potrzeb organizacji lub projektów.

**Status:** Rozpoczęte - w oknie dialogowym szczegółów zadania istnieje już przykładowa sekcja pól niestandardowych, którą należy rozbudować i w pełni zintegrować z systemem.

---

## Analiza Obecnego Stanu

### Co już zostało zaimplementowane:
- Podstawowa sekcja "Custom Fields" w komponencie szczegółów zadania
- Interfejs użytkownika z placeholder'ami

### Co trzeba uzupełnić:
- Model danych dla pól niestandardowych w bazie danych
- Logika zarządzania polami niestandardowymi (tworzenie, edycja, usuwanie)
- Integracja z formularzami zadań i projektów
- System walidacji dla różnych typów pól
- Interfejs zarządzania szablonami pól niestandardowych

---

## Kroki Implementacji

### 1. Projektowanie Modelu Danych

**Zadanie:** Stworzenie struktury tabel w bazie danych dla systemu pól niestandardowych.

**Szczegóły:**
- Utworzymy tabelę `custom_field_definitions` przechowującą definicje pól:
  - `id` (UUID, primary key)
  - `project_id` (UUID, foreign key - pola mogą być specyficzne dla projektu)
  - `name` (VARCHAR - nazwa pola)
  - `field_type` (ENUM - typ pola: text, number, date, select, multi_select, boolean)
  - `options` (JSONB - opcje dla pól typu select)
  - `is_required` (BOOLEAN - czy pole jest wymagane)
  - `default_value` (TEXT - wartość domyślna)
  - `created_at`, `updated_at`

- Utworzymy tabelę `custom_field_values` przechowującą wartości pól:
  - `id` (UUID, primary key)
  - `field_definition_id` (UUID, foreign key)
  - `entity_type` (ENUM - task, project)
  - `entity_id` (UUID - id zadania lub projektu)
  - `value` (JSONB - wartość pola)
  - `created_at`, `updated_at`

- Dodamy polityki RLS zabezpieczające dostęp do pól w ramach projektów użytkownika

### 2. Implementacja Hook'ów do Zarządzania Polami

**Zadanie:** Stworzenie dedykowanych hooków dla operacji na polach niestandardowych.

**Szczegóły:**
- `useCustomFieldDefinitions.tsx`:
  - `getFieldDefinitions(projectId, entityType)` - pobieranie definicji pól
  - `createFieldDefinition(definition)` - tworzenie nowej definicji pola
  - `updateFieldDefinition(id, updates)` - aktualizacja definicji
  - `deleteFieldDefinition(id)` - usuwanie definicji

- `useCustomFieldValues.tsx`:
  - `getFieldValues(entityType, entityId)` - pobieranie wartości pól dla entity
  - `saveFieldValues(entityType, entityId, values)` - zapisywanie wartości pól
  - `validateFieldValue(definition, value)` - walidacja wartości

### 3. Komponenty UI dla Zarządzania Polami

**Zadanie:** Stworzenie interfejsów do zarządzania definicjami i wartościami pól.

**Szczegóły:**
- `CustomFieldDefinitionManager.tsx`:
  - Interfejs do tworzenia/edycji definicji pól
  - Formularz z wyborem typu pola i konfiguracji opcji
  - Lista istniejących pól z możliwością edycji/usuwania

- `CustomFieldRenderer.tsx`:
  - Uniwersalny komponent renderujący pole na podstawie definicji
  - Obsługa różnych typów pól (text, number, date, select, etc.)
  - Integracja z react-hook-form dla walidacji

- `CustomFieldsSection.tsx`:
  - Sekcja w formularzach zadań/projektów
  - Grupowanie pól niestandardowych
  - Obsługa stanów ładowania i błędów

### 4. Integracja z Istniejącymi Formularzami

**Zadanie:** Włączenie pól niestandardowych do formularzy tworzenia/edycji zadań i projektów.

**Szczegóły:**
- Modyfikacja komponentów `TaskDialog.tsx` i `ProjectDialog.tsx`:
  - Dodanie sekcji pól niestandardowych
  - Automatyczne ładowanie definicji pól dla projektu
  - Zapisywanie wartości pól wraz z głównymi danymi

- Aktualizacja hooków `useTasks.tsx` i `useProjects.tsx`:
  - Rozszerzenie funkcji tworzenia/aktualizacji o obsługę pól niestandardowych
  - Optymalizacja zapytań dla jednoczesnego zapisu danych głównych i pól

### 5. System Walidacji i Typów

**Zadanie:** Implementacja kompletnego systemu walidacji dla pól niestandardowych.

**Szczegóły:**
- Walidacja po stronie klienta:
  - Sprawdzanie wymagalności pól
  - Walidacja formatów (daty, numery)
  - Sprawdzanie opcji w polach select

- Walidacja po stronie serwera:
  - Trigger'y w bazie danych dla spójności danych
  - Sprawdzanie dostępu do definicji pól w ramach projektu

### 6. Interfejs Zarządzania Szablonami

**Zadanie:** Stworzenie panelu administracyjnego dla zarządzania polami niestandardowymi.

**Szczegóły:**
- Dodanie zakładki "Custom Fields" w ustawieniach projektu
- Interfejs drag-and-drop dla układania kolejności pól
- Podgląd na żywo formularza z polami niestandardowymi
- Import/export szablonów pól między projektami

### 7. Optymalizacja Wydajności

**Zadanie:** Zapewnienie wydajności systemu przy dużej liczbie pól i wartości.

**Szczegóły:**
- Indeksy bazodanowe dla często używanych zapytań
- Caching definicji pól w React Query
- Lazy loading wartości pól przy dużych formularzach
- Optymalizacja zapytań JOIN dla pobierania danych z polami

### 8. Testy i Walidacja

**Zadanie:** Przetestowanie funkcjonalności w różnych scenariuszach użycia.

**Szczegóły:**
- Testy różnych typów pól (text, number, date, select, boolean)
- Sprawdzenie walidacji wymagalności i formatów
- Test wydajności przy dużej liczbie pól niestandardowych
- Weryfikacja polityk bezpieczeństwa (RLS)
- Test importu/eksportu szablonów

---

## Planowane Typy Pól

1. **Text** - Krótki tekst jednoliniowy
2. **Textarea** - Długi tekst wieloliniowy  
3. **Number** - Pole numeryczne z walidacją
4. **Date** - Picker daty
5. **DateTime** - Picker daty i czasu
6. **Select** - Lista wyboru (pojedynczy wybór)
7. **Multi-Select** - Lista wyboru (wielokrotny wybór)
8. **Boolean** - Checkbox true/false
9. **URL** - Pole adresu z walidacją URL
10. **Email** - Pole email z walidacją

---

## Korzyści dla Użytkowników

- **Elastyczność:** Dostosowanie aplikacji do specyficznych potrzeb różnych branż
- **Standaryzacja:** Jednolite podejście do dodatkowych informacji w projektach
- **Raportowanie:** Możliwość filtrowania i raportowania po polach niestandardowych  
- **Skalowalność:** Łatwe dodawanie nowych pól bez modyfikacji kodu

---

## Podsumowanie

Po zakończeniu implementacji, system pól niestandardowych znacząco zwiększy elastyczność aplikacji Renotl, pozwalając organizacjom na dostosowanie narzędzia do swoich unikalnych procesów i wymagań. Funkcjonalność będzie w pełni zintegrowana z istniejącymi modułami zadań i projektów, zapewniając spójne doświadczenie użytkownika. 