# Sense: sound and haptics

Sound and touch finish the material. A paper button that crinkles and a stone that thuds are more convincing than any texture. Both are always opt-in.

## Rules

- **Off by default.** Sound plays only after the user turns it on, for example with a speaker object somewhere in the scene, and the choice is saved (`Stringless.sound.enable()` stores it).
- **Browsers need a gesture.** Audio can only start inside a user gesture, so the enabling control must be a click or key press.
- **Short and quiet.** Under 300ms for commits, under 150ms for arms and cancels. Master gain stays low; the runtime uses 0.18.
- **Never on approach.** Hover sounds get tiring within a minute. Sound belongs to commit, arm, cancel and refusal.
- **Material, not melody.** Synthesize the material (noise bursts for paper, a short ring for glass, a thud for stone). No musical stingers, no notification chimes for local actions.
- **Haptics follow weight.** Light 6ms, medium 12ms, heavy a double pulse. The Vibration API only works on Android browsers; iOS ignores it, and native apps should use the platform's haptics.
- **Sound never carries meaning alone.** Deaf users and muted devices must get the same information visually.

## Runtime

```js
Stringless.sound.enable();           // after a user gesture
Stringless.sound.play('paper');      // commit sound for a material
Stringless.sound.play('glass', 'cancel');
Stringless.haptics.enable();
Stringless.haptics.pulse('heavy');
```

Controls with `data-sl-verb` play their material's sound on commit and give a haptic pulse matched to `data-sl-weight`, once the user has enabled each channel.

Built-in recipes: paper, ink, graphite, glass, metal, rubber, clay, liquid, ice, stone, cloth, wax, light, vapor, ember, ash, plus a generic tone. Kinds: `commit`, `arm` (softer), `cancel` (softer), `refuse` (two low taps).

## Sound design per material

| Material | Commit | Built from |
|---|---|---|
| paper | crisp rustle, two parts | bandpassed noise around 3kHz, then 2.4kHz |
| ink | soft low drop | a falling sine plus lowpassed noise |
| glass | thin ring with a fifth above | two sines, long decay |
| metal | short click with a body | a highpassed noise tick plus a square blip |
| stone | deep thud | lowpassed noise plus a 70Hz sine |
| rubber | bouncy boop | a sine falling 170 to 70Hz |
| wax | soft press | lowpassed noise plus a low sine |
| ember | crackle | several random highpassed ticks |

For richer sound, use recorded samples, but keep them small (under 20KB each, Opus or AAC), preload them only after sound is enabled, and keep the same rules.
