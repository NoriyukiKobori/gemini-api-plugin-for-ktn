// XSSを防ぐためのエスケープ処理
/**
 * XSSを防ぐためにHTML特殊文字をエスケープします。
 * @param str エスケープする入力文字列
 * @returns エスケープされた文字列
 */
export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r\n/g, '&#xD;&#xA;')
    .replace(/\r/g, '&#xD;')
    .replace(/\n/g, '&#xA;');
};

/**
 * HTMLエスケープされた文字列を元の文字列に戻します。
 * 主にescapeHtml関数でエスケープされた文字列を復元する用途で使用します。
 * @param str エスケープされたHTML文字列
 * @returns 元の文字列
 */
export const unescapeHtml = (str: string) => {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#xD;&#xA;/g, '\r\n')
    .replace(/&#xD;/g, '\r')
    .replace(/&#xA;/g, '\n');
};
