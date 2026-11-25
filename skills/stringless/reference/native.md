# Native platforms

The method is the same on iOS, Android and cross-platform apps: five questions, the two ladders, the lexicon and the floor. The bundled runtime is web-only, so build its pieces with each platform's tools. Follow the platform's conventions (Apple's HIG, Material 3) for anything the lexicon doesn't change, and never break system gestures such as back swipes.

## Mapping

| Runtime piece | SwiftUI | Jetpack Compose | Flutter | React Native |
|---|---|---|---|---|
| approach | no hover on touch; `.onHover` and `.hoverEffect` on iPad pointer, Mac and visionOS; focus on tvOS | `Modifier.hoverable` for mouse and stylus; focus | `MouseRegion` on desktop and web | `onHoverIn` on web and Windows |
| rehearse | press state from `onLongPressGesture(minimumDuration:perform:onPressingChanged:)` or a `DragGesture(minimumDistance: 0)` | `pointerInput { detectTapGestures(onPress = { ... tryAwaitRelease() }) }` | `GestureDetector` `onTapDown`, `onTapCancel`, `onLongPressStart` | Gesture Handler `Gesture.LongPress()` with `onBegin` and `onFinalize` |
| heavy hold | `onLongPressGesture(minimumDuration: 1.1)` with progress driven by a timer or a `TimelineView` | a coroutine timer inside `onPress`, cancelled when the press is released | `AnimationController` started on `onLongPressStart`, reversed on release | `Gesture.LongPress().minDuration(1100)` plus a Reanimated progress value |
| springs | `.interpolatingSpring(mass:stiffness:damping:)` | `spring(dampingRatio = c / (2 * sqrt(k * m)), stiffness = k / m)` | `SpringDescription(mass: m, stiffness: k, damping: c)` with `SpringSimulation` | Reanimated `withSpring(value, { mass, stiffness, damping })` |
| materials and light | Metal shaders through `.colorEffect`, `.distortionEffect` and `.layerEffect`; light from CoreMotion tilt | AGSL `RuntimeShader` (Android 13 and later); tilt from `SensorManager` | `FragmentProgram` shaders; tilt from `sensors_plus` | `@shopify/react-native-skia` with `RuntimeEffect` shaders |
| verbs (shatter, fold, travel) | `matchedGeometryEffect`, `Canvas`, `TimelineView`, Metal | `Canvas`, `graphicsLayer`, shared element transitions | `CustomPainter`, `Hero`, shaders | Skia, Reanimated layout animations |
| haptics | `.sensoryFeedback(.impact(weight: .heavy), trigger:)` or `UIImpactFeedbackGenerator` | `HapticFeedbackConstants` with `View.performHapticFeedback`, or `VibrationEffect` | `HapticFeedback.lightImpact()`, `mediumImpact()`, `heavyImpact()` | `expo-haptics` `impactAsync` |
| name and role | `.accessibilityLabel`, `.accessibilityAddTraits(.isButton)` | `Modifier.semantics { contentDescription = ...; role = Role.Button }` | `Semantics(label: ..., button: true)` | `accessibilityLabel`, `accessibilityRole="button"` |
| heavy for screen readers | `.accessibilityAction(named:)` that arms, then a second activation commits, announced with `AccessibilityNotification.Announcement` | a custom action plus `announceForAccessibility`-style live region | `SemanticsService.announce` between the two activations | `accessibilityActions` and `AccessibilityInfo.announceForAccessibility` |
| reduced motion | `@Environment(\.accessibilityReduceMotion)` | check the system animator scale (`ValueAnimator.areAnimatorsEnabled()`) | `MediaQuery.disableAnimationsOf(context)` | Reanimated `useReducedMotion()` or `AccessibilityInfo.isReduceMotionEnabled()` |
| captions | a long press shows the label in a popover or `.help` on pointer platforms | `TooltipBox` on long press | `Tooltip` | a small popover on long press |
| memory | `@AppStorage` | DataStore | `shared_preferences` | AsyncStorage or MMKV |

Spring presets (mass, stiffness, damping), shared with the web runtime: paper 0.6, 380, 16 · ink 1.2, 160, 30 · glass 1, 900, 18 · metal 3, 400, 60 · rubber 1, 300, 9 · clay 1.5, 120, 30 · liquid 1.2, 150, 8 · ice 1, 600, 40 · stone 5, 500, 95 · cloth 0.4, 60, 6 · wax 1.5, 200, 40 · light 0.2, 200, 12 · vapor 0.5, 30, 8.

## Differences from the web

- **No approach on touch.** The rehearsal moves to the press: it starts on touch-down and reverses if the finger lifts early or slides away. Design the rest pose to carry more of the meaning, because there is no hover to help.
- **Tilt is the light.** Highlights follow device tilt instead of a pointer. Keep the movement small and turn it off with reduced motion.
- **Haptics are real.** iOS and Android haptics are much richer than the web's Vibration API. Map them to weight: light, medium, heavy, and a distinct pattern for refusal.
- **System gestures win.** Edge swipes, the home indicator and back gestures belong to the system. Keep stringless drags away from screen edges.
- **Long press belongs to the app.** Captions on long press are safe because they don't commit.
- **The rest of [touch](touch.md) applies too:** occlusion, reach, touch gestures and their tap paths.

## Verify

Check on a real device with VoiceOver or TalkBack, Reduce Motion on, and the largest text size. Run `guess` on simulator screenshots of the rest pose and of each control mid-press.
