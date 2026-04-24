---
version: alpha
name: Helios Atlas
description: A cinematic, educational solar-system interface using deep-space surfaces, stellar gold, orbit cyan, and observatory-style glass panels.
colors:
  primary: "#030712"
  secondary: "#0B1020"
  tertiary: "#38BDF8"
  accent: "#FBBF24"
  planetBlue: "#60A5FA"
  mars: "#F97316"
  nebula: "#A78BFA"
  neutral: "#F8FAFC"
  muted: "#A7B4CA"
  surface: "#101827"
  surfaceRaised: "#16243A"
  border: "#2D4266"
typography:
  h1:
    fontFamily: Inter
    fontSize: 1.05rem
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.04em"
  h2:
    fontFamily: Inter
    fontSize: 1.55rem
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 450
    lineHeight: 1.65
  label:
    fontFamily: Inter
    fontSize: 0.72rem
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.14em"
rounded:
  sm: 8px
  md: 14px
  lg: 24px
  pill: 999px
spacing:
  xs: 6px
  sm: 10px
  md: 16px
  lg: 22px
  xl: 36px
components:
  deep-space-panel:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: 22px
  hud-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: 16px
  info-panel:
    backgroundColor: "{colors.surfaceRaised}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: 22px
  button-control:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: 12px
  button-control-active:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: 12px
  search-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.pill}"
    padding: 12px
  solar-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: 10px
  orbit-accent:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: 10px
  planet-blue-chip:
    backgroundColor: "{colors.planetBlue}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: 10px
  mars-chip:
    backgroundColor: "{colors.mars}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: 10px
  nebula-chip:
    backgroundColor: "{colors.nebula}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: 10px
  divider-border:
    backgroundColor: "{colors.border}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
    padding: 6px
---

## Overview

Helios Atlas is the design system for Solar System Explorer. The product should feel like a cinematic observatory: immersive enough for space exploration, but clear enough for learning real facts about planets, moons, and spacecraft.

The interface floats over the 3D scene as calm instrument panels. Controls should never compete with the planets; they should feel like transparent overlays on a telescope feed.

## Colors

- **Primary (#030712):** The deepest space background and high-contrast text on bright controls.
- **Secondary (#0B1020):** Deep navy gradients and atmospheric depth.
- **Tertiary (#38BDF8):** Orbit cyan for interaction, search focus, and selected controls.
- **Accent (#FBBF24):** Stellar gold for the Sun, loading state, and key solar highlights.
- **PlanetBlue (#60A5FA):** Earth-like informational highlights.
- **Mars (#F97316):** Warm planetary contrast for Mars/alert-like attention without danger language.
- **Nebula (#A78BFA):** Purple nebula glow used sparingly for cosmic ambience.
- **Neutral (#F8FAFC):** Primary text on dark glass panels.
- **Muted (#A7B4CA):** Secondary details, timestamps, and stat labels.

## Typography

Use Inter/system UI for crisp readability over WebGL. Labels are uppercase and tracked wide to feel like scientific instrumentation. Data values should be semibold and slightly brighter than labels.

## Layout

Keep the 3D canvas as the hero. UI should occupy the edges: HUD top-left, search top-center, info panel top-right, controls bottom-center, minimap bottom-right. On mobile, panels compress but retain rounded glass surfaces.

## Elevation & Depth

Use translucent glass, border highlights, and soft cyan/gold glows. Avoid heavy shadows that flatten the cosmic background. Active states should glow subtly rather than flash.

## Shapes

Panels use large rounded corners. Search and buttons are pill-shaped for touch-friendly controls. The minimap remains circular to echo orbital paths.

## Components

- `hud-panel` is for persistent simulation status.
- `info-panel` is for selected planet/body facts.
- `button-control` is the default bottom command button.
- `button-control-active` marks active toggles and important state.
- `search-input` is the main way to jump to planets, moons, and stations.

## Do's and Don'ts

**Do:**
- Make selected/focused states obvious with cyan.
- Keep panels readable against bright planets and the Sun.
- Use gold for solar identity, not every button.
- Keep educational stats calm and scannable.

**Don't:**
- Cover the 3D scene with large opaque UI.
- Use harsh red unless something is truly destructive or broken.
- Add unnecessary controls that distract from exploration.
- Reduce contrast for decorative glass effects.
