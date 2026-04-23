# Lunula

A privacy-first menstrual cycle tracking app for iOS and Android. All data is stored locally on your device — no accounts, no servers, no data collection.

## Features

- **Cycle tracking** — log periods and predict future phases with increasing accuracy over time
- **Daily logging** — record symptoms, mood, energy, flow intensity, and food cravings
- **Phase-based insights** — personalised guidance for each phase of your cycle
- **Pelvic floor exercises** — guided kegel workouts adapted to your current phase
- **Encrypted backups** — export and restore your data with AES-256-GCM encryption
- **PIN + biometric lock** — Face ID and fingerprint authentication
- **Fully offline** — no network requests during normal use

## Tech

- [Expo](https://expo.dev) / React Native
- [expo-router](https://expo.github.io/router) for file-based navigation
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for local data storage
- [react-native-quick-crypto](https://github.com/margelo/react-native-quick-crypto) for backup encryption
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [expo-local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/) for biometric lock

## Project structure

```
bloom-beta/
├── app/                  # expo-router screens
│   ├── (app)/            # Main app screens (today, calendar, exercises, settings)
│   └── (auth)/           # PIN / biometric auth screens
└── src/
    ├── components/       # Shared UI components
    ├── db/               # SQLite schema and repositories
    ├── models/           # Data models
    ├── services/         # Business logic (cycle prediction, backup, etc.)
    ├── stores/           # Zustand stores
    ├── content/          # Static in-app articles
    └── theme/            # Design tokens and styles
```

## Getting started

Prerequisites: [Node.js](https://nodejs.org), [Expo CLI](https://docs.expo.dev/get-started/installation/)

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app, or press `i` / `a` to open in a simulator.

## Website

[lunula.me](https://lunula.me) — source at [Lunula-App/Web](https://github.com/Lunula-App/Web)

## License

See [LICENSE](LICENSE).
