
plugin.consumes = ['Phaser'];
plugin.provides = ['game'];
async function plugin(imports, register) {
    const { Phaser } = imports;
    await register(null, {
        game: {
            init: () => {
                const ROWS = 10;
                const COLS = 10;
                const config = {
                    type: Phaser.AUTO,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    backgroundColor: '#ffffff',
                    scale: {
                        mode: Phaser.Scale.RESIZE,
                        autoCenter: Phaser.Scale.CENTER_BOTH
                    },
                    scene: {
                        preload: preload,
                        create: create,
                        update: update
                    }
                };

                let game = new Phaser.Game(config);

                function preload() {
                }

                function create() {
                    const width = this.scale.width;
                    const height = this.scale.height;
                    const padding = 60;
                    const spacingX = (width - padding * 2) / (COLS - 1);
                    const spacingY = (height - padding * 2) / (ROWS - 1);
                    const spacing = Math.min(spacingX, spacingY);
                    const dotRadius = Math.round(Phaser.Math.Clamp(spacing * 0.07, 4, 10));
                    const hitRadius = Math.round(Phaser.Math.Clamp(spacing * 0.3, 16, 40));
                    const infoFontSize = Math.round(Phaser.Math.Clamp(width < 420 ? 12 : width < 900 ? 14 : 16, 12, 20));

                    const dots = {};
                    const edges = new Set();
                    const claimed = new Set();

                    const linesG = this.add.graphics();
                    const previewG = this.add.graphics();
                    const fillsG = this.add.graphics();

                    const dotGroup = this.add.group();

                    let selected = null;

                    function dotKey(r, c) { return `${r}_${c}` }
                    function hKey(r, c) { return `h_${r}_${c}` } // between (r,c) and (r,c+1)
                    function vKey(r, c) { return `v_${r}_${c}` } // between (r,c) and (r+1,c)
                    function cellKey(r, c) { return `cell_${r}_${c}` }

                    for (let r = 0; r < ROWS; r++) {
                        for (let c = 0; c < COLS; c++) {
                            const x = padding + c * spacing;
                            const y = padding + r * spacing;

                            // visible small dot and larger interactive zone for touch
                            const dot = this.add.circle(x, y, dotRadius, 0x333333);
                            const hit = this.add.circle(x, y, hitRadius, 0x000000, 0);
                            hit.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);
                            hit.setData('dot', dot);
                            dot.setData('r', r);
                            dot.setData('c', c);
                            dots[dotKey(r, c)] = { x, y };
                            dotGroup.add(dot);
                            hit.on('pointerdown', () => {
                                selected = { r, c };
                            });
                            // highlight on pointerover (useful for mouse)
                            hit.on('pointerover', () => {
                                dot.setFillStyle(0x666666);
                            });
                            hit.on('pointerout', () => {
                                dot.setFillStyle(0x333333);
                            });
                        }
                    }

                    const infoText = this.add.text(10, 10, 'Tap two adjacent dots to draw a line', { color: '#000', fontSize: infoFontSize });

                    function handleConnection(r, c) {
                        if (!selected) return;
                        // if same dot clicked, cancel
                        if (selected.r === r && selected.c === c) {
                            selected = null;
                            return;
                        }

                        // check adjacency (orthogonal)
                        const dr = Math.abs(selected.r - r);
                        const dc = Math.abs(selected.c - c);
                        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                            // determine edge key
                            if (dr === 0) {
                                // horizontal edge, smaller c is left
                                const row = r;
                                const leftC = Math.min(selected.c, c);
                                const key = hKey(row, leftC);
                                if (!edges.has(key)) {
                                    drawLineBetween(selected.r, selected.c, r, c);
                                    edges.add(key);
                                    checkSquaresAroundHorizontal(row, leftC);
                                }
                            } else {
                                // vertical edge, smaller r is top
                                const col = c;
                                const topR = Math.min(selected.r, r);
                                const key = vKey(topR, col);
                                if (!edges.has(key)) {
                                    drawLineBetween(selected.r, selected.c, r, c);
                                    edges.add(key);
                                    checkSquaresAroundVertical(topR, col);
                                }
                            }
                        }
                        selected = null;
                    }

                    function drawLineBetween(r1, c1, r2, c2) {
                        const a = dots[dotKey(r1, c1)];
                        const b = dots[dotKey(r2, c2)];
                        linesG.lineStyle(4, 0x000000, 1);
                        linesG.beginPath();
                        linesG.moveTo(a.x, a.y);
                        linesG.lineTo(b.x, b.y);
                        linesG.strokePath();
                    }

                    // input handling for touch and pinch-zoom / pan (viewport)
                    const cam = this.cameras.main;

                    // try to fit grid nicely
                    const gridWidth = spacing * (COLS - 1) + padding * 2;
                    const gridHeight = spacing * (ROWS - 1) + padding * 2;
                    // set camera bounds to the full grid so the viewport can pan over it
                    cam.setBounds(0, 0, gridWidth, gridHeight);
                    const zoomFit = Math.min(width / gridWidth, height / gridHeight) * 0.95;
                    cam.setZoom(Math.min(Math.max(zoomFit, 0.6), 1.5));

                    // when the canvas resizes, restart the scene so positions recalc for new size
                    this.scale.on('resize', () => {
                        this.scene.restart();
                    });

                    let activePointers = new Map();
                    let pinchInitial = null;
                    let cameraInitialZoom = cam.zoom;
                    let midStart = null;
                    let panActive = false;
                    let panStart = null;
                    let panScrollStart = null;

                    function getWorldPoint(pointer) {
                        return { x: pointer.worldX, y: pointer.worldY };
                    }

                    this.input.on('pointerdown', (pointer) => {
                        activePointers.set(pointer.id, { x: pointer.x, y: pointer.y });
                        if (activePointers.size === 2) {
                            const it = activePointers.values();
                            const p1 = it.next().value;
                            const p2 = it.next().value;
                            pinchInitial = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
                            cameraInitialZoom = cam.zoom;
                            midStart = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                        }
                        // start single-finger pan if nothing is selected
                        if (activePointers.size === 1 && !selected) {
                            panActive = true;
                            panStart = { x: pointer.x, y: pointer.y };
                            panScrollStart = { x: cam.scrollX, y: cam.scrollY };
                        }
                    });

                    this.input.on('pointerup', (pointer) => {
                        activePointers.delete(pointer.id);
                        if (selected) {
                            // find nearest dot to pointer world position
                            const worldX = pointer.worldX;
                            const worldY = pointer.worldY;
                            let best = null;
                            let bestDist = Infinity;
                            for (const k in dots) {
                                const d = dots[k];
                                const dist = Phaser.Math.Distance.Between(d.x, d.y, worldX, worldY);
                                if (dist < bestDist) { bestDist = dist; best = k }
                            }
                            if (bestDist <= hitRadius + 6) {
                                const [br, bc] = best.split('_').map(Number);
                                handleConnection(br, bc);
                            } else {
                                selected = null;
                            }
                        }
                        previewG.clear();
                        pinchInitial = null;
                        panActive = false;
                        panStart = null;
                        panScrollStart = null;
                    });

                    this.input.on('pointermove', (pointer) => {
                        if (activePointers.size === 2 && pinchInitial) {
                            // get two pointers
                            const arr = Array.from(this.input.manager.pointers).filter(p => p && p.isDown);
                            if (arr.length >= 2) {
                                const p1 = arr[0];
                                const p2 = arr[1];
                                const curDist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
                                const newZoom = Phaser.Math.Clamp(cameraInitialZoom * (curDist / pinchInitial), 0.5, 2);
                                // adjust camera zoom while keeping midpoint stable
                                const midNow = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                                const worldBefore = cam.getWorldPoint(midStart.x, midStart.y);
                                cam.setZoom(newZoom);
                                const worldAfter = cam.getWorldPoint(midNow.x, midNow.y);
                                cam.scrollX += (worldAfter.x - worldBefore.x);
                                cam.scrollY += (worldAfter.y - worldBefore.y);
                            }
                        } else if (selected) {
                            // draw preview line from selected dot to pointer world position
                            const a = dots[dotKey(selected.r, selected.c)];
                            previewG.clear();
                            previewG.lineStyle(3, 0x666666, 0.8);
                            previewG.beginPath();
                            previewG.moveTo(a.x, a.y);
                            previewG.lineTo(pointer.worldX, pointer.worldY);
                            previewG.strokePath();
                        }
                    });

                    // pan handling on pointer move when single finger and panActive
                    this.input.on('pointermove', (pointer) => {
                        if (panActive && activePointers.size === 1 && !selected) {
                            const dx = pointer.x - panStart.x;
                            const dy = pointer.y - panStart.y;
                            cam.scrollX = panScrollStart.x - dx / cam.zoom;
                            cam.scrollY = panScrollStart.y - dy / cam.zoom;
                            // clamp
                            cam.scrollX = Phaser.Math.Clamp(cam.scrollX, cam._bounds.x, cam._bounds.width - cam.width / cam.zoom);
                            cam.scrollY = Phaser.Math.Clamp(cam.scrollY, cam._bounds.y, cam._bounds.height - cam.height / cam.zoom);
                        }
                    });

                    function checkSquaresAroundHorizontal(r, c) {
                        // horizontal at (r,c) between (r,c)-(r,c+1)
                        // possible cells: above (r-1,c) and below (r,c)
                        checkCell(r - 1, c);
                        checkCell(r, c);
                    }

                    function checkSquaresAroundVertical(r, c) {
                        // vertical at (r,c) between (r,c)-(r+1,c)
                        // possible cells: left (r,c-1) and right (r,c)
                        checkCell(r, c - 1);
                        checkCell(r, c);
                    }

                    function hasEdge(key) { return edges.has(key) }

                    function checkCell(r, c) {
                        if (r < 0 || c < 0 || r >= ROWS - 1 || c >= COLS - 1) return;
                        const k = cellKey(r, c);
                        if (claimed.has(k)) return;
                        const top = hKey(r, c);
                        const bottom = hKey(r + 1, c);
                        const left = vKey(r, c);
                        const right = vKey(r, c + 1);
                        if (hasEdge(top) && hasEdge(bottom) && hasEdge(left) && hasEdge(right)) {
                            claimCell(r, c);
                        }
                    }

                    function claimCell(r, c) {
                        const topLeft = dots[dotKey(r, c)];
                        const margin = Math.max(6, Math.round(dotRadius + 2));
                        fillsG.fillStyle(0x00aa00, 0.6);
                        fillsG.fillRect(topLeft.x + margin, topLeft.y + margin, spacing - margin * 2, spacing - margin * 2);
                        claimed.add(cellKey(r, c));
                    }
                }

                function update() {
                }

                return game;
            }
        }
    });
}
module.exports = plugin;