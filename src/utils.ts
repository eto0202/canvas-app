/**
 * ポップオーバーの表示位置を設定する。
 * @param button - クリックした要素
 * @param popover - 表示するポップオーバー要素
 */
export function positionPopover(button: HTMLButtonElement, popover: HTMLElement) {
  //ボタンの画面上の位置とサイズを取得
  const buttonRect = button.getBoundingClientRect();

  //位置を調整
  //top ボタンの上端の位置
  popover.style.top = `${buttonRect.top - popover.clientHeight - 6}px`;
  //left ボタンの左端の位置
  popover.style.left = `${buttonRect.left}px`;
}

/**
 * データURLからa要素を生成しクリックイベントを発生させる。
 * @param dataUrl 画像のデータURL
 * @param fileName ダウンロードするファイル名
*/
export function downloadingCanvas(dataUrl: string, fileName: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}