# Kenney City Kits & Model Loader Integration Guide

This guide explains how **The Deductible Detective** implements the town environment using the design order recommended for Kenney assets, how the **Model Loader** works, and how to drop in external `.glb` files from [Kenney.nl](https://kenney.nl/assets).

---

## 1. Design Order Implementation

Following the game design guidelines:

### 1. Roads First
- **Main Street ("Rue de la Boulangerie"):** Runs East-West directly in front of the bakery ($z = -6.5\text{m}$, width $6.0\text{m}$) with dual lanes, dashed centerlines, and stone curbs.
- **4-Way Crossroad:** At $x = 14.0\text{m}$, connecting Main Street to the North-South Avenue ("Boulevard de l'Étoile") with four painted zebra crosswalks.
- **Road Bends:** A 90° curve at the West end ($x = -20.0\text{m}$) heading North, and a continuation along Boulevard de l'Étoile.
- **Sidewalks:** Elevated pedestrian sidewalks ($y = 0.10\text{m}$) with curbs running along both sides of the street.

### 2. Buildings Along the Roads (Rotated to Face the Street)
- **Case 1 Bakery:** Front faces South toward Main Street ($z = -1.1\text{m}$).
- **Case 1 Garage:** Single-car garage to the West ($x = -10.2\text{m}, z = 4.5\text{m}$), white roll-up panel door facing South toward the street.
- **East Neighboring Cafe:** 2-story commercial shop ($x = 9.0\text{m}, z = 4.5\text{m}$) with blue-and-white canvas awning, display windows, and outdoor sidewalk cafe seating.
- **South Side (Across the Street, rotated 180° to face North toward Main Street):**
  - **Suburban House 1:** 2-story green Craftsman home with front porch and chimney ($x = -11.0\text{m}, z = -17.5\text{m}$).
  - **Commercial Bookstore:** Red brick facade with maroon awning ($x = -1.0\text{m}, z = -17.5\text{m}$).
  - **Suburban House 2:** Cream Craftsman with front porch ($x = 9.0\text{m}, z = -17.5\text{m}$).
- **East Avenue:** Municipal building facade facing West onto Boulevard de l'Étoile ($x = 21.0\text{m}$).

### 3. Fences, Driveways, Trees & Paths
- **Driveways:** Paved asphalt driveway connecting the Case 1 garage to Main Street.
- **Fences:** White picket perimeter fences enclosing the West and North property lines, with an open garden gate leading to the back alley.
- **Paths & Garden:** Stone walkway to the bakery front porch, side garden stepping stones, and raised vegetable/flower garden beds behind the bakery.
- **Trees:** 16+ low-poly oak and pine trees along sidewalks, front yards, and property corners.
- **Street Furniture:** Cast-iron streetlights with warm point lights, fire hydrant, blue postal mailbox, park bench, street name signpost ("Rue de la Boulangerie"), and a parked town sedan.

---

## 2. Model Loader (`src/scene/ModelLoader.ts`)

The `ModelLoader` class provides centralized asset management:
- **Promise-Based & Cached:** In-memory caching so assets are loaded once and cloned efficiently (`instantiate()`).
- **Zero-Crash Procedural Fallbacks:** If external `.glb` files have not been downloaded yet, the loader automatically synthesizes Kenney-grade low-poly models (roads, suburban houses, shops, garage, fences, trees, streetlights, cars).
- **Shadows & Materials:** Automatically configures `castShadow`, `receiveShadow`, and material settings.

### Usage in Code
```typescript
import { ModelLoader } from './ModelLoader';

const loader = ModelLoader.getInstance();

// Instant instantiation with options:
const house = loader.instantiate('suburban_house_green', {
  position: [-11.0, 0, -17.5],
  rotation: [0, Math.PI, 0], // Rotated to face street
  castShadow: true,
  receiveShadow: true
});
scene.add(house);
```

---

## 3. How to Drop in Kenney Asset Packs

You can download the free CC0 kits from [Kenney.nl](https://kenney.nl/assets):
1. **City Kit (Roads):** `https://kenney.nl/assets/city-kit-roads`
2. **City Kit (Suburban):** `https://kenney.nl/assets/city-kit-suburban`
3. **City Kit (Commercial):** `https://kenney.nl/assets/city-kit-commercial`
4. **Furniture Kit:** `https://kenney.nl/assets/furniture-kit`

Place the extracted `.glb` or `.gltf` files in the `public/models/kenney/` directory:
```
public/
  models/
    kenney/
      roads/
        road_straight.glb
        road_crossroad.glb
        road_bend.glb
      suburban/
        house_typeA.glb
        house_typeB.glb
        garage.glb
        fence.glb
        tree_oak.glb
      commercial/
        building_shop.glb
        building_corner.glb
```

When files exist at these paths, `ModelLoader.load()` will load the Kenney GLB meshes. When omitted, the built-in procedural fallbacks ensure everything renders immediately.
