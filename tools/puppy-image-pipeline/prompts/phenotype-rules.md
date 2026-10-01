Each generation request appends a deterministic structured phenotype block built from the
TypeScript resolver export row:

- public name
- coat type (short, fluffy, hairless)
- base pigment family or hidden-pigment marker
- visible phaeomelanin regions
- visible overlays (mask, brindle, merle, pied)
- representative eye rule
- Big Rope flag
- explicitly hidden traits

Rules:

1. Do not invent DNA or hidden traits in Python.
2. Keep `visible_signature` as the immutable dedupe key.
3. Do not mutate public naming rules to satisfy filename preferences.
4. Preserve Solid constraints: no invented white blaze, chest stripe, socks, toes, or patches.
5. Respect masking behavior for Cream, Platinum, Pink, and Intensity outcomes.
