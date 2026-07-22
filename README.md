# bubblebyte

A browser-based arcade game inspired by *Bubble Trouble* / *Pang*, built from scratch with vanilla JavaScript and HTML5 Canvas.

Pop the bubbles. Don't let them touch you. Clear all 36 levels spread across 6 worlds.

## Play

[**Play online**](https://d2tx.github.io/bubblebyte/)

Or serve locally:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Controls

| Key | Action |
| --- | ------ |
| ← → / A D | Move |
| ↑ / W / Space | Shoot harpoon |
| ↓ / S | Climb down ladder |
| Tab | Pause |
| Shift+T | Dev terminal |

## Features

- 36 hand-crafted levels with walls, platforms, ladders, closing walls and ceiling spikes
- 9 bubble types — standard, fast, heavy, rubber, ghost, zigzag, drifter, phase-shift, armored, rhythm
- 4 power-ups — power wire, time freeze, slow-mo, auto-gun
- NES-style procedural chiptune music and sound effects (Web Audio API — no audio files)
- 13 color themes
- CRT effect, FPS counter, fullscreen mode
- German / English language support
- Persistent progress via localStorage

## License

MIT — see [LICENSE](./LICENSE) for details.
