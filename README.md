# Blackboard

This is a whiteboard(blackboard) project made with sveltekit, tauri and konva. It's intended to be a foundation to build similar projects, but it is in no way a production ready app.

# Features

1. Draw shapes like, lines, curves, rectangles, circle/ellipses, polygons.
2. Place texts and edit (Double click to edit)
3. Shapes can be moved around and resized.
   - _Moving the lines, freeform curves and polygons doesn't work for some reason. It has probably to do with Konva.Line configuration since all these shapes are built on Konva.Line._
4. Take screenshots.
   - _On Mac, it requires some permissions. Might not be the case on Windows and linux, not tested._
5. Copy and paste images on the board (CTRL+V / COMMAND + V)
6. Timer
7. Save and load saved boards.

# Installing

You can find the executables in the releases sections.

# Build it from source

1. Clone the repo `git@github.com:instrukti/blackboard.git`
2. Install dependencies `cd blackboard && npm i`
3. Run the app `npm run tauri dev` or install and run `npm run tauri build`
