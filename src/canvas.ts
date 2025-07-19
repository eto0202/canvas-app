import * as dom from "./dom";
import * as state from "./state";

export type Tool = "pen" | "eraser" | "move";

const CANVAS_PADDING = 25;

export class DrawingCanvas {
  private mainCanvas: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;

  // 実際の描画内容を保持するオフスクリーンキャンバス。
  private contentCanvas: HTMLCanvasElement;
  private contentCtx: CanvasRenderingContext2D;

  // 現在の状態
  private currentTool: Tool = "pen";
  private penColor = "#000000";
  private penWidth = 5;

  // 操作中の状態
  private isDrawing = false;
  private isDragging = false;
  private startDrag = { x: 0, y: 0 };

  // 描画領域の変形状態。移動、拡大、縮小。
  private transform = {
    x: 0,
    y: 0,
    scale: 1.0,
  };

  constructor() {
    this.mainCanvas = dom.mainCanvas;
    this.mainCtx = this.mainCanvas.getContext("2d")!;

    this.contentCanvas = document.createElement("canvas");
    this.contentCtx = this.contentCanvas.getContext("2d")!;

    this.initialize();
    this.addEventListeners();
  }

  private initialize() {
    // 解像度対応
    const dpr = window.devicePixelRatio || 1;
    const rect = this.mainCanvas.getBoundingClientRect();

    this.mainCanvas.width = rect.width * dpr;
    this.mainCanvas.height = rect.height * dpr;
    this.mainCtx.scale(dpr, dpr);

    this.contentCanvas.width = this.mainCanvas.width - CANVAS_PADDING * 2;
    this.contentCanvas.height = this.mainCanvas.height - CANVAS_PADDING * 2;

    // 起動時にデータを復元
    this.loadFromStorage();
  }

  private addEventListeners() {
    this.mainCanvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.mainCanvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.mainCanvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.mainCanvas.addEventListener("mouseleave", this.onMouseUp.bind(this));
    this.mainCanvas.addEventListener("wheel", this.onWheel.bind(this), { passive: false });
  }

  // 各イベントハンドラ
  private onMouseDown(e: MouseEvent) {
    const { x, y } = this.getTransformedPoint(e.offsetX, e.offsetY);

    if (this.currentTool === "move") {
      this.isDragging = true;
      this.startDrag.x = e.offsetX - this.transform.x;
      this.startDrag.y = e.offsetY - this.transform.y;
    } else {
      this.isDrawing = true;
      this.startLine(x, y);
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      this.transform.x = e.offsetX - this.startDrag.x;
      this.transform.y = e.offsetY - this.startDrag.y;
      this.redraw();
    } else if (this.isDrawing) {
      const { x, y } = this.getTransformedPoint(e.offsetX, e.offsetY);
      this.drawLine(x, y);
    }
  }

  private onMouseUp() {
    if (this.isDrawing) {
      this.isDrawing = false;
      // 描画完了時に履歴リストに追加
      state.addHistoryEntry(this.contentCanvas.toDataURL());
    }
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();

    const scaleAmount = -e.deltaY * 0.001;
    const oldScale = this.transform.scale;
    const newScale = Math.max(0.1, Math.min(oldScale + scaleAmount, 10));
    // スケール範囲を制限
    this.transform.scale = newScale;

    // ズームの中心点を計算
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    // 中心点を基準に拡大縮小するように調整
    this.transform.x = mouseX - (mouseX - this.transform.x) * (newScale / oldScale);
    this.transform.y = mouseY - (mouseY - this.transform.y) * (newScale / oldScale);

    this.redraw();
  }

  // 描画ロジック
  private startLine(x: number, y: number) {
    this.contentCtx.beginPath();
    this.contentCtx.moveTo(x, y);
    this.configurePen();
  }

  private drawLine(x: number, y: number) {
    this.contentCtx.lineTo(x, y);
    this.contentCtx.stroke();
    this.redraw();
  }

  // 描画内容をメインキャンバスに転写
  private redraw() {
    this.mainCtx.save();
    this.mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    this.mainCtx.restore();

    this.mainCtx.setTransform(
      this.transform.scale,
      0,
      0,
      this.transform.scale,
      this.transform.x,
      this.transform.y
    );

    this.mainCtx.drawImage(this.contentCanvas, CANVAS_PADDING, CANVAS_PADDING);

    this.mainCtx.strokeStyle = "rgb(0, 0, 0, 0.8)";
    this.mainCtx.lineWidth = 1;

    this.mainCtx.strokeRect(
      CANVAS_PADDING,
      CANVAS_PADDING,
      this.contentCanvas.width,
      this.contentCanvas.height
    );
  }

  // ペンと消しゴムの設定
  private configurePen() {
    this.contentCtx.globalCompositeOperation =
      this.currentTool === "eraser" ? "destination-out" : "source-over";

    this.contentCtx.strokeStyle = this.penColor;
    // ズームしても線の見た目が変わらないように
    this.contentCtx.lineWidth = this.penWidth / this.transform.scale;
    this.contentCtx.lineCap = "round";
    this.contentCtx.lineJoin = "round";
  }

  // 外部から設定を呼び出すメソッド
  public setTool(tool: Tool) {
    this.currentTool = tool;
  }

  public setPenStyle(color: string, width: number) {
    this.penColor = color;
    this.penWidth = width;
  }

  public clear() {
    this.contentCtx.clearRect(0, 0, this.contentCanvas.width, this.contentCanvas.height);
    this.redraw();
    state.addHistoryEntry(this.contentCanvas.toDataURL());
  }

  // state.tsとの連携
  public undo() {
    const data = state.undo();
    if (data) {
      this.restoreFromDataURL(data.dataURL);
    }
  }

  public redo() {
    const data = state.redo();
    if (data) {
      this.restoreFromDataURL(data.dataURL);
    }
  }

  public saveToStorage() {
    state.saveCanvasToStorage(this.contentCanvas.toDataURL());
  }

  public loadFromStorage() {
    const dataUrl = state.loadCanvasFromStorage();
    if (dataUrl) {
      this.restoreFromDataURL(dataUrl);
      // 読み込んだ状態を履歴の初期値にする
      state.addHistoryEntry(dataUrl);
    }
  }

  private restoreFromDataURL(dataUrl: string) {
    const image = new Image();
    image.onload = () => {
      this.contentCtx.fillStyle = "#ffffff";
      this.contentCtx.clearRect(0, 0, this.contentCanvas.width, this.contentCanvas.height);
      this.contentCtx.drawImage(image, 0, 0);
      this.redraw();
    };

    image.src = dataUrl;
  }

  // 画面上の座標を変形後のキャンバス座標に変換する
  private getTransformedPoint(x: number, y: number) {
    return {
      x: (x - this.transform.x) / this.transform.scale - CANVAS_PADDING,
      y: (y - this.transform.y) / this.transform.scale - CANVAS_PADDING,
    };
  }
}
