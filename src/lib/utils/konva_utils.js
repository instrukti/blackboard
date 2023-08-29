import Konva from "konva";
import { get, writable } from "svelte/store";
import { removeFile, readBinaryFile, writeBinaryFile, readTextFile, exists, createDir, writeTextFile, BaseDirectory } from "@tauri-apps/api/fs";
import { open } from "@tauri-apps/api/dialog";
import { appWindow } from "@tauri-apps/api/window";
import { documentDir } from "@tauri-apps/api/path";
import toast from "svelte-french-toast";
import { invoke } from "@tauri-apps/api";

export const stroke = writable("red");
export const strokeWidth = writable(1);
export const fill = writable("transparent");
export const editingSavedBoard = writable(null);
export const drawing = writable(false);
export const takingScreenshot = writable(false);
takingScreenshot.subscribe((val) => {
  appWindow.setFullscreen(val);
});
setTimeout(() => {
  strokeWidth.subscribe((val) => {
    if (seletedNodes.length > 0) {
      seletedNodes.forEach((node) => {
        node.setAttr("strokeWidth", val);
      });
    }
  });
  stroke.subscribe((val) => {
    if (seletedNodes.length > 0) {
      seletedNodes.forEach((node) => {
        node.setAttr("stroke", val);
      });
    }
  });
  fill.subscribe((val) => {
    if (seletedNodes.length > 0) {
      seletedNodes.forEach((node) => {
        node.setAttr("fill", val);
      });
    }
  });
}, 1000);

/** @type {Konva.Node[]} */
let seletedNodes = [];
/** @type {Konva.Node[]} */
let shapes = [];
drawing.subscribe((isDrawing) => {
  shapes.forEach((shape) => {
    shape.draggable(!isDrawing);
  });
});
export const drawRectangle = (/** @type {Konva.Stage} */ stage, /** @type {Konva.Layer} */ layer, /** @type {Konva.Transformer} */ tr) => {
  drawing.set(true);
  let isDrawing = false;
  document.body.style.cursor = "crosshair";
  /** @type {Konva.Vector2d | null} */
  let startPos = null;
  /** @type {Konva.Vector2d | null} */
  let endPos = null;
  /** @type {Konva.Rect} */
  let previewShape;
  stage.on("pointerdown", () => {
    startPos = stage.getPointerPosition();
    isDrawing = true;
    if (startPos) {
      previewShape = new Konva.Rect({
        x: startPos.x,
        y: startPos.y,
        width: 0,
        height: 0,
        fill: get(fill),
        stroke: get(stroke),
        strokeWidth: get(strokeWidth),
      });
      layer.add(previewShape);
    }
  });
  stage.on("pointermove", () => {
    if (!isDrawing) return;
    endPos = stage.getPointerPosition();
    if (startPos && endPos && startPos.x > endPos.x) {
      let temp = startPos.x;
      startPos.x = endPos.x;
      endPos.x = temp;
    }
    if (startPos && endPos && startPos.y > endPos.y) {
      let temp = startPos.y;
      startPos.y = endPos.y;
      endPos.y = temp;
    }
    if (startPos && endPos) {
      const { x, y } = startPos;
      const width = Math.abs(endPos.x - x);
      const height = Math.abs(endPos.y - y);
      previewShape.setAttr("width", width);
      previewShape.setAttr("height", height);
      layer.batchDraw();
    }
  });
  stage.on("pointerup", () => {
    isDrawing = false;
    previewShape.destroy();
    endPos = stage.getPointerPosition();
    if (startPos && endPos && startPos.x > endPos.x) {
      let temp = startPos.x;
      startPos.x = endPos.x;
      endPos.x = temp;
    }
    if (startPos && endPos && startPos.y > endPos.y) {
      let temp = startPos.y;
      startPos.y = endPos.y;
      endPos.y = temp;
    }
    if (startPos && endPos) {
      const { x, y } = startPos;
      const width = Math.abs(endPos.x - x);
      const height = Math.abs(endPos.y - y);
      const rect = new Konva.Rect({
        x,
        y,
        width,
        height,
        fill: get(fill),
        stroke: get(stroke),
        strokeWidth: get(strokeWidth),
      });
      rect.on("pointerclick", () => {
        tr.nodes([]);
        seletedNodes = [rect];
        tr.nodes([rect]);
      });
      layer.add(rect);
      shapes.push(rect);
    }
  });
  const unsubscribe = drawing.subscribe((val) => {
    if (!val) {
      stage.off("pointerdown");
      stage.off("pointerup");
      document.body.style.cursor = "auto";
      unsubscribe();
    }
  });
};

export const pasteImages = (/** @type {Konva.Stage} */ stage, /** @type {Konva.Layer} */ layer, /** @type {Konva.Transformer} */ tr, /** @type {any[]} */ items) => {
  for (const item of items) {
    if (item.type.indexOf("image") !== -1) {
      const file = item.getAsFile();
      if (file) {
        const image = new Image();
        const reader = new FileReader();
        reader.onload = () => {
          // @ts-ignore
          image.src = reader.result;
          image.onload = async () => {
            const imageSelector = `Image_${Date.now()}`;
            const konvaImage = new Konva.Image({
              image,
              x: stage.width() / 2 - image.width / 2,
              y: stage.height() / 2 - image.height / 2,
              name: imageSelector,
              draggable: true,
            });
            konvaImage.on("pointerclick", () => {
              tr.nodes([]);
              seletedNodes = [konvaImage];
              tr.nodes([konvaImage]);
            });
            shapes.push(konvaImage);
            layer.add(konvaImage);
            layer.draw();
            const dataURL = reader.result;
            // @ts-ignore
            const base64Data = dataURL.split(",")[1];

            const bytes = base64ToArrayBuffer(base64Data);
            const doesBlackboardFolderExist = await exists("InstruktiFiles/blackboards", { dir: BaseDirectory.Document });
            if (!doesBlackboardFolderExist) {
              await createDir("InstruktiFiles/blackboards", { dir: BaseDirectory.Document });
            }
            await writeBinaryFile(`InstruktiFiles/blackboards/${imageSelector}.png`, bytes, { dir: BaseDirectory.Document });
          };
        };
        reader.readAsDataURL(file);
      }
    }
  }
};

export const startTakingScreenshot = async () => {
  drawing.set(true);
  await appWindow.hide();
  const base64Strings = await invoke("full_page_screenshot");
  console.log(base64Strings);
  await appWindow.show();
  const screenShotContainer = document.getElementById("screenshotContainer");
  if (screenShotContainer && base64Strings.length > 0) {
    takingScreenshot.set(true);
    const imageData = base64Strings[0];
    const image = new Image();
    image.src = "data:image/png;base64," + imageData;
    screenShotContainer.style.backgroundImage = `url(${image.src})`;
  }
};

export const finishTakingScreenshot = async (/** @type {string} */ imageData, /** @type {Konva.Transformer} */ tr, /** @type {Konva.Layer} */ layer, /** @type {number} */ x, /** @type {number} */ y) => {
  const image = new Image();
  image.src = "data:image/png;base64," + imageData;
  const imageSelector = `Image_${Date.now()}`;
  const konvaImage = new Konva.Image({
    image,
    x,
    y,
    name: imageSelector,
    draggable: true,
  });
  konvaImage.on("pointerclick", () => {
    tr.nodes([]);
    seletedNodes = [konvaImage];
    tr.nodes([konvaImage]);
  });
  shapes.push(konvaImage);
  layer.add(konvaImage);
  layer.draw();
  const bytes = base64ToArrayBuffer(imageData);
  const doesBlackboardFolderExist = await exists("InstruktiFiles/blackboards", { dir: BaseDirectory.Document });
  if (!doesBlackboardFolderExist) {
    await createDir("InstruktiFiles/blackboards", { dir: BaseDirectory.Document });
  }
  await writeBinaryFile(`InstruktiFiles/blackboards/${imageSelector}.png`, bytes, { dir: BaseDirectory.Document });
};

export const addTextBox = (/** @type {Konva.Layer} */ layer, /** @type {Konva.Transformer} */ tr) => {
  var textBox = new Konva.Text({
    x: 100,
    y: 100,
    text: "Edit me!",
    fontSize: 18,
    fontFamily: "Arial",
    fill: get(fill),
    stroke: get(stroke),
    strokeWidth: get(strokeWidth),
    draggable: true,
  });
  layer.add(textBox);
  layer.draw();
  shapes.push(textBox);
  textBox.on("pointerclick", () => {
    tr.nodes([textBox]);
    seletedNodes = [textBox];
  });
  textBox.on("pointerdblclick", () => {
    textBox.hide();
    layer.draw();
    var input = document.createElement("textarea");
    input.value = textBox.text();
    input.style.position = "absolute";
    input.style.left = textBox.absolutePosition().x + "px";
    input.style.top = textBox.absolutePosition().y + "px";
    document.body.appendChild(input);
    input.focus();
    input.addEventListener("blur", () => {
      textBox.text(input.value);
      layer.add(textBox);
      layer.draw();

      input.remove();
      textBox.show();
      layer.draw();
    });
  });
};

export const drawEllipse = (/** @type {Konva.Stage} */ stage, /** @type {Konva.Layer} */ layer, /** @type {Konva.Transformer} */ tr) => {
  drawing.set(true);
  let isDrawing = false;
  document.body.style.cursor = "crosshair";
  /** @type {Konva.Vector2d | null} */
  let startPos = null;
  /** @type {Konva.Vector2d | null} */
  let endPos = null;
  /** @type {Konva.Ellipse} */
  let previewShape;
  stage.on("pointerdown", () => {
    isDrawing = true;
    startPos = stage.getPointerPosition();
    if (startPos) {
      previewShape = new Konva.Ellipse({
        x: startPos.x,
        y: startPos.y,
        radiusX: 1, // Initial radius
        radiusY: 1,
        fill: get(fill),
        stroke: get(stroke),
        strokeWidth: get(strokeWidth),
      });

      layer.add(previewShape);
    }
  });
  stage.on("pointermove", () => {
    if (!isDrawing) return;
    endPos = stage.getPointerPosition();
    if (startPos && endPos) {
      previewShape.radiusX(Math.abs(startPos.x - endPos.x));
      previewShape.radiusY(Math.abs(startPos.y - endPos.y));
      layer.batchDraw(); // Refresh the layer to see the changes
    }
  });
  stage.on("pointerup", () => {
    isDrawing = false;
    endPos = stage.getPointerPosition();
    previewShape.destroy();
    if (startPos && endPos) {
      const oval = new Konva.Ellipse({
        x: startPos.x,
        y: startPos.y,
        radiusX: Math.abs(startPos.x - endPos.x),
        radiusY: Math.abs(startPos.y - endPos.y),
        fill: get(fill),
        stroke: get(stroke),
        strokeWidth: get(strokeWidth),
      });
      oval.on("pointerclick", () => {
        tr.nodes([]);
        seletedNodes = [oval];
        tr.nodes([oval]);
      });
      layer.add(oval);
      shapes.push(oval);
    }
  });
  const unsubscribe = drawing.subscribe((val) => {
    if (!val) {
      stage.off("pointerdown");
      stage.off("pointerup");
      document.body.style.cursor = "auto";
      unsubscribe();
    }
  });
};

export const drawLine = (/** @type {Konva.Stage} */ stage, /** @type {Konva.Layer} */ layer, /** @type {Konva.Transformer} */ tr) => {
  drawing.set(true);
  let isDrawing = false;
  document.body.style.cursor = "crosshair";
  /** @type {Konva.Vector2d | null} */
  let startPos = null;
  /** @type {Konva.Vector2d | null} */
  let endPos = null;
  /** @type {Konva.Line} */
  let previewShape;
  stage.on("pointerdown", () => {
    isDrawing = true;
    startPos = stage.getPointerPosition();
    if (startPos) {
      previewShape = new Konva.Line({
        points: [startPos.x, startPos.y],
        fill: get(fill),
        stroke: get(stroke),
        strokeWidth: get(strokeWidth),
      });
      layer.add(previewShape);
    }
  });
  stage.on("pointermove", () => {
    if (!isDrawing) return;
    const pos = stage.getPointerPosition();
    if (pos && startPos) {
      previewShape.points([startPos.x, startPos.y, pos.x, pos.y]);
      layer.batchDraw();
    }
  });
  stage.on("pointerup", () => {
    isDrawing = false;
    previewShape.destroy();
    endPos = stage.getPointerPosition();
    if (startPos && endPos) {
      const line = new Konva.Line({
        points: [startPos.x, startPos.y, endPos.x, endPos.y],
        fill: get(fill),
        stroke: get(stroke),
        strokeWidth: get(strokeWidth),
        draggable: true,
      });
      line.on("pointerclick", () => {
        tr.nodes([]);
        seletedNodes = [line];
        tr.nodes([line]);
      });
      layer.add(line);
      shapes.push(line);
    }
  });
  const unsubscribe = drawing.subscribe((val) => {
    if (!val) {
      stage.off("pointerdown");
      stage.off("pointerup");
      document.body.style.cursor = "auto";
      unsubscribe();
    }
  });
};

export const drawFreeform = (/** @type {Konva.Stage} */ stage, /** @type {Konva.Layer} */ layer, /** @type {Konva.Transformer} */ tr) => {
  drawing.set(true);
  let isDrawing = false;
  /** @type {Konva.Line} */
  let previewShape;
  document.body.style.cursor = "crosshair";
  /** @type {Konva.Vector2d | null} */
  let startPos = null;
  /** @type {Konva.Vector2d | null} */
  let endPos = null;
  stage.on("pointerdown", () => {
    isDrawing = true;
    startPos = stage.getPointerPosition();
    if (startPos) {
      previewShape = new Konva.Line({
        points: [startPos.x, startPos.y],
        fill: get(fill),
        stroke: get(stroke),
        strokeWidth: get(strokeWidth),
        lineCap: "round",
        lineJoin: "round",
        tension: 1,
      });
      layer.add(previewShape);
    }
  });
  stage.on("pointermove", () => {
    if (!isDrawing) return;
    const pos = stage.getPointerPosition();
    if (pos) {
      const newPoints = previewShape.points().concat([pos.x, pos.y]);
      previewShape.points(newPoints);
      layer.batchDraw();
    }
  });
  stage.on("pointerup", () => {
    isDrawing = false;
    previewShape.destroy();
    endPos = stage.getPointerPosition();
    if (endPos) {
      const newPoints = previewShape.points().concat([endPos.x, endPos.y]);
      const line = new Konva.Line({
        points: newPoints,
        fill: get(fill),
        stroke: get(stroke),
        strokeWidth: get(strokeWidth),
        lineCap: "round",
        lineJoin: "round",
        tension: 1,
      });
      line.on("pointerclick", () => {
        tr.nodes([]);
        seletedNodes = [line];
        tr.nodes([line]);
      });
      layer.add(line);
      shapes.push(line);
    }
  });
  const unsubscribe = drawing.subscribe((val) => {
    if (!val) {
      stage.off("pointerdown");
      stage.off("pointerup");
      document.body.style.cursor = "auto";
      unsubscribe();
    }
  });
};

export const drawPolygon = (/** @type {Konva.Stage} */ stage, /** @type {Konva.Layer} */ layer, /** @type {Konva.Transformer} */ tr, /** @type {HTMLDivElement} */ container) => {
  drawing.set(true);
  /** @type {number[]} */
  const points = [];
  document.body.style.cursor = "crosshair";
  let previewShape;
  stage.on("pointerclick", () => {
    const pos = stage.getPointerPosition();
    if (pos) {
      const { x, y } = pos;
      points.push(x);
      points.push(y);
    }
  });
  stage.on("mouseup", function () {
    if (get(drawing) && points.length >= 3) {
      previewShape = new Konva.Line({
        points,
        fill: get(fill),
        stroke: get(stroke),
        strokeWidth: get(strokeWidth),
        name: "deleteme",
      });
      layer.add(previewShape);
      layer.batchDraw();
    }
  });
  const finalizePolygon = (/** @type {KeyboardEvent} */ event) => {
    if (event.code === "Escape") {
      drawing.set(false);
      document.body.style.cursor = "auto";
      const deleteme = stage.find(".deleteme");
      deleteme.forEach((node) => {
        node.destroy();
      });
      const polygon = new Konva.Line({
        points: points.flat(),
        fill: get(fill),
        stroke: get(stroke),
        strokeWidth: get(strokeWidth),
        closed: true,
      });
      polygon.on("pointerclick", () => {
        tr.nodes([]);
        seletedNodes = [polygon];
        tr.nodes([polygon]);
      });
      layer.add(polygon);
      layer.draw();
      shapes.push(polygon);
      stage.off("pointerclick");
      stage.on("pointerclick", (event) => {
        if (event.target.nodeType === "Stage") {
          tr.nodes([]);
        }
      });
      stage.off("mouseup");
      container.removeEventListener("keydown", finalizePolygon);
    }
  };
  container.addEventListener("keydown", finalizePolygon);
};

export const freeHandSelection = (/** @type {Konva.Stage} */ stage, /** @type {Konva.Layer} */ layer, /** @type {Konva.Transformer} */ tr) => {
  let isDrawing = false;
  /**
   * @type {Konva.Rect}
   */
  let selectionRect;
  stage.on("mousedown touchstart", (e) => {
    const pos = stage.getPointerPosition();
    isDrawing = true;
    if (pos) {
      selectionRect = new Konva.Rect({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: "red",
        strokeWidth: 1,
        dash: [5, 5],
      });

      layer.add(selectionRect);
    }
  });
  stage.on("mousemove touchmove", (e) => {
    if (!isDrawing) return;

    const pos = stage.getPointerPosition();
    if (pos) {
      const x = Math.min(pos.x, selectionRect.x());
      const y = Math.min(pos.y, selectionRect.y());
      const width = Math.abs(pos.x - selectionRect.x());
      const height = Math.abs(pos.y - selectionRect.y());

      selectionRect.position({ x, y });
      selectionRect.size({ width, height });
      layer.batchDraw();
    }
  });
  stage.on("mouseup touchend", (e) => {
    isDrawing = false;
    seletedNodes = shapes.filter((shape) => Konva.Util.haveIntersection(shape.getClientRect(), selectionRect.getClientRect()));
    tr.nodes(seletedNodes);
    selectionRect.destroy();
    stage.off("mousedown touchstart mousemove touchmove mouseup touchend");
  });
};

export const clearBoard = (/** @type {Konva.Layer} */ layer, /** @type {Konva.Transformer} */ tr) => {
  deleteSelectedNode(tr, true);
  layer.add(tr);
  tr.nodes([]);
};

export const saveBoard = async (/** @type {Konva.Stage} */ stage) => {
  const canvasJSON = stage.toJSON();
  const doesBlackboardFolderExist = await exists("InstruktiFiles/blackboards", { dir: BaseDirectory.Document });
  if (!doesBlackboardFolderExist) {
    await createDir("InstruktiFiles/blackboards", { dir: BaseDirectory.Document });
  }
  let filename = get(editingSavedBoard);
  //@ts-ignore
  filename = filename || Date.now();
  await writeTextFile(`InstruktiFiles/blackboards/${filename}.json`, canvasJSON, { dir: BaseDirectory.Document });
  editingSavedBoard.set(filename);
  toast.success("Blackboard Saved!");
};

export const loadSavedBoard = async (/** @type {Konva.Layer} */ layer, /** @type {Konva.Transformer} */ tr) => {
  shapes = [];
  let selected;
  if (get(editingSavedBoard)) {
    selected = `InstruktiFiles/blackboards/${get(editingSavedBoard)}.json`;
    const boardExists = await exists(selected, { dir: BaseDirectory.Document });
    if (!boardExists) {
      editingSavedBoard.set(null);
      return;
    }
  } else {
    selected = await open({
      multiple: false,
      filters: [
        {
          name: "board",
          extensions: ["json"],
        },
      ],
    });
  }
  if (selected) {
    const documentDirPath = await documentDir();
    //@ts-ignore
    selected = selected.replace(documentDirPath, "");
    let canvasJSONString = await readTextFile(selected, { dir: BaseDirectory.Document });
    if (canvasJSONString) {
      if (!get(editingSavedBoard)) {
        await clearBoard(layer, tr);
      }
      canvasJSONString = JSON.parse(canvasJSONString);
      // get children of children. At first level only one children is present i.e. Layer.
      // Inside Layer children, filter Transformer out. Remaining are shapes.
      //@ts-ignore
      const objects = canvasJSONString.children[0].children.filter((child) => child.className !== "Transformer");
      objects.forEach(async (/** @type {Konva.Node}*/ object) => {
        switch (object.className) {
          case "Line":
            const line = new Konva.Line(object.attrs);
            line.on("pointerclick", () => {
              tr.nodes([]);
              seletedNodes = [line];
              tr.nodes([line]);
            });
            layer.add(line);
            shapes.push(line);
            layer.draw();
            break;
          case "Rect":
            const rect = new Konva.Rect(object.attrs);
            rect.on("pointerclick", () => {
              tr.nodes([]);
              seletedNodes = [rect];
              tr.nodes([rect]);
            });
            layer.add(rect);
            shapes.push(rect);
            break;
          case "Ellipse":
            const oval = new Konva.Ellipse(object.attrs);
            oval.on("pointerclick", () => {
              tr.nodes([]);
              seletedNodes = [oval];
              tr.nodes([oval]);
            });
            layer.add(oval);
            shapes.push(oval);
            layer.draw();
            break;
          case "Text":
            var textBox = new Konva.Text(object.attrs);
            layer.add(textBox);
            layer.draw();
            shapes.push(textBox);
            textBox.on("pointerclick", () => {
              tr.nodes([textBox]);
              seletedNodes = [textBox];
            });
            textBox.on("pointerdblclick", () => {
              textBox.hide();
              layer.draw();
              var input = document.createElement("textarea");
              input.value = textBox.text();
              input.style.position = "absolute";
              input.style.left = textBox.absolutePosition().x + "px";
              input.style.top = textBox.absolutePosition().y + "px";
              document.body.appendChild(input);
              input.focus();
              input.addEventListener("blur", () => {
                textBox.text(input.value);
                layer.add(textBox);
                layer.draw();

                input.remove();
                textBox.show();
                layer.draw();
              });
            });
          case "Image":
            if (object.attrs.name) {
              const imageName = object.attrs.name + ".png";
              const bytes = await readBinaryFile(`InstruktiFiles/blackboards/${imageName}`, { dir: BaseDirectory.Document });
              const base64String = await arrayBufferToBase64(bytes);
              if (base64String) {
                const image = new Image();
                image.src = "data:image/png;base64," + base64String;
                const konvaImage = new Konva.Image({
                  image,
                  ...object.attrs,
                });
                konvaImage.on("pointerclick", () => {
                  tr.nodes([]);
                  seletedNodes = [konvaImage];
                  tr.nodes([konvaImage]);
                });
                shapes.push(konvaImage);
                layer.add(konvaImage);
                layer.draw();
              } else {
                toast.error("Something went wrong loading the images");
              }
            }
            break;
          default:
            break;
        }
      });
      let filename = selected.split("/");
      filename = filename[filename.length - 1];
      filename = filename.split(".")[0];
      editingSavedBoard.set(filename);
    }
  }
};

export const deleteSelectedNode = (/** @type {Konva.Transformer} */ tr, shape = false) => {
  let nodesToBeDeleted = seletedNodes;
  seletedNodes = [];
  if (shape) {
    nodesToBeDeleted = shapes;
    shapes = [];
  }
  console.log(nodesToBeDeleted);
  if (nodesToBeDeleted.length > 0) {
    tr.nodes([]);
    nodesToBeDeleted.forEach(async (node) => {
      const name = node.getAttr("name");
      if (name) {
        await removeFile(`InstruktiFiles/blackboards/${name}.png`, { dir: BaseDirectory.Document });
      }
      node.destroy();
    });
  }
};

function arrayBufferToBase64(/** @type {Uint8Array} */ buffer) {
  return new Promise((resolve) => {
    const blob = new Blob([buffer], {
      type: "application/octet-binary",
    });
    const reader = new FileReader();
    reader.onload = function (evt) {
      if (evt.target) {
        const dataurl = evt.target.result;
        // @ts-ignore
        resolve(dataurl.substr(dataurl.indexOf(",") + 1));
      }
    };
    reader.readAsDataURL(blob);
  });
}
function base64ToArrayBuffer(/** @type {string} */ base64) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
