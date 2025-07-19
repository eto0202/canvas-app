export type CanvasData = {
  id: number;
  dataURL: string;
};

/**canvasデータをデータURLとして管理する履歴リスト*/
let history: CanvasData[] = [];
let historyIndex: number = -1;

/**
 * 履歴リストに新しいcanvasの状態を追加
 * @param canvasDateURL - canvas.toDataURL()で取得したデータURL
 */
export function addHistoryEntry(canvasDateURL: string) {
  // undo後に新しい操作をした場合、現在のデータより後の履歴を削除。
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }

  const newEntry: CanvasData = {
    id: Date.now(),
    dataURL: canvasDateURL,
  };

  history.push(newEntry);
  historyIndex++;
}

/**
 * １つ前のcanvasデータを復元
 * @returns {CanvasData} canvasデータ
 */
export function undo(): CanvasData | null {
  if (historyIndex > 0) {
    historyIndex--;
    return history[historyIndex];
  }
  return null;
}

/**
 * １つ後のcanvasデータを復元
 * @returns {CanvasData} canvasデータ
 */
export function redo(): CanvasData | null {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    return history[historyIndex];
  }
  return null;
}

/**
 * localStorageに保存したcanvasデータ
 */
const STORAGE_KEY: string = "savedCanvasData";

/** 現在のcanvasデータURLをlocalStorageに保存
 * @param currentCanvasDataUrl - 保存したいcanvasデータURL
 */
export function saveCanvasToStorage(currentCanvasDataUrl: string) {
  localStorage.setItem(STORAGE_KEY, currentCanvasDataUrl);
}

/** localStorageから保存されたcanvasデータURLを取得
 * @returns {string | null} - 取得したデータURL、無い場合はnull
 */
export function loadCanvasFromStorage(): string | null {
  const loadedDataUrl = localStorage.getItem(STORAGE_KEY);

  if (loadedDataUrl) {
    console.log("canvasデータURLを読み込みました。");
    return loadedDataUrl;
  } else {
    console.log("canvasデータURLが見つかりません。");
    return null;
  }
}
