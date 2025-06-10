# Plan Implementacji: Zaawansowane Wyszukiwanie Globalne

## Cel

Celem tego zadania jest zaimplementowanie globalnego paska wyszukiwania w aplikacji Renotl. Funkcjonalność ta pozwoli użytkownikom na szybkie i efektywne znajdowanie zasobów, takich jak projekty i zadania, z dowolnego miejsca w aplikacji.

---

## Kroki Implementacji

### 1. Stworzenie Komponentu Interfejsu Użytkownika (UI)

-   **Zadanie:** Zaprojektowanie i implementacja komponentu paska wyszukiwania.
-   **Szczegóły:**
    -   Stworzymy nowy komponent `GlobalSearch.tsx` w katalogu `src/components/ui`.
    -   Komponent będzie zawierał pole `input` ze stylowaniem dopasowanym do reszty aplikacji.
    -   Dodamy ikonę lupy dla lepszej identyfikacji wizualnej.
    -   Pasek wyszukiwania zostanie dodany do głównego layoutu aplikacji (`src/pages/Index.tsx`), aby był zawsze widoczny i dostępny.

### 2. Implementacja Logiki Wyszukiwania

-   **Zadanie:** Stworzenie hooka, który będzie zarządzał logiką wyszukiwania.
-   **Szczegóły:**
    -   Stworzymy nowy hook `useGlobalSearch.tsx` w `src/hooks`.
    -   Hook ten będzie przyjmował frazę do wyszukania jako argument.
    -   Będzie on przeszukiwał istniejące dane (projekty i zadania), korzystając z istniejących hooków `useProjects` i `useTasks`.
    -   Wyszukiwanie będzie odbywać się po stronie klienta, filtrując dane na podstawie tytułów i opisów.
    -   Hook będzie zwracał listę znalezionych wyników oraz status ładowania/wyszukiwania.

### 3. Wyświetlanie Wyników Wyszukiwania

-   **Zadanie:** Stworzenie komponentu do wyświetlania wyników.
-   **Szczegóły:**
    -   Stworzymy komponent `SearchResults.tsx` w `src/components/ui`.
    -   Komponent ten będzie renderował listę wyników w formie rozwijanego menu (dropdown) pod paskiem wyszukiwania.
    -   Wyniki będą pogrupowane według typu (np. "Projekty", "Zadania").
    -   Każdy wynik będzie klikalny i będzie przekierowywał do odpowiedniego zasobu (na razie w ramach widoku Kanban/Projektów).

### 4. Integracja Całości

-   **Zadanie:** Połączenie wszystkich elementów w spójną całość.
-   **Szczegóły:**
    -   Komponent `GlobalSearch.tsx` użyje hooka `useGlobalSearch.tsx` do pobierania wyników na podstawie wpisywanego tekstu.
    -   Wyniki zwrócone przez hook zostaną przekazane do komponentu `SearchResults.tsx`, który je wyświetli.
    -   Zarządzanie stanem (np. widocznością wyników) będzie odbywać się w komponencie `GlobalSearch.tsx`.

---

## Podsumowanie

Po zakończeniu tych kroków, aplikacja będzie posiadała w pełni funkcjonalny, globalny system wyszukiwania, co znacząco poprawi jej użyteczność i przyspieszy nawigację dla użytkowników. 