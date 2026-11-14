# 🎭 Character Model & Custom GLB Drop-In Guide
### *The Deductible Detective (損害査定員)*

The game features a dual-layer character system:
1. **Built-in Stylized Humanoid Characters (Default)**: Fully textured, low-poly characters matching the **Kenney / KayKit / Quaternius** art style (Detective with fedora, trench coat, tie & clipboard; Claimant with baker's toque, collared shirt, white apron with straps & pocket, dynamic head-tracking, breathing, and conversational hand gestures).
2. **Instant Drop-In GLB Support**: You can drop any rigged 3D character (`.glb` or `.gltf`) from **Mixamo**, **Quaternius**, **KayKit**, or **Poly Pizza** directly into the project, and the game will automatically load, texture, and animate it!

---

## 📁 Where to Place Your Models

Place your `.glb` files into the `public/models/` folder:

| Role | Target File Path | Recognized File Names | Expected Animations |
| :--- | :--- | :--- | :--- |
| **Player (Detective)** | `public/models/detective.glb` | `detective.glb`, `Soldier.glb` | `Idle`, `Walk`, `Run` |
| **Claimant (NPC / Witness)** | `public/models/claimant.glb` | `claimant.glb`, `npc.glb` | `Idle`, `Talk`, `Stand` |

> 💡 **Instant Hot-Reload:** As soon as you save the file into `public/models/`, refresh your browser (`http://localhost:3000`), and your custom character will appear in the scene!

---

## 🛠️ How to Get Characters from Free Libraries

### 1. Adobe Mixamo (Free with an Adobe Account)
Mixamo gives you hundreds of rigged 3D characters and thousands of motion-captured animations.

1. Go to [Mixamo.com](https://www.mixamo.com) and sign in.
2. Select the **Characters** tab:
   - For the Detective: Search for *"Investigator"*, *"Business Man"*, *"Soldier"*, or *"Casual"*.
   - For the Claimant: Search for *"Baker"*, *"Worker"*, *"Doctor"*, or *"Grandpa"*.
3. Select an animation from the **Animations** tab:
   - Player: Search for **"Walking"**, **"Running"**, or **"Idle"**.
   - Claimant: Search for **"Talking"**, **"Arguing"**, or **"Idle"**.
4. Click **Download**:
   - Format: **FBX for Unity (.fbx)** or **FBX (.fbx)** with Skin: *With Skin*.
5. Convert FBX to GLB:
   - You can open the `.fbx` in **Blender** (free) and choose `File > Export > glTF 2.0 (.glb)`.
   - Or use an online converter like [gltf.report](https://gltf.report) or [three.js editor](https://threejs.org/editor/).
   - Rename to `detective.glb` or `claimant.glb` and place in `public/models/`.

### 2. Quaternius (Free CC0 / Public Domain)
Quaternius creates modular, low-poly rigged character packs that perfectly match the low-poly city environment:
- **Packs:** "Casual Characters", "Animated Men", "Modular Characters".
- Download the `.glb` files directly from [quaternius.com](https://quaternius.com).
- Copy the desired character to `public/models/detective.glb` or `public/models/claimant.glb`.

### 3. KayKit (City & Character Bits)
- Download the character packs from [kaylousberg.itch.io](https://kaylousberg.itch.io/).
- Choose any GLB model with animations and drop it in!

### 4. Poly Pizza
- Browse thousands of CC0 low-poly props and characters on [poly.pizza](https://poly.pizza).
- Download as `.glb` or `.gltf`.

---

## 🎮 Locomotion & Control Reference

| Key / Input | Action | Direction |
| :---: | :---: | :--- |
| <kbd>W</kbd> | Move Forward | Moves forward into the scene (away from camera) |
| <kbd>S</kbd> | Move Backward | Moves backward (toward camera) |
| <kbd>A</kbd> | Move Left | **Moves Screen-Left** |
| <kbd>D</kbd> | Move Right | **Moves Screen-Right** |
| <kbd>Shift</kbd> + <kbd>WASD</kbd> | Run | Increases locomotion speed from 3.6 to 6.8 m/s |
| <kbd>Right Click + Drag</kbd> | Orbit View | Rotates 360° camera around the player |

---

## 🧠 Animation Clip Auto-Detection
The game includes a fuzzy name matcher for animation clips:
- **Idle:** Searches for clip names containing `idle`, `stand`, or `wait`.
- **Walk:** Searches for clip names containing `walk`, `stride`, or `move`.
- **Run:** Searches for clip names containing `run`, `sprint`, or `jog`.
- **Talk:** Searches for clip names containing `talk`, `dialogue`, `gesture`, or `idle`.

If your model does not have skeletal animations, the engine automatically falls back to smooth procedural limb-swinging and breathing animations so your character never slides statically.
