# Transformer Management System

## Overview

The Transformer Management System is a comprehensive web-based application designed for utility companies and electrical engineers to monitor, track, and maintain electrical transformers using thermal imaging technology. This system provides a centralized platform for managing transformer assets, conducting thermal inspections, and maintaining detailed records of equipment status and maintenance history.

## Features

### Core Functionality
- **Transformer Asset Management**: Complete CRUD operations for transformer records including identification, location, capacity, and technical specifications
- **Thermal Image Management**: Upload, categorize, and analyze thermal inspection images with metadata tracking
- **Status Monitoring**: Real-time tracking of transformer health status (Normal, Warning, Critical)
- **Dashboard Analytics**: Statistical overview with key performance indicators and system alerts
- **Advanced Search and Filtering**: Multi-criteria filtering by region, type, status, and environmental conditions

### Image Classification System
- **Baseline Images**: Reference thermal images captured under optimal conditions with environmental condition tracking (sunny, cloudy, rainy)
- **Maintenance Images**: Inspection images captured during routine maintenance and emergency assessments
- **Metadata Management**: Comprehensive tracking of uploader information, timestamps, comments, and environmental conditions

### User Interface
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Professional UI**: Clean, utility company-appropriate interface design
- **Accessibility**: Built with modern accessibility standards using Radix UI components
- **Dark/Light Mode**: Theme support for different working environments

## Technical Architecture

### Frontend Technology Stack
- **Framework**: Next.js 15.2.4 with React 19
- **Language**: TypeScript for type safety and enhanced development experience
- **Styling**: Tailwind CSS with shadcn/ui component library
- **UI Components**: Radix UI primitives for accessibility and consistency
- **Form Management**: React Hook Form with Zod validation
- **Data Visualization**: Recharts for dashboard analytics
- **Icons**: Lucide React icon library

### Development Tools
- **Package Manager**: pnpm for efficient dependency management
- **Code Quality**: ESLint and TypeScript compiler for code quality assurance
- **Build System**: Next.js build system with optimizations enabled

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard
│   ├── upload/            # Image upload interface
│   ├── gallery/           # Image gallery and browser
│   ├── transformer/       # Transformer-specific pages
│   │   ├── [id]/         # Individual transformer details
│   │   └── edit/         # Add/edit transformer form
│   └── settings/         # Application settings
├── components/            # Reusable React components
│   ├── forms/            # Form components
│   ├── layout/           # Navigation and layout components
│   └── ui/               # UI component library
├── lib/                  # Utility functions and API layer
│   ├── mock-api.ts       # Simulated backend API
│   └── utils.ts          # Helper utilities
├── public/               # Static assets and thermal images
└── styles/               # Global styles and CSS
```

## Installation and Setup

### Prerequisites
- Node.js (version 18.0 or higher)
- pnpm package manager

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/KumuthuDeZoysa/Transformer-Management-System.git
   cd Transformer-Management-System
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   pnpm dev
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Create production build
- `pnpm start` - Start production server (requires build first)
- `pnpm lint` - Run ESLint code quality checks

## Usage Guide

### Dashboard Navigation
- **Main Dashboard**: Overview of all transformers with search and filtering capabilities
- **Add/Edit Transformer**: Form interface for creating and modifying transformer records
- **Image Upload**: Interface for uploading thermal images with categorization
- **Gallery**: Browse and manage all uploaded thermal images
- **Individual Transformer Views**: Detailed view of specific transformer data and associated images

### Data Management
The application currently uses a mock API layer that simulates database operations. All data is stored in memory and includes sample transformers and thermal images for demonstration purposes.

### Transformer Records
Each transformer record includes:
- Unique identifier and pole number
- Geographic region and specific location
- Transformer type (Distribution, Power, Bulk)
- Capacity specifications
- Current status and last inspection date

### Thermal Image Management
Images are categorized by:
- Type: Baseline or Maintenance
- Environmental conditions (for baseline images)
- Uploader information and timestamps
- Associated comments and metadata

## Development

### Code Organization
The application follows Next.js 13+ App Router conventions with TypeScript throughout. Components are organized by functionality and reusability, with a clear separation between UI components, business logic, and data management.

### State Management
The application uses React's built-in state management with hooks. Form state is managed through React Hook Form with Zod schema validation for type safety and user input validation.

### Styling Approach
Tailwind CSS is used for styling with a custom design system built on shadcn/ui components. The color scheme and typography are optimized for professional utility company applications.


