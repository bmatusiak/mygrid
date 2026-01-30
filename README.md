# My Grid — Technical README

Game Description
----------------
My Grid is a touch-first, grid-logic puzzle played on a 10×10 lattice of dots. Players connect adjacent dots (up/down/left/right) to place orthogonal edges. Whenever four edges form the four sides of a unit cell, that 1×1 square becomes claimed and filled. The board gradually fills as edges and squares accumulate; the core objective is to claim squares by completing their boundaries.

Core gameplay:
- Board: 10 rows × 10 columns of dots (nodes).
- Move: place an edge between two orthogonally adjacent dots.
- Claim: when a cell's four edges exist, the cell is claimed and visually filled.
- Goal: claim squares, maximize your score (multiplayer/AI modes to be added).

Design notes:
- Play is sequential and local; touch-first interactions are prioritized for mobile and tablet devices.
- The camera supports panning and pinch-to-zoom so players can comfortably view and interact with the full board on small screens.



