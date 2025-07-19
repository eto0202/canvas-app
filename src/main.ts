import * as dom from "./dom.ts";
import { DrawingCanvas } from "./canvas";
import { CursorUI } from "./ui.ts";
import { positionPopover } from "./utils.ts";

const app = new DrawingCanvas();

const cursor = new CursorUI();

/**カラー、太さを変更する*/
function updatePenStyle() {
  const color = dom.colorInput.value;
  const size = parseInt(dom.widthInput.value, 10);

  app.setPenStyle(color, size);
  cursor.setStyle(color, size);
}

/**イベントリスナー関数*/
function eventListener(): void {
  const toolButtons = [
    { element: dom.penBtn, tool: "pen" as const },
    { element: dom.eraserBtn, tool: "eraser" as const },
    { element: dom.moveBtn, tool: "move" as const },
  ];

  toolButtons.forEach(({ element, tool }) => {
    element.addEventListener("click", () => {
      app.setTool(tool);
      cursor.setTool(tool);
      updatePenStyle();
    });
  });

  dom.colorInput.addEventListener("change", () => updatePenStyle());
  dom.widthInput.addEventListener("change", () => updatePenStyle());
  dom.clearBtn.addEventListener("click", () => app.clear());
  dom.saveCanvasBtn.addEventListener("click", () => app.saveToStorage());

  dom.exportformatPopover.addEventListener("toggle", (e) => {
    const popover = e.target as HTMLElement;

    if (popover.matches(":popover-open")) {
      positionPopover(dom.exportCanvasBtn, popover);
    }
  });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    // MacではmetaKey、Windows/LinuxではctrlKeyをチェック
    const isUndoRedoKey = e.metaKey || e.ctrlKey;

    if (!isUndoRedoKey) return;

    switch (e.key.toLowerCase()) {
      case "z":
        e.preventDefault();
        if (e.shiftKey) {
          // Mac(標準) Cmd + Shift + Z app.redo()
          app.redo();
        } else {
          // Mac(標準) Cmd + Z app.undo()
          // Windows,Linux Ctrl + Z app.undo()
          app.undo();
        }
        break;
      case "y": // Windows,Linux Ctrl + Y app.redo()
        e.preventDefault();
        app.redo();
        break;
    }
  });
}

/**初期化関数*/
function initialize(): void {
  eventListener();
  updatePenStyle();
}

initialize();
