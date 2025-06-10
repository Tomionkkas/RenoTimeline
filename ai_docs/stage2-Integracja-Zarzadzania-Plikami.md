# Plan: Integracja Zarządzania Plikami z Supabase Storage

## Cel

Celem tego etapu jest pełna integracja istniejącego komponentu `FileManager.tsx` i hooka `useFiles.tsx` z usługą Supabase Storage. Zastąpimy dane testowe (`mock`) rzeczywistymi operacjami na plikach, co umożliwi użytkownikom zarządzanie plikami projektowymi w aplikacji.

**Project ID:** `qxyuayjpllrndylxhgoq`

---

## Kroki Implementacji

### 1. Konfiguracja Bucketu w Supabase Storage

- **Zadanie:** Utworzenie i skonfigurowanie dedykowanego bucketu do przechowywania plików.
- **Szczegóły:**
    - Utworzymy publiczny bucket o nazwie `renotl_project_files`. Publiczny, aby uprościć dostęp do plików przez URL, przy jednoczesnym zabezpieczeniu operacji zapisu/usuwania poprzez polityki RLS w tabeli metadanych.
    - Operacja zostanie wykonana za pomocą zapytania SQL, ponieważ nie ma dedykowanego narzędzia do tworzenia bucketów.

### 2. Utworzenie Tabeli Metadanych Plików

- **Zadanie:** Stworzenie tabeli w bazie danych Supabase do przechowywania informacji o plikach.
- **Szczegóły:**
    - Stworzymy tabelę `files` za pomocą migracji SQL.
    - Tabela będzie zawierała kolumny: `id` (UUID), `created_at`, `name` (nazwa pliku), `path` (ścieżka w Storage), `file_type` (MIME type), `size` (rozmiar w bajtach), `project_id` (powiązanie z projektem) oraz `user_id` (kto przesłał plik).
    - Dodamy polityki RLS, aby użytkownicy mogli widzieć/zarządzać tylko plikami w projektach, do których należą.

### 3. Modyfikacja Hooka `useFiles.tsx`

- **Zadanie:** Zastąpienie logiki opartej na danych `mock` rzeczywistymi wywołaniami API Supabase.
- **Szczegóły:**
    - **`fetchFiles(projectId)`:** Będzie pobierać metadane plików z tabeli `files` dla danego `projectId`.
    - **`uploadFile(file, projectId)`:**
        1. Prześle plik do Supabase Storage do ścieżki `/{projectId}/{random_uuid()}-{file.name}`.
        2. Po pomyślnym przesłaniu, zapisze metadane pliku (wraz ze zwróconą ścieżką) do tabeli `files` w bazie danych.
    - **`deleteFile(fileId)`:**
        1. Pobierze metadane pliku z tabeli `files` na podstawie `fileId`.
        2. Usunie plik z Supabase Storage na podstawie zapisanej ścieżki.
        3. Usunie rekord z tabeli `files`.
    - **`downloadFile(filePath)`:** Wygeneruje i zwróci publiczny URL do pliku, używając ścieżki przechowywanej w bazie danych.

### 4. Aktualizacja Komponentu `FileManager.tsx`

- **Zadanie:** Dostosowanie komponentu UI do pracy z asynchronicznymi operacjami hooka `useFiles.tsx`.
- **Szczegóły:**
    - Zaimplementujemy obsługę stanów ładowania (loading) podczas pobierania listy plików i przesyłania nowych.
    - Dodamy mechanizmy obsługi błędów i wyświetlania powiadomień (toastów) dla użytkownika o wyniku operacji (np. "Plik przesłany pomyślnie", "Błąd podczas usuwania pliku").
    - Upewnimy się, że interfejs odświeża się automatycznie po dodaniu lub usunięciu pliku.

### 5. Weryfikacja i Testy

- **Zadanie:** Przetestowanie całej funkcjonalności w działającej aplikacji.
- **Szczegóły:**
    - Przetestujemy scenariusze: dodawanie pliku, usuwanie pliku, wyświetlanie listy plików dla różnych projektów.
    - Sprawdzimy, czy polityki RLS działają poprawnie i uniemożliwiają dostęp do plików z innych projektów.

---

## Podsumowanie

Po zakończeniu tego etapu, moduł zarządzania plikami będzie w pełni funkcjonalny i zintegrowany z backendem, co stanowi kluczowy krok w rozwoju aplikacji zgodnie z `masterplan.md`. 