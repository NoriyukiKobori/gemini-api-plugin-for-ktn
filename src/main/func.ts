import { Dialog, TextArea, Checkbox, Button, MobileTextArea, MobileCheckbox, MobileButton, Notification } from 'kintone-ui-component';

export const showAiInputDialog = async (prePrompt: string, isMobile: boolean): Promise<string | null> => {
  return new Promise<string | null>((resolve) => {
    //  =========================
    //  resolve 多重呼び出し防止
    //  =========================
    let isResolved = false;

    const finish = (value: string | null) => {
      if (isResolved) return;
      isResolved = true;
      dialog.close();
      resolve(value);
    };

    //  =========================
    //  注意文言
    //  =========================
    const infoDiv = document.createElement('div');
    infoDiv.style.marginBottom = '12px';
    infoDiv.innerHTML = `
      この機能は外部のAIサービス（Gemini API）を利用します。<br>
      <strong>パスワード、APIキー、個人情報、機密情報などは入力しないでください。</strong>
    `;
    infoDiv.style.fontSize = '14px';

    // =========================
    // プロンプト入力エリア
    // =========================
    let promptTextArea: TextArea | MobileTextArea;
    if (isMobile) {
      promptTextArea = new MobileTextArea({
        label: 'プロンプト',
        value: prePrompt,
        disabled: false
      });
    } else {
      promptTextArea = new TextArea({
        label: 'プロンプト',
        value: prePrompt,
        className: 'hazime-gemini-plugin-textarea-l',
        disabled: false
      });
    }

    // =========================
    // 秘密情報・個人情報確認チェックボックス
    // =========================
    let includeContextCheckbox: Checkbox | MobileCheckbox;
    if (isMobile) {
      includeContextCheckbox = new MobileCheckbox({
        label: '',
        items: [{ label: '秘密情報・個人情報を含んでいないことを確認しました', value: 'include' }],
        borderVisible: false
      });
    } else {
      includeContextCheckbox = new Checkbox({
        label: '',
        items: [{ label: '秘密情報・個人情報を含んでいないことを確認しました', value: 'include' }],
        className: 'hazime-gemini-plugin-checkbox',
        borderVisible: false
      });
    }
    // /=========================
    //  チェック状態で実行可否切替
    //  =========================
    includeContextCheckbox.addEventListener('change', () => {
      const selectedValues = includeContextCheckbox.value;
      if (selectedValues.includes('include')) {
        execButton.disabled = false;
      } else {
        execButton.disabled = true;
      }
    });

    // =========================
    // フッター部分
    // =========================
    const dialogContent = document.createElement('div');
    dialogContent.appendChild(infoDiv);
    dialogContent.appendChild(promptTextArea);
    dialogContent.appendChild(includeContextCheckbox);

    const fooderElement = document.createElement('div');

    // キャンセルボタン
    let cancelButton: Button | MobileButton;
    if (isMobile) {
      cancelButton = new MobileButton({
        text: 'キャンセル',
        type: 'normal',
        className: 'hazime-gemini-plugin-cancel-mobile-button'
      });
    } else {
      cancelButton = new Button({
        text: 'キャンセル',
        type: 'normal'
      });
    }
    cancelButton.style.marginLeft = '10px';
    fooderElement.appendChild(cancelButton);
    cancelButton.addEventListener('click', () => {
      finish(null);
    });

    // 実行ボタン
    let execButton: Button | MobileButton;
    if (isMobile) {
      execButton = new MobileButton({
        text: '実行',
        type: 'submit',
        disabled: true
      });
    } else {
      execButton = new Button({
        text: '実行',
        type: 'submit',
        disabled: true
      });
    }
    fooderElement.appendChild(execButton);
    execButton.style.marginLeft = '10px';
    execButton.addEventListener('click', () => {
      try {
        finish(promptTextArea.value);
      } catch (err) {
        console.error('err:', err);
        new Notification({
          text: 'エラーが発生しました。\n' + err,
          type: 'danger'
        }).open();

        finish(null);
      }
    });

    // =========================
    // ダイアログ本体
    // =========================
    const dialog = new Dialog({
      icon: 'warning',
      header: 'AI利用に関する注意',
      content: dialogContent,
      footer: fooderElement,
      className: 'hazime-gemini-plugin-ai-input-dialog'
    });

    // ==========================
    // クローズボタン押下時処理
    // ==========================
    dialog.addEventListener('close', () => {
      finish(null);
    });

    // ==========================
    // ダイアログ表示
    // ==========================
    dialog.open();
  });
};
