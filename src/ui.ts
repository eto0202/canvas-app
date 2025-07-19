import * as dom from "./dom";

/**選択しているツールに応じてカーソルの見た目を変更する*/
export class CursorUI {
  private mainCanvas: HTMLElement = dom.mainCanvas;
  private brushElement: HTMLDivElement;
  private currentTool: "pen" | "eraser" | "move" = "pen";
  private isDragging = false;

  // マウスの最新座標を保持
  private mousePos = { x: 0, y: 0 };

  constructor() {
    this.brushElement = dom.cursorBrush;
    this.addEventListeners();
    // アニメーションループを開始
    this.animationLoop();
    this.setTool(this.currentTool);
  }

  private addEventListeners() {
    // マウス座標を更新するだけ
    document.addEventListener("mousemove", (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    });

    // キャンバスから出入りしたときの表示/非表示
    dom.mainCanvas.addEventListener("mouseenter", this.show.bind(this));
    dom.mainCanvas.addEventListener("mouseleave", this.hide.bind(this));

    document.addEventListener("mousedown", this.onMouseDown.bind(this));
    document.addEventListener("mouseup", this.onMouseUp.bind(this));
  }

  private onMouseDown(e: MouseEvent) {
    if (this.currentTool === "move" && e.target === this.mainCanvas) {
      this.isDragging = true;
      this.mainCanvas.style.cursor = "grabbing";
    }
  }

  private onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.mainCanvas.style.cursor = "grab";
    }
  }

  // ★ パフォーマンス改善の秘策
  private animationLoop() {
    // brushElementの位置を更新
    this.brushElement.style.transform = `translate(${this.mousePos.x}px, ${this.mousePos.y}px)`;

    // 次の描画フレームで、再びこの関数を呼び出す
    requestAnimationFrame(this.animationLoop.bind(this));
  }

  // --- 外部から呼び出すメソッド ---

  public setTool(tool: "pen" | "eraser" | "move") {
    this.currentTool = tool;
    this.isDragging = false;

    switch (tool) {
      case "pen":
      case "eraser":
        this.mainCanvas.style.cursor = "none";
        this.brushElement.style.display = "block";
        break;

      case "move":
        this.mainCanvas.style.cursor = "grab";
        this.brushElement.style.display = "none";
        break;
    }
  }

  public setStyle(color: string, size: number) {
    // サイズが小さすぎる場合のフォールバック
    if (size < 2) {
      this.brushElement.style.display = "none";
      return;
    } else if (this.currentTool !== "move") {
      this.brushElement.style.display = "block";
    }

    const offset = size / 2;
    this.brushElement.style.width = `${size}px`;
    this.brushElement.style.height = `${size}px`;
    // マウスカーソルの中心に円の中心が来るように調整
    this.brushElement.style.margin = `-${offset}px 0 0 -${offset}px`;

    // 消しゴムツールの場合は色を固定
    this.brushElement.style.borderColor = this.currentTool === "eraser" ? "#000000ff" : color;
    this.brushElement.style.backgroundColor =
      this.currentTool === "eraser" ? "#ffffffff" : "transparet";
  }

  private show() {
    if (this.currentTool !== "move") {
      this.mainCanvas.style.setProperty("--cursor-none", "none");
      this.brushElement.style.display = "block";
    }
  }

  private hide() {
    this.brushElement.style.display = "none";
  }
}
