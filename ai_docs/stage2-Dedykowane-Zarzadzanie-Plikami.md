 # Plan Implementacji: Dedykowane Zarządzanie Plikami

## Cel

Celem tego zadania jest rozbudowa istniejącego placeholdera `FileManager.tsx` w celu stworzenia w pełni funkcjonalnego modułu do zarządzania plikami w ramach projektów. Użytkownicy będą mogli przesyłać, przeglądać, wyszukiwać i usuwać pliki powiązane z konkretnym projektem.

---

## Kroki Implementacji

### 1. Rozbudowa Interfejsu Użytkownika (`FileManager.tsx`)

-   **Zadanie:** Przekształcenie istniejącego komponentu w interaktywny menedżer plików.
-   **Szczegóły:**
    -   Zaprojektujemy widok siatki (grid) do wyświetlania plików, z miniaturkami dla obrazów i ikonami dla innych typów plików.
    -   Dodamy przycisk "Prześlij plik", który będzie otwierał systemowe okno wyboru plików.
    -   Implementujemy pasek akcji zawierający opcje filtrowania i sortowania plików.
    -   Każdy plik na siatce będzie miał menu kontekstowe z opcjami "Pobierz" i "Usuń".

### 2. Konfiguracja Supabase Storage

-   **Zadanie:** Przygotowanie backendu do przechowywania plików.
-   **Szczegóły:**
    -   W panelu Supabase utworzymy nowy "bucket" w usłudze Storage, np. o nazwie `project_files`.
    -   Zdefiniujemy polityki dostępu (Row Level Security Policies), aby zapewnić, że użytkownicy mogą uzyskać dostęp tylko do plików w projektach, do których należą. Pliki powinny być domyślnie chronione.

### 3. Stworzenie Hooka `useFiles.tsx`

-   **Zadanie:** Stworzenie hooka do zarządzania logiką operacji na plikach.
-   **Szczegóły:**
    -   Stworzymy nowy hook `useFiles.tsx` w `src/hooks`.
    -   Hook będzie zawierał następujące funkcje:
        -   `getFiles(projectId)`: Pobierze listę plików dla danego projektu z bazy danych Supabase.
        -   `uploadFile(file, projectId)`: Prześle plik do Supabase Storage, a następnie zapisze jego metadane (nazwa, ścieżka, typ, rozmiar, `project_id`) w dedykowanej tabeli w bazie danych.
        -   `deleteFile(fileId)`: Usunie plik z Supabase Storage oraz jego wpis z bazy danych.
        -   `getPublicUrl(filePath)`: Wygeneruje publiczny (lub podpisany) URL do pliku w celu jego pobrania lub wyświetlenia.

### 4. Integracja UI z Logiką

-   **Zadanie:** Połączenie komponentu `FileManager.tsx` z hookiem `useFiles.tsx`.
-   **Szczegóły:**
    -   Komponent `FileManager.tsx` użyje hooka `useFiles` do pobrania i wyświetlenia listy plików.
    -   Funkcjonalność przesyłania, pobierania i usuwania zostanie podłączona do odpowiednich funkcji z hooka.
    -   Dodamy obsługę stanu ładowania oraz informacji zwrotnej dla użytkownika (np. toasty informujące o powodzeniu lub błędzie operacji).

---

## Podsumowanie

Po zakończeniu prac, aplikacja będzie wzbogacona o kluczowy moduł, który scentralizuje zarządzanie zasobami projektowymi, co znacząco wpłynie na organizację pracy zespołowej.
