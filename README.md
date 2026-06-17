# WHIF Point-and-Click Video Demo

A small React + TypeScript starter for a point-and-click mini game.

## Run

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Add Your Videos

Put your files in `public/assets/`:

- `scene-atrium.mp4`
- `scene-archive.mp4`

Or change the file names in `src/scenes.ts`.

## Move Clickable Areas

Edit the hotspot values in `src/scenes.ts`.

The numbers are percentages of the screen:

- `x`: distance from the left
- `y`: distance from the top
- `width`: clickable area width
- `height`: clickable area height
