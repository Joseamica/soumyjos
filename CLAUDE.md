# SoumyJos — Save the Date

Single-page static wedding invitation (index.html + `.ics` + preview images), deployed to Cloudflare Pages at `soumyjos.com`. Spanish (es_MX). The event is **20 de Marzo 2027** in Ciudad de México. Most guests open the link from inside WhatsApp on their phone.

## Design Context

### Users

Wedding guests of Soumi & Jos — friends and family of varying ages, opening a link on their phone, usually from inside WhatsApp. The job to be done is simple: understand the date and place, feel the weight and warmth of the moment, and save the event to their calendar before closing the tab. The invitation is sent once, read in under a minute, and ideally revisited. It must render beautifully on small screens with no prior context.

### Brand Personality

Three words: **quiet · refined · heartfelt.**

The voice is formal Spanish (es_MX), understated, and unrushed. It should feel like receiving a piece of embossed stationery in the mail — sophisticated but never cold. The emotional goal is a hushed sense of anticipation: guests should close the tab feeling honored to be invited, not entertained.

Tone rules:
- Whisper, don't announce. No exclamations, no marketing urgency, no emoji.
- Warmth over wit. Charm through restraint and precision of detail, not cleverness.
- Singular, intimate moments over broadcasted energy.

### Aesthetic Direction

**Canon — do not replace, only refine:**
- Palette: warm cream grounds (`#faf5ef`, `#ede4d8`) with deep burgundy accent (`#8b2e2e`), muted browns (`#3b1f10`, `#6b4432`, `#9a6855`, `#b59a85`), and a red-brown secondary (`#a04535`). Light mode only.
- Typography: `Cormorant Garamond` (italic, thin/regular) for names, dates, display; `Jost` (200–400 weights, wide `.22em–.55em` letter-spacing, uppercase) for labels and microcopy.
- Photography: B&W with subtle contrast boost (`grayscale(100%) contrast(1.08)`), full-color hero, generous crops, no filters beyond what exists.
- Composition: single centered card on warm ground, photo grids top and bottom, hero with gradient overlay, soft shadow depth, thin rule dividers (`.3` opacity).
- Motion: minimal and purposeful — the existing `rise` entrance animation is the ceiling.

**References (aspirational feel):**
- Quiet luxury, hushed. The feel of opening an embossed card inside a linen envelope.
- Editorial stationery — De Gournay, Smythson, Mrs. John L. Strong.

**Anti-references (explicitly avoid):**
- Tech / SaaS polish: bright gradients, geometric sans-only typography, AI-slop illustrations, startup-landing-page rhythms.
- Loud or maximalist: heavy color blocks, oversized bold type, busy patterns, too many competing elements.
- Generic wedding-template tropes should also be avoided by default: script fonts with long tails, watercolor florals, rose-gold glitter, countdown clocks, confetti.

### Design Principles

1. **Preserve the canon.** The palette, type stack, and compositional rhythm are source-of-truth. Every change refines within these constraints; it does not replace them.
2. **Whisper, never announce.** Restraint is the brand. If a choice is between quieter and louder, choose quieter.
3. **Editorial, not marketing.** Treat the page like a printed invitation, not a product. No CTAs that feel transactional, no copy that performs.
4. **Detail is reverence.** Letter-spacing, hairline rules, generous whitespace, considered crops — the care in micro-details is what makes guests feel honored.
5. **Accessibility is light-touch.** This is a single-page heirloom, not a product. Don't let audits override aesthetic decisions; apply common sense (legible body sizes, working focus states) without industrializing the craft.

## Implementation notes

- `index.html` is a single self-contained file; images are inlined as base64. Line counts are small (~443 lines) but the file weighs ~900KB because of the image payload — budget read calls with offset/limit.
- `_headers` and `_redirects` are Cloudflare Pages / Netlify deploy configs; the `.ics` MIME type must remain `text/calendar; charset=utf-8` with `Content-Disposition: attachment`.
- `Soumi-Jos-SaveTheDate.ics` ships 3 `VALARM` reminders: 1 month before, 5 days before, and morning of the event (9am CDMX). If the wedding date ever changes, regenerate this file alongside the HTML copy.
- Deploy path: drag-upload the folder to Cloudflare Pages (no GitHub connect); custom domain `soumyjos.com` sits in front.
