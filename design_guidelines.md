# Blood Biosensor App - Design Guidelines

## Overview
A health monitoring application for tracking and visualizing blood biosensor data. The app focuses on presenting medical data clearly while maintaining user privacy and accessibility.

## Authentication & Data
- **No authentication required** - Data stored locally for privacy
- Include Profile/Settings screen with:
  - User-customizable avatar (generate 2 medical-themed preset avatars: stethoscope icon, heart rate icon)
  - Display name field
  - App preferences: units (mg/dL vs mmol/L), notifications, dark mode

## Navigation Architecture
**Tab Navigation (3 tabs)**
- Home (Dashboard)
- History (Data logs)
- Profile (Settings)

## Screen Specifications

### Home/Dashboard
- **Purpose**: View current readings and quick insights
- **Layout**:
  - Transparent header with right button (sync/refresh icon)
  - Scrollable main content
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Hero card showing latest reading with large numeric display
  - Status indicator (normal/warning/critical ranges)
  - Quick stat cards (grid of 2x2) for glucose, hemoglobin, etc.
  - "Add Reading" floating action button (bottom-right with subtle shadow)
  - Line chart showing trend (last 7 days)

### Add Reading (Modal)
- **Purpose**: Input new biosensor data
- **Layout**:
  - Default navigation header with "Cancel" (left) and "Save" (right)
  - Scrollable form
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**:
  - Segmented control for reading type
  - Numeric input fields with unit labels
  - Date/time picker
  - Optional notes text area
  - Form validation with inline error messages

### History
- **Purpose**: Browse past readings and trends
- **Layout**:
  - Default header with search bar
  - List view (FlatList)
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Filterable list by date range and reading type
  - Card-based list items with reading value, timestamp, status badge
  - Swipe actions: delete (red), export (blue)
  - Empty state illustration when no data

### Profile/Settings
- **Purpose**: Manage preferences and app info
- **Layout**:
  - Default header
  - Scrollable grouped list
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Avatar selector (tappable, shows picker)
  - Display name field
  - Settings sections: Units, Notifications, Display
  - Export data button
  - About/privacy policy links

## Design System

### Color Palette
- **Primary**: Medical blue (#2563EB) - trust, professionalism
- **Secondary**: Teal (#14B8A6) - health, vitality
- **Success**: Green (#10B981) - normal readings
- **Warning**: Amber (#F59E0B) - caution ranges
- **Error**: Red (#EF4444) - critical readings
- **Background**: White (#FFFFFF) / Dark (#1F2937)
- **Surface**: Light gray (#F3F4F6) / Dark gray (#374151)
- **Text Primary**: #111827 / #F9FAFB
- **Text Secondary**: #6B7280 / #9CA3AF

### Typography
- **Header Large**: 32pt, Bold - Dashboard titles
- **Header**: 24pt, Semibold - Section headers
- **Subheader**: 18pt, Medium - Card titles
- **Body**: 16pt, Regular - Main content
- **Caption**: 14pt, Regular - Timestamps, labels
- **Reading Display**: 48pt, Bold - Primary data

### Visual Design
- Use Feather icons from @expo/vector-icons (activity, heart, droplet, trending-up)
- Cards with subtle border (1px) and light background, no heavy shadows
- Floating action button shadow specs:
  - shadowOffset: {width: 0, height: 2}
  - shadowOpacity: 0.10
  - shadowRadius: 2
- Status badges with colored backgrounds at 10% opacity
- Charts use primary color with gradient fill
- Pressed states: reduce opacity to 0.7

### Assets Required
- 2 preset avatars: stethoscope icon, heart rate icon (simple line art)
- Empty state illustration for History screen (simple medical-themed graphic)

### Accessibility
- Minimum touch target: 44x44pt
- Support VoiceOver with descriptive labels
- Color blind friendly status indicators (use shapes + colors)
- Dynamic type support for text scaling
- High contrast mode support