// 改行して、topにマージンをつける関数
export const createMarginTopElement = (height: number = 16): HTMLDivElement => {
  const div = document.createElement('div');
  div.style.marginTop = `${height}px`;
  return div;
};
