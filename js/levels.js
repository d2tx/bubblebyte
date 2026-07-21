// Level configurations
export const levelConfigs = [
    // ------------------------------
    // World 1 (Levels 1-6): Basics & First Verticality
    // ------------------------------
    // Level 1: Single standard bubble to learn the basics.
    {
        bubbles: [
            { x: 400, y: 160, size: 4, type: 'standard' }
        ]
    },
    // Level 2: Two standard bubbles with simple spacing.
    {
        bubbles: [
            { x: 260, y: 160, size: 3, type: 'standard' },
            { x: 540, y: 160, size: 3, type: 'standard' }
        ]
    },
    // Level 3: Add a faster small bubble to mix pacing.
    {
        bubbles: [
            { x: 400, y: 150, size: 4, type: 'standard' },
            { x: 520, y: 220, size: 2, type: 'fast' }
        ]
    },
    // Level 4: Three standard bubbles to widen coverage.
    {
        bubbles: [
            { x: 220, y: 160, size: 3, type: 'standard' },
            { x: 400, y: 160, size: 3, type: 'standard' },
            { x: 580, y: 160, size: 3, type: 'standard' }
        ]
    },
    // Level 5: Heavy center bubble with two smaller companions.
    {
        bubbles: [
            { x: 400, y: 150, size: 4, type: 'heavy' },
            { x: 260, y: 230, size: 2, type: 'standard' },
            { x: 540, y: 230, size: 2, type: 'standard' }
        ]
    },
    // Level 6: First laddered layout with two floors.
    {
        bubbles: [
            { x: 260, y: 170, size: 2, type: 'drifter' },
            { x: 540, y: 170, size: 2, type: 'ghost' },
            { x: 300, y: 520, size: 2, type: 'drifter' },
            { x: 580, y: 520, size: 2, type: 'heavy' }
        ],
        platforms: [
            { x: 0, y: 360, width: 800, height: 22 }
        ],
        ladders: [
            { x: 80, y: 360, width: 28, height: 340 }
        ],
        ceilingSpikes: false
    },
    // ------------------------------
    // World 2 (Levels 7-12): Motion Styles
    // ------------------------------
    // Level 7: Fast middle bubble forces active repositioning.
    {
        bubbles: [
            { x: 200, y: 150, size: 3, type: 'standard' },
            { x: 400, y: 150, size: 3, type: 'fast' },
            { x: 600, y: 150, size: 3, type: 'standard' }
        ]
    },
    // Level 8: First zigzag bubbles to teach directional flips.
    {
        bubbles: [
            { x: 400, y: 150, size: 4, type: 'standard' },
            { x: 260, y: 230, size: 2, type: 'zigzag' },
            { x: 540, y: 230, size: 2, type: 'zigzag' }
        ]
    },
    // Level 9: Rubber bubbles introduce bouncy timing.
    {
        bubbles: [
            { x: 220, y: 150, size: 3, type: 'rubber' },
            { x: 400, y: 150, size: 3, type: 'standard' },
            { x: 580, y: 150, size: 3, type: 'rubber' }
        ]
    },
    // Level 10: First wall gate with mixed bubble speeds.
    {
        bubbles: [
            { x: 360, y: 140, size: 4, type: 'heavy' },
            { x: 200, y: 210, size: 3, type: 'fast' },
            { x: 600, y: 210, size: 3, type: 'standard' },
            { x: 320, y: 250, size: 2, type: 'drifter' }
        ],
        walls: [
            {
                x: 520,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 0, xMax: 520 }
            }
        ]
    },
    // Level 11: Row of fast small bubbles for quick reactions.
    {
        bubbles: [
            { x: 160, y: 150, size: 2, type: 'fast' },
            { x: 320, y: 150, size: 2, type: 'fast' },
            { x: 480, y: 150, size: 2, type: 'fast' },
            { x: 640, y: 150, size: 2, type: 'standard' }
        ]
    },
    // Level 12: Laddered zigzag trio with a lower floor.
    {
        bubbles: [
            { x: 200, y: 170, size: 2, type: 'drifter' },
            { x: 400, y: 170, size: 2, type: 'ghost' },
            { x: 600, y: 170, size: 2, type: 'drifter' },
            { x: 280, y: 510, size: 2, type: 'heavy' },
            { x: 520, y: 510, size: 2, type: 'drifter' }
        ],
        platforms: [
            { x: 0, y: 350, width: 800, height: 22 }
        ],
        ladders: [
            { x: 700, y: 350, width: 28, height: 350 }
        ],
        ceilingSpikes: false
    },
    // ------------------------------
    // World 3 (Levels 13-18): Visibility & Deception
    // ------------------------------
    // Level 13: Ghost bubbles add semi-opaque target tracking.
    {
        bubbles: [
            { x: 220, y: 150, size: 3, type: 'ghost' },
            { x: 440, y: 150, size: 3, type: 'fast' },
            { x: 660, y: 150, size: 3, type: 'ghost' }
        ]
    },
    // Level 14: Ghost + drifter pacing to teach delayed threat reads.
    {
        bubbles: [
            { x: 220, y: 150, size: 3, type: 'ghost' },
            { x: 440, y: 160, size: 3, type: 'drifter' },
            { x: 660, y: 150, size: 3, type: 'ghost' },
            { x: 400, y: 230, size: 2, type: 'rubber' }
        ]
    },
    // Level 15: Phase-shift debut with simple escorts.
    {
        bubbles: [
            { x: 280, y: 150, size: 3, type: 'phaseShift' },
            { x: 540, y: 150, size: 3, type: 'standard' },
            { x: 400, y: 230, size: 2, type: 'fast' }
        ]
    },
    // Level 16: Phase-shift and ghost split lanes through a gate.
    {
        bubbles: [
            { x: 220, y: 150, size: 3, type: 'phaseShift' },
            { x: 520, y: 150, size: 3, type: 'ghost' },
            { x: 360, y: 230, size: 2, type: 'drifter' },
            { x: 600, y: 230, size: 2, type: 'fast' }
        ],
        walls: [
            {
                x: 420,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 0, xMax: 420 }
            }
        ]
    },
    // Level 17: Rhythm debut layered with deceptive movement.
    {
        bubbles: [
            { x: 220, y: 150, size: 3, type: 'rhythm' },
            { x: 440, y: 150, size: 3, type: 'ghost' },
            { x: 660, y: 150, size: 3, type: 'phaseShift' },
            { x: 400, y: 230, size: 2, type: 'fast' }
        ]
    },
    // Level 18: World exam with deception trio and route gate.
    {
        bubbles: [
            { x: 220, y: 150, size: 3, type: 'phaseShift' },
            { x: 440, y: 150, size: 3, type: 'rhythm' },
            { x: 660, y: 150, size: 3, type: 'ghost' },
            { x: 320, y: 230, size: 2, type: 'fast' },
            { x: 560, y: 230, size: 2, type: 'zigzag' }
        ],
        walls: [
            {
                x: 360,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 360, xMax: 800 }
            }
        ]
    },

    // ------------------------------
    // World 4 (Levels 19-24): Gates & Routing
    // ------------------------------
    // Level 19: Simple left-clear gate with heavy anchor.
    {
        bubbles: [
            { x: 260, y: 150, size: 4, type: 'heavy' },
            { x: 520, y: 180, size: 2, type: 'fast' },
            { x: 320, y: 220, size: 2, type: 'drifter' },
            { x: 620, y: 220, size: 2, type: 'zigzag' }
        ],
        walls: [
            {
                x: 520,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 0, xMax: 520 }
            }
        ]
    },
    // Level 20: Armored debut in a right-clear route.
    {
        bubbles: [
            { x: 220, y: 150, size: 4, type: 'armored' },
            { x: 520, y: 170, size: 3, type: 'fast' },
            { x: 340, y: 230, size: 2, type: 'fast' },
            { x: 620, y: 230, size: 2, type: 'zigzag' }
        ],
        walls: [
            {
                x: 300,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 300, xMax: 800 }
            }
        ]
    },
    // Level 21: Dual-lane gate puzzle with rhythm control.
    {
        bubbles: [
            { x: 220, y: 150, size: 3, type: 'rhythm' },
            { x: 580, y: 150, size: 3, type: 'fast' },
            { x: 400, y: 220, size: 2, type: 'phaseShift' }
        ],
        walls: [
            {
                x: 440,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 0, xMax: 440 }
            }
        ]
    },
    // Level 22: Tiny swarm route-check with armored core.
    {
        bubbles: [
            { x: 140, y: 150, size: 1, type: 'fast' },
            { x: 220, y: 150, size: 1, type: 'zigzag' },
            { x: 300, y: 150, size: 1, type: 'fast' },
            { x: 380, y: 150, size: 1, type: 'zigzag' },
            { x: 460, y: 150, size: 1, type: 'fast' },
            { x: 540, y: 150, size: 1, type: 'rhythm' },
            { x: 620, y: 150, size: 1, type: 'fast' },
            { x: 700, y: 150, size: 1, type: 'zigzag' },
            { x: 400, y: 220, size: 2, type: 'armored' }
        ],
        walls: [
            {
                x: 400,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 0, xMax: 400 }
            }
        ]
    },
    // Level 23: Three-floor route planning under split threats.
    {
        bubbles: [
            { x: 200, y: 150, size: 2, type: 'ghost' },
            { x: 520, y: 150, size: 2, type: 'drifter' },
            { x: 360, y: 300, size: 2, type: 'heavy' },
            { x: 600, y: 300, size: 2, type: 'drifter' },
            { x: 260, y: 520, size: 2, type: 'heavy' },
            { x: 540, y: 520, size: 2, type: 'drifter' }
        ],
        platforms: [
            { x: 0, y: 260, width: 800, height: 22 },
            { x: 0, y: 460, width: 800, height: 22 }
        ],
        ladders: [
            { x: 70, y: 460, width: 28, height: 240 },
            { x: 700, y: 260, width: 28, height: 200 }
        ],
        ceilingSpikes: false
    },
    // Level 24: World finale with armored + phase route lock.
    {
        bubbles: [
            { x: 240, y: 150, size: 3, type: 'armored' },
            { x: 560, y: 150, size: 3, type: 'phaseShift' },
            { x: 360, y: 220, size: 2, type: 'zigzag' },
            { x: 440, y: 240, size: 2, type: 'drifter' }
        ],
        walls: [
            {
                x: 520,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 0, xMax: 520 }
            }
        ]
    },

    // ------------------------------
    // World 5 (Levels 25-30): Tempo Pressure
    // ------------------------------
    // Level 25: Closing-wall intro with readable threat spread.
    {
        bubbles: [
            { x: 180, y: 150, size: 3, type: 'fast' },
            { x: 400, y: 150, size: 3, type: 'rhythm' },
            { x: 620, y: 150, size: 3, type: 'ghost' },
            { x: 260, y: 230, size: 2, type: 'zigzag' }
        ],
        closingWall: true
    },
    // Level 26: Heavy core with split lanes and gate pressure.
    {
        bubbles: [
            { x: 340, y: 140, size: 4, type: 'heavy' },
            { x: 180, y: 200, size: 3, type: 'fast' },
            { x: 520, y: 200, size: 3, type: 'fast' },
            { x: 280, y: 250, size: 2, type: 'zigzag' },
            { x: 600, y: 250, size: 2, type: 'rubber' }
        ],
        walls: [
            {
                x: 400,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 0, xMax: 400 }
            }
        ]
    },
    // Level 27: Fast micro-threat field for tempo control.
    {
        bubbles: [
            { x: 160, y: 150, size: 2, type: 'fast' },
            { x: 320, y: 150, size: 2, type: 'rhythm' },
            { x: 480, y: 150, size: 2, type: 'phaseShift' },
            { x: 640, y: 150, size: 2, type: 'fast' },
            { x: 240, y: 230, size: 1, type: 'fast' },
            { x: 560, y: 230, size: 1, type: 'fast' }
        ]
    },
    // Level 28: Closing wall + dual boss bubbles.
    {
        bubbles: [
            { x: 260, y: 150, size: 4, type: 'heavy' },
            { x: 540, y: 150, size: 4, type: 'armored' },
            { x: 360, y: 220, size: 2, type: 'zigzag' }
        ],
        closingWall: true
    },
    // Level 29: Route break under deception mix.
    {
        bubbles: [
            { x: 220, y: 150, size: 3, type: 'phaseShift' },
            { x: 440, y: 150, size: 3, type: 'ghost' },
            { x: 660, y: 150, size: 3, type: 'rhythm' },
            { x: 320, y: 230, size: 2, type: 'fast' },
            { x: 560, y: 230, size: 2, type: 'fast' }
        ],
        walls: [
            {
                x: 300,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 300, xMax: 800 }
            }
        ]
    },
    // Level 30: World finale with closing wall and mixed pressure.
    {
        bubbles: [
            { x: 240, y: 150, size: 4, type: 'armored' },
            { x: 560, y: 150, size: 3, type: 'phaseShift' },
            { x: 400, y: 210, size: 3, type: 'rhythm' },
            { x: 300, y: 250, size: 2, type: 'fast' },
            { x: 500, y: 250, size: 2, type: 'zigzag' }
        ],
        closingWall: true
    },

    // ------------------------------
    // World 6 (Levels 31-36): Mastery Gauntlet
    // ------------------------------
    // Level 31: Tiny mix of fast, zigzag, and phase-shift.
    {
        bubbles: [
            { x: 140, y: 150, size: 1, type: 'fast' },
            { x: 220, y: 150, size: 1, type: 'zigzag' },
            { x: 300, y: 150, size: 1, type: 'phaseShift' },
            { x: 380, y: 150, size: 1, type: 'fast' },
            { x: 460, y: 150, size: 1, type: 'rhythm' },
            { x: 540, y: 150, size: 1, type: 'fast' },
            { x: 620, y: 150, size: 1, type: 'zigzag' },
            { x: 700, y: 150, size: 1, type: 'fast' },
            { x: 400, y: 220, size: 2, type: 'armored' }
        ]
    },
    // Level 32: Fast, phase-shift, and armored density + closing crush wall.
    {
        bubbles: [
            { x: 180, y: 150, size: 3, type: 'fast' },
            { x: 380, y: 150, size: 3, type: 'phaseShift' },
            { x: 580, y: 150, size: 3, type: 'ghost' },
            { x: 260, y: 220, size: 2, type: 'fast' },
            { x: 500, y: 220, size: 2, type: 'zigzag' },
        ],
        closingWall: true
    },
    // Level 33: Armored and phase-shift wall challenge.
    {
        bubbles: [
            { x: 260, y: 150, size: 4, type: 'armored' },
            { x: 540, y: 150, size: 4, type: 'phaseShift' },
            { x: 200, y: 230, size: 2, type: 'fast' },
            { x: 400, y: 230, size: 2, type: 'zigzag' },
            { x: 620, y: 230, size: 2, type: 'rhythm' }
        ],
        walls: [
            {
                x: 440,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 0, xMax: 440 }
            }
        ]
    },
    // Level 34: Speedy small swarm with armored anchor.
    {
        bubbles: [
            { x: 150, y: 150, size: 1, type: 'fast' },
            { x: 230, y: 150, size: 1, type: 'zigzag' },
            { x: 310, y: 150, size: 1, type: 'fast' },
            { x: 390, y: 150, size: 1, type: 'rhythm' },
            { x: 470, y: 150, size: 1, type: 'phaseShift' },
            { x: 550, y: 150, size: 1, type: 'fast' },
            { x: 630, y: 150, size: 1, type: 'zigzag' },
            { x: 710, y: 150, size: 1, type: 'fast' },
            { x: 400, y: 230, size: 2, type: 'armored' }
        ]
    },
    // Level 35: Dual boss bubbles with quick mids + closing crush wall.
    {
        bubbles: [
            { x: 260, y: 150, size: 4, type: 'heavy' },
            { x: 540, y: 150, size: 4, type: 'armored' },
            { x: 480, y: 230, size: 2, type: 'zigzag' },
            { x: 400, y: 230, size: 2, type: 'fast' }
        ],
        closingWall: true
    },
    // Level 36: Final mix with wall gate and every archetype.
    {
        bubbles: [
            { x: 220, y: 150, size: 4, type: 'phaseShift' },
            { x: 560, y: 150, size: 3, type: 'armored' },
            { x: 380, y: 200, size: 3, type: 'rhythm' },
            { x: 260, y: 240, size: 2, type: 'fast' },
            { x: 520, y: 240, size: 2, type: 'zigzag' },
            { x: 400, y: 260, size: 2, type: 'drifter' }
        ],
        walls: [
            {
                x: 400,
                width: 18,
                doorHeight: 68,
                unlockRegion: { xMin: 0, xMax: 400 }
            }
        ]
    }
];
