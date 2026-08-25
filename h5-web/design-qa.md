# Dish Selection Design QA

- source visual truth path: `/Users/wangshunxing/Desktop/好味录/h5-web/docs/dish-selection-reference.png`
- implementation screenshot path: `/Users/wangshunxing/Desktop/好味录/h5-web/docs/dish-selection-implementation.png`
- combined comparison path: `/Users/wangshunxing/Desktop/好味录/h5-web/docs/dish-selection-comparison.png`
- viewport: 380 × 720 CSS px
- source pixels: 834 × 1494; normalized to 402 × 720 for height-matched comparison
- implementation pixels: 380 × 720 at device scale factor 1
- state: dish selection, zero dishes selected, six API-provided dishes visible

## Full-view comparison evidence

The combined comparison confirms the requested intentional changes: the assistant identity is “李记”; the conversation bubbles are wider and visually stronger; the counter and copy both use a six-dish limit; the two-column, three-row grid begins lower than the reference; and each dish card is taller with more internal padding. The bottom action remains separated from the grid and visible inside the frame.

## Focused comparison evidence

The conversation and grid regions are legible in the full-height comparison, so a separate crop was not required. Typography, spacing, card radii, border weights, warm-white background, brand red, and icon treatment were checked directly in the combined image.

## Findings

- No actionable P0, P1, or P2 differences remain for the user-requested revision.
- Typography preserves the existing Chinese system-font hierarchy while increasing the two conversation text sizes.
- Spacing intentionally differs from the supplied screenshot: the grid is lower and cards are larger, matching the requested revision rather than the original captured state.
- Colors and visual tokens remain unchanged.
- No image assets are used on this screen; existing Lucide interface icons remain sharp and consistent.
- Copy is updated to “最多选择 6 道，方便为您定制心里的真实评价。” and “已选择 0 / 6 道菜”.

## Comparison history

- Initial reference issue: five-dish copy, “餐” avatar, compact conversation, and cards positioned too close to the dialogue.
- Fixes: changed the limit and backend rule to six, changed the avatar to “李记”, enlarged and lowered the conversation block, increased card height and padding, and moved the grid into the middle-lower portion of the screen.
- Post-fix evidence: `docs/dish-selection-comparison.png` shows all six cards, revised copy, the larger conversation, lower grid, and visible bottom action.

## Primary interactions checked

- Enter dish selection from the home CTA.
- Select all six dishes.
- Confirm the counter reaches 6 / 6 and the selected-state indicator reports six dishes.
- Confirm the next-step control remains visible.

## Final result

final result: passed
