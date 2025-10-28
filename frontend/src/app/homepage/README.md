# Homepage Components

This directory contains the modular components for the Auralie landing page.

## Structure

```
homepage/
├── sections/
│   ├── Header.tsx      # Navigation with dropdowns
│   ├── Hero.tsx        # Main hero section with CTA
│   ├── Features.tsx    # Feature cards section
│   ├── Footer.tsx      # Footer with links
│   └── index.ts        # Exports all components
```

## Components

### Header
- Sticky navigation bar
- Logo and main navigation links
- Dropdown menus for CYCLES, TRACK, CHANCES
- CTA button "Get Started"
- Responsive mobile menu

### Hero
- Large hero section with gradient background
- Two-column layout (content + image)
- Main headline and CTAs
- Hero image in circular background
- Decorative elements

### Features
- Three feature cards in grid layout
- Icons, titles, and descriptions
- Hover effects and transitions
- Responsive design

### Footer
- Multi-column layout with links
- Social media links
- Legal links (Privacy, Terms)
- Brand information

## Usage

Import components from the sections index:

```tsx
import { Header, Hero, Features, Footer } from './homepage/sections';
```

## Color Scheme

All components use the Auralie color palette defined in `globals.css`:
- Primary coral: #E37C6B
- Deep navy: #0F1724
- Soft pink: #FFF6F7
- Accent purple: #5B3E6D

## Responsive Design

Components are built mobile-first with responsive breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
