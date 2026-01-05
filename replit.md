# Blood Biosensor App

## Overview

Blood Biosensor is a health monitoring mobile application built with React Native and Expo for tracking and visualizing blood biosensor data. The app allows users to record readings for glucose, hemoglobin, cholesterol, and platelets, view trends over time, and manage their health data locally for privacy.

The application follows a client-server architecture where:
- The mobile client handles all user interactions and local data storage
- An Express server provides API endpoints (currently minimal, primarily serving as infrastructure)
- Data is stored locally on device using AsyncStorage for privacy-first design

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54, using the new architecture with React Compiler enabled.

**Navigation Structure**:
- Root Stack Navigator (modal presentations)
  - Main Tab Navigator (3 tabs: Home, History, Profile)
    - Each tab has its own Stack Navigator for screen hierarchy

**State Management**:
- React Context for global state (ReadingsContext, PreferencesContext)
- Custom hooks for data access (useReadings, usePreferences)
- TanStack React Query for server state management (infrastructure in place)

**UI Design Patterns**:
- Themed components supporting light/dark mode via system preferences
- Animated interactions using Reanimated for micro-interactions
- Glass effect/blur backgrounds on iOS tab bar and headers
- Responsive layouts with SafeAreaContext for notch/edge handling

**Key Design Decisions**:
- No authentication - all data stored locally for privacy
- Readings stored with status calculation (normal/warning/critical) based on medical ranges
- Modular component architecture with reusable themed primitives

### Backend Architecture

**Server**: Express.js with TypeScript, minimal setup for future API expansion.

**Current State**: The server primarily serves as infrastructure. Routes are registered but contain minimal logic. A storage interface is defined with an in-memory implementation.

**Database Schema**: Drizzle ORM with PostgreSQL schema defined but not actively used (app relies on local storage).

### Data Flow

1. User adds readings via AddReadingScreen modal
2. Readings are saved to AsyncStorage via storage utilities
3. ReadingsContext updates and propagates changes to all consumers
4. HomeScreen displays latest readings, HeroCard, and trend charts
5. HistoryScreen provides filterable list view of all readings

## External Dependencies

### Core Dependencies
- **Expo SDK 54**: Mobile development framework with managed workflow
- **React Navigation**: Stack and tab navigation with native stack
- **TanStack React Query**: Server state management (prepared for future API usage)
- **Drizzle ORM + Zod**: Database schema and validation (schema defined for PostgreSQL)

### UI/UX Libraries
- **React Native Reanimated**: Smooth animations and gesture handling
- **Expo Blur/Glass Effect**: Native blur effects for iOS
- **Expo Haptics**: Tactile feedback on user actions
- **@expo/vector-icons (Feather)**: Icon set for UI elements

### Data Storage
- **AsyncStorage**: Local device storage for readings and preferences
- **PostgreSQL**: Database configured via Drizzle (infrastructure prepared but not primary storage)

### Build/Development
- **TypeScript**: Full type coverage with strict mode
- **Babel with module-resolver**: Path aliases (@/, @shared/)
- **ESLint + Prettier**: Code quality and formatting