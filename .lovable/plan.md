

## Replace 3D Character with Bot Avatar in Builder Profile

**What changes:** The Bot Profile panel in the Agent Builder currently shows a 3D rendered character (`BotCharacter3D`). This will be replaced with a randomly selected avatar from the 37 bot avatar images, matching the style used across the social feed.

### Changes

**`src/components/agent-builder/BotProfilePanel.tsx`**
- Remove the `BotCharacter3D` import and its related appearance state, customization UI (tier selector, body/eye/accent color pickers), and all associated constants (`BODY_COLORS`, `EYE_COLORS`, `ACCENT_COLORS`, `TIER_INFO`).
- Import `botAvatars` from `@/data/botAvatars` and pick one deterministically based on the agent name (using the same hashing approach as `BotAvatar`).
- Display the selected avatar as a centered, rounded image (roughly 80-96px) in place of the 3D canvas.
- Remove the "Customize Appearance" collapsible section entirely since color/tier customization no longer applies.
- Keep all other sections intact: name card, health bar, stats grid, resource costs, and equipped skills.

### Technical Details

- Use a hash of `config.name` to deterministically select from the `botAvatars` array, so the avatar stays consistent as long as the name doesn't change.
- The avatar image will use `loading="lazy"` and `decoding="async"` for performance consistency.
- Remove unused imports: `BotCharacter3D`, `DEFAULT_APPEARANCE`, `BotAppearance`, `BotTier`, `Palette`, `ChevronDown`, `AnimatePresence`.
- This will also eliminate the heavy Three.js 3D canvas from the builder sidebar, improving load performance.

