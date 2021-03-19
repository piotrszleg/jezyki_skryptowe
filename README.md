# Aplikacja wspomagająca pracę na sieciach neuronowych

## Użytkownicy
Programiści i osoby zarządzjące komputerami w kole naukowycm Robocik.

## Kwestie techniczne 
- framework Electron 
- Typescript i Javascript w zależnosci od potrzeb 
- Vue.js 
- Bootstrap lub Material Design 
- dysk Mega używany jako backend
- electron-settings do zachowywania ustawień

## Funkcjonalność
Dzielenie się:
- datasetami
- modelami
- zbudowaną aplikacją do generowania datasetów
- automatyczne aktualizacje

Skryptowanie
- wybór komend do trenowania modelu 
- masowe pobieranie czy trenowanie 

## Wygląd

Górny pasek 
- tytuł 
- odnośnik do logowania
- status aplikacji (np.: pobieranie datasetu...)

Lewy panel nawigacyjny z kategoriami 
- datasety
- modele
- aplikacje
- ustawienia

Głowna część interfejsu
- panele z przykładowymi elementami datasetu lub plikiem thumbnail.png w folderze oraz tytułem
- każdy panel może być zaznaczony i odznaczony aby stał się dostępny lokalnie
- możliwość podglądu zawartości datasetu w aplikacji
- opis
- opcjonalnie tagi

Ustawienia
- wybór domyślnego interpretera komend
- skrypty np. do trenowania modelu
- stałe środowiskowe używane w skryptach
- zamykanie komputera po zakończeniu się wszystkich zadań
- ścieżki

## Pomysły jeśli chodzi o 5.5
- pluginy
- ścislejsza integracja z frameworkami do sieci neuronowych

# Plan działania
1. Mockup interfejsu użytkownika.
2. Podstawowa komunikacja z lokalnym systemem plików i dyskiem Mega używająca stałych.
3. Wyświetlanie folderów i okna logowania w interfejsie.
4. Automatyczne pobieranie, przesyłanie i sprawdzanie wersji.
5. Ustawienia, skrypty konsolowe.
6. Utworzenie systemu wtyczek, ekstrakcja modułów do wtyczek jeżeli to możliwe.
7. Testy i poprawki w zależności od potrzeb.

## Installation
Simply clone down this repository, install dependencies, and get started on your application.

```bash
# install dependencies
yarn
```

### Development Scripts

```bash
# run application in development mode
yarn dev

# compile source code and create webpack output
yarn compile

# `yarn compile` & create build with electron-builder
yarn dist

# `yarn compile` & create unpacked build with electron-builder
yarn dist:dir
```
