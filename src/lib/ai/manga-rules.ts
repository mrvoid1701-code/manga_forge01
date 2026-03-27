/**
 * Contextual manga drawing rules injected into the system prompt
 * based on keywords detected in the user's prompt.
 *
 * Each rule set is activated when ANY of its trigger keywords match.
 * Multiple rule sets can be active simultaneously.
 */

interface MangaRuleSet {
  triggers: string[]
  rules: string
}

const MANGA_RULE_SETS: MangaRuleSet[] = [
  {
    triggers: ['face', 'character', 'portrait', 'head', 'manga', 'anime', 'girl', 'boy', 'person'],
    rules: `MANGA FACE RULES:
- Eyes must be large (60x38px outer ellipse) — manga eyes cover ~1/3 of face height
- Iris = bright colored circle (28px), pupil = dark circle (16px), 2 white highlights (8px + 4px white circles)
- Upper eyelashes: 6-8 thick curved strokes fanning upward and outward from iris edge
- Lower eyelashes: 3-4 short thin strokes
- Eyebrows: 2-3 paths, thick near nose bridge, tapering to thin at tail
- Nose: 2-3 minimal paths only — just nostrils and bottom shadow, no full outline
- Mouth: thin curved upper lip, fuller lower lip, vertical line at center crease
- Face oval: single smooth closed path, NOT straight segments
- Cheek blush: two addFilledRect or addShape ovals on shadows layer, color #f4b8b8, opacity simulated by small size`,
  },
  {
    triggers: ['hair', 'blonde', 'black hair', 'dark hair', 'white hair', 'silver', 'brunette', 'redhead', 'long hair', 'short hair'],
    rules: `MANGA HAIR RULES:
- Hair is drawn in SECTIONS, not individual strands: front section, side sections, back/volume section
- Each section = 8-15 paths of varying strokeWidth (2-4px)
- Strands curve AWAY from crown point, following gravity or wind direction
- Hair highlights: 3-5 addFilledRect/addShape white or light-colored thin rectangles running parallel to strand direction on color layer
- Hair shadow: darker version of hair color on shadows layer, under the mass of hair
- Bangs (if present): 8-12 individual curved paths hanging from forehead, overlapping slightly
- NEVER draw hair with horizontal lines — all strands flow from crown outward`,
  },
  {
    triggers: ['angry', 'mad', 'rage', 'furious', 'fierce'],
    rules: `ANGRY EXPRESSION RULES:
- Eyebrows: angled sharply inward and downward (V-shape), strokeWidth 4-5, positioned 10-15px lower than normal
- Eyes: narrow — reduce eye height by 30%, add heavy upper lid path
- Mouth: wide open showing teeth OR tight straight line
- Forehead vein: optional — 1-2 zigzag paths on forehead, strokeColor #cc4444, strokeWidth 2
- Blush lines: 3-4 short diagonal lines on each cheek, strokeColor #cc6666`,
  },
  {
    triggers: ['happy', 'smile', 'laugh', 'cheerful', 'joyful'],
    rules: `HAPPY EXPRESSION RULES:
- Eyes: slightly closed (arc shape), add curved line above and below
- Mouth: wide open U-curve with teeth visible (white addFilledRect inside), OR big smile arc
- Cheeks: round blush circles (addShape circle, fillColor #ffb0b0, large ~40px radius) on shadows layer
- Eyebrows: raised slightly, gentle arc`,
  },
  {
    triggers: ['sad', 'cry', 'tears', 'melancholy', 'sorrowful'],
    rules: `SAD EXPRESSION RULES:
- Eyebrows: inner corners raised, outer corners slightly lowered (reverse V)
- Eyes: slightly downcast, add glistening highlight circles (large white circles 12px)
- Tears: 2-3 teardrop paths from eye corner, strokeColor #99ccff, fillColor #bbddff
- Mouth: slight downward curve`,
  },
  {
    triggers: ['action', 'fight', 'battle', 'punch', 'kick', 'speed', 'fast', 'dynamic'],
    rules: `ACTION/SPEED RULES:
- Speed lines: 20-30 addPath lines radiating FROM a focal point (impact point or character center)
  Each line = 2 points, strokeWidth 1-3, strokeColor #333333, varying length 20-80px
- Impact star: 8-12 triangular spike paths around impact point on lineart layer
- Motion blur: 5-8 slightly offset duplicate paths of moving limbs, strokeColor #aaaaaa, strokeWidth 1
- Pose: exaggerate limb angles — arms/legs at extreme angles (not straight)`,
  },
  {
    triggers: ['background', 'scene', 'landscape', 'city', 'forest', 'school', 'room', 'sky'],
    rules: `BACKGROUND RULES:
- Use perspective lines — 10-15 addPath lines converging to vanishing point
- Layer depth: far elements (low strokeWidth 1, lighter colors), near elements (strokeWidth 3-4, darker)
- Sky: 3-4 addFilledRect gradient blocks from top (darker) to horizon (lighter)
- Ground: addFilledRect with subtle texture paths on top
- Never leave background layer empty — minimum 3-4 filled areas`,
  },
  {
    triggers: ['chibi', 'cute', 'kawaii', 'small', 'tiny', 'mini'],
    rules: `CHIBI STYLE RULES:
- Head = 1/2 of total body height (normal is 1/7)
- Eyes: enormous, 40x40px iris circles, minimal pupil
- Body: very short, round limbs
- No nose — just a tiny dot or skip entirely
- Mouth: small simple arc
- Cheeks: large round blush (addShape circle, 50px radius, fillColor #ffaaaa)`,
  },
]

/**
 * Selects and returns relevant manga rules based on keywords in the user's prompt.
 * Returns an empty string if no rules match (keeps system prompt lean).
 */
export function selectRelevantRules(prompt: string): string {
  const lower = prompt.toLowerCase()

  const matched = MANGA_RULE_SETS.filter((ruleSet) =>
    ruleSet.triggers.some((trigger) => lower.includes(trigger))
  )

  if (matched.length === 0) return ''

  return `\n\nCONTEXTUAL RULES FOR THIS DRAWING:\n${matched.map((r) => r.rules).join('\n\n')}`
}
