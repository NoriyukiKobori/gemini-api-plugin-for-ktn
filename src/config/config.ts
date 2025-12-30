import { Text, TextArea, Button, Notification, Spinner } from 'kintone-ui-component';
import './config.scss';
import * as func from './func';

(async (PLUGIN_ID: string) => {
  'use strict';

  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
  const method = 'POST';

  try {
    //設定情報の取得
    const config = kintone.plugin.app.getConfig(PLUGIN_ID);

    const proxyConfig = kintone.plugin.app.getProxyConfig(apiUrl, method);
    const apiKeyValue = proxyConfig?.headers['x-goog-api-key'] ? proxyConfig.headers['x-goog-api-key'] : '';

    console.log(config);

    if (!config) {
      alert('プラグインの設定を取得できませんでした。');
      location.href = `/k/admin/app/${kintone.app.getId()}/plugin/`;
    }
    const div = document.getElementById('settings');
    const divContent = document.createElement('div');
    const divFooter = document.createElement('div');
    divFooter.style.marginTop = '20px';
    div?.appendChild(divContent);
    div?.appendChild(divFooter);

    const modelInfo = document.createElement('div');
    modelInfo.textContent = 'モデル: gemini-2.5-flash-lite';
    divContent?.appendChild(modelInfo);
    divContent?.appendChild(func.createMarginTopElement());

    const apiKey = new Text({
      label: 'API Key',
      value: apiKeyValue,
      visible: false,
      className: 'hazime-gemini-plugin-text-l'
    });
    // apiKey.valueが空文字の場合は表示にする
    if (apiKey.value === '') {
      apiKey.visible = true;
    }
    divContent?.appendChild(apiKey);
    // apiKeyの表示・非表示を切り替えるボタン
    const toggleApiKeyButton = new Button({
      text: apiKey.value === '' ? 'API Keyを非表示にする' : 'API Keyを編集する',
      className: 'hazime-gemini-plugin-toggle-button'
    });
    toggleApiKeyButton.style.marginTop = '33px';
    divContent?.appendChild(toggleApiKeyButton);
    toggleApiKeyButton.addEventListener('click', () => {
      apiKey.visible = !apiKey.visible;
      toggleApiKeyButton.text = apiKey.visible ? 'API Keyを非表示にする' : 'API Keyを編集する';
    });

    divContent?.appendChild(func.createMarginTopElement());

    const spaceFieldCode = new Text({
      label: 'スペースフィールドコード ※このスペースフィールドへボタンを表示します',
      value: config.spaceFieldCode || '',
      className: 'hazime-gemini-plugin-text-m'
    });
    divContent?.appendChild(spaceFieldCode);

    divContent?.appendChild(func.createMarginTopElement());

    const buttonLabel = new Text({
      label: 'ボタンラベル ※ボタンに表示するテキストを設定します',
      value: config.buttonLabel || 'Geminiにレビューを依頼',
      className: 'hazime-gemini-plugin-text-m'
    });
    divContent?.appendChild(buttonLabel);

    divContent?.appendChild(func.createMarginTopElement());

    // プロンプト
    const prompt = new TextArea({
      label: '共通のプロンプト',
      value:
        config.prompt ||
        '後述する業務報告に対して、以下の観点からレビューコメントをください。\n 今回の対応の妥当性\n・今回の対応の良かったところ\n・今回の対応の是正すべきところ\n・チームで展開するとよいところ\n\n****＜業務報告＞*****',
      className: 'hazime-gemini-plugin-textarea-l'
    });
    divContent?.appendChild(prompt);

    divContent?.appendChild(func.createMarginTopElement());

    const inputFieldCode = new Text({
      label: '入力フィールドコード ※このフィールドの内容がプロンプトに追加されます',
      value: config.inputFieldCode || '',
      className: 'hazime-gemini-plugin-text-m'
    });
    divContent?.appendChild(inputFieldCode);

    divContent?.appendChild(func.createMarginTopElement());

    const outputFieldCode = new Text({
      label: '出力フィールドコード ※このフィールドにAIの応答がセットされます',
      value: config.outputFieldCode || '',
      className: 'hazime-gemini-plugin-text-m'
    });
    divContent?.appendChild(outputFieldCode);

    // 保存ボタン
    const saveButton = new Button({
      text: '保存',
      type: 'submit',
      className: 'my-custom-button'
    });
    saveButton.style.marginTop = '10px';
    saveButton.style.marginBottom = '10px';
    saveButton.style.marginLeft = '10px';

    divFooter?.appendChild(saveButton);

    saveButton.addEventListener('click', (e) => {
      const spinner = new Spinner({
        text: '設定を保存中...'
      });
      try {
        e.preventDefault();

        const successCallback = () => {
          try {
            const newConfig = {
              spaceFieldCode: spaceFieldCode.value,
              buttonLabel: buttonLabel.value,
              prompt: prompt.value,
              inputFieldCode: inputFieldCode.value,
              outputFieldCode: outputFieldCode.value
            };

            kintone.plugin.app.setConfig(newConfig, () => {
              const notification = new Notification({
                text: '設定を保存しました。',
                type: 'success',
                duration: 1000
              });
              notification.open();
              notification.addEventListener('close', () => {
                notification.close();
                spinner.close();
                location.href = location.href = `/k/admin/app/${kintone.app.getId()}/plugin/`;
              });
            });
          } catch (error) {
            console.error('error: ', error);
            alert('設定の保存に失敗しました');
            spinner.close();
          }
        };

        if (apiKey.value === '') {
          alert('未入力項目があります。');
          return;
        }
        spinner.open();

        // 外部APIの情報を定義
        const apiHeader = { 'x-goog-api-key': apiKey.value, 'Content-Type': 'application/json' };
        const apiBody = {};
        kintone.plugin.app.setProxyConfig(apiUrl, method, apiHeader, apiBody, successCallback);
      } catch (err) {
        console.error('err:' + err);
        alert('設定の保存に失敗しました。');
        spinner.close();
      }
    });
  } catch (err) {
    console.error('err:' + err);
    alert('アプリのフォーム情報を取得できませんでした。管理者へ連絡してください。');
  }
})(kintone.$PLUGIN_ID);
