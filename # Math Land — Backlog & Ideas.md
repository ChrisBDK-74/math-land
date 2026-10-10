# Math Land — Backlog & Ideas

Living list of what's shipped, what's agreed-but-not-built, and open brainstorm threads — so nothing gets lost between sessions.

## Shipped
- Core practice engine: addition, subtraction, multiplication, config-driven stages with a spaced-repetition-style mastery model (per-item strength, sustained-session mastery).
- Operation sub-menu (Addition / Subtraction / Multiplication / Mix) above the question card — currently **unlocked from progression gating** (always draws from all stages) so Christian's son can test every operation now; "Mix" mode is the only one still mastery-gated.
- Full onboarding flow: Landing ("Start playing") → Name ("Hi there, what's your name?") → Details (age + theme picker) → main app.
- Age-based difficulty floor: a profile's age sets a starting stage via `ageFloors.json`, just a starting guess — the always-unlocked sub-menu is the safety net if the guess is wrong.
- Space-themed ("Starlight Voyager") landing page: dark gradient background, rocket illustration, scattered stars, planets, "Welcome to / Math Land" title — live in the app.
- GitHub repo (`math-land`) set up, first commits pushed.
- Deployed to Fly.io (Docker + nginx static hosting, scales to zero when idle).

## Next up — Space Mission (v1), agreed in detail
Replaces the plain "theme" picker (rockets/flowers/surprise) with a **mission** choice. For now there's one mission: Space Mission.

- After picking "Space Mission," a short intro modal (Christian will write the copy) sets up the goal: build a rocket and reach the Moon.
- The rocket has **7 pieces** — 4 tail fins, the hull, 2 windows — mapping 1:1 onto the 7 existing mastery stages (fluency check-in → 2-digit add/sub → regrouping → 4 multiplication stages).
- Each set of questions (10–15) that scores **at least 10/15 correct** adds the next piece and advances the stage (opens slightly harder problems).
- Falling short doesn't add a piece and doesn't advance — shown with an encouraging retry message, not a failure message. Agreed tone example: *"Ah, you almost got it, let's try again. We really need that piece for the rocket to launch!"*
- Completing all 7 pieces = rocket reaches the Moon = the "grand finale" for this content set. This **is** the long-standing "visual tube/mascot-growth" gamification idea from earlier — the rocket build *is* that visual, so that item is effectively folded into this plan rather than needing separate work.
- Scope line: get Space Mission fully working end-to-end as v1. Don't block on anything below.

### Still open within Space Mission
- Exact wording/visuals for each of the 7 piece-added moments (celebration beat per piece).
- Whether mission mode becomes the primary play mode (replacing "Mix") or sits alongside the existing operation sub-menu as a separate area.
- Re-locking the sub-menu back to mastery-gated progression was planned once a progress visual existed — the rocket build may now be that trigger. Revisit once Space Mission ships.

## Other gamification ideas (agreed order, from the original brainstorm — items 2 & 4 are now largely covered by Space Mission above)
1. Rename "mastered" to something more kid-friendly — still open.
2. ~~Immediate per-session reward~~ → covered by rocket pieces.
3. Long-term progress number that moves every session (e.g. average strength instead of "% fully mastered") — still open, independent of the mission visual.
4. ~~Visual progress indicator instead of raw percentage~~ → covered by the rocket build.
5. Streaks / personal bests — still open.
6. In-session micro-rewards (e.g. a star/coin ticking up per correct answer) — still open.

## Future mission content (v2+, not scoped yet)
- A fairy-tale mission using a public-domain Andersen or Grimm tale, where solving problems advances the story. How exactly a story "advances" alongside math problems is unresolved — needs its own design pass. Treat as a template/pattern once Space Mission proves the mission mechanic works, not before.
- Possible "Baghdad / House of Wisdom" mission tied to the Algebra track below (the history of algebra is genuinely good story material).

## Algebra — separate phase, after Space Mission
- New top-level nav item ("Algebra"), with its own operation-style submenu underneath, consistent with how Addition/Subtraction/Multiplication work today.
- Needs a real new question type (e.g. missing-number problems like `3 + ? = 7`) — a bigger lift than it looks, since today's engine only knows "type the final answer," not "solve for a blank." Needs new UI for a missing-slot input and new grading logic.
- Age range: simple missing-number problems are approachable from ~7–8; more formal algebra fits better toward 10–12. Should ramp in difficulty like the existing stages do.
- Christian wants a short, kid-friendly "what is algebra and where did it come from" write-up for the Resources/How-to section — hook idea: the word comes from Arabic *al-jabr*, from 9th-century Baghdad mathematician al-Khwarizmi (also the root of "algorithm").

## Small loose ends
- `index.html`'s browser tab title still says "Math Practice" (old working title) — landing page itself now says "Math Land," but the tab title wasn't explicitly asked to change. Low priority.
- `ageFloors.json` thresholds (8/10/12) were set back when the target range was 8–10; now that it's officially 6–12, these may be worth revisiting.
- Mastery thresholds were already loosened once (unlock fraction 0.8→0.5, required sessions 3→2) to reduce demotivation — keep an eye on whether that's still the right balance once the rocket-piece system is the primary feedback loop.