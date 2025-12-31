import { Button, MobileButton, Spinner, Notification } from 'kintone-ui-component';
import './main.scss';
import * as func from './func';

((PLUGIN_ID) => {
  'use strict';

  kintone.events.on(
    ['app.record.create.show', 'app.record.edit.show', 'mobile.app.record.create.show', 'mobile.app.record.edit.show'],
    async (event) => {
      // desktop / mobile 判定
      // @ts-ignore
      const isMobile = await kintone.isMobilePage();
      console.log('isMobile:', isMobile);

      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
      const method = 'POST';
      const config = kintone.plugin.app.getConfig(PLUGIN_ID);

      let button: Button | MobileButton;
      if (isMobile) {
        button = new MobileButton({
          text: config.buttonLabel || 'Geminiにレビューを依頼',
          className: 'hazime-gemini-plugin-execute-mobile-button'
        });
        button.style.margin = '10px';
        kintone.mobile.app.record.getSpaceElement(config.spaceFieldCode)?.appendChild(button);
      } else {
        button = new Button({
          text: config.buttonLabel || 'Geminiにレビューを依頼',
          className: 'hazime-gemini-plugin-execute-button'
        });
        kintone.app.record.getSpaceElement(config.spaceFieldCode)?.appendChild(button);
      }

      button.addEventListener('click', async () => {
        try {
          const record = isMobile ? kintone.mobile.app.record.get() : kintone.app.record.get();
          const inputFieldsTable = config.inputFieldsTable ? JSON.parse(config.inputFieldsTable) : [];
          if (inputFieldsTable.length === 0) {
            new Notification({
              text: '入力フィールドが設定されていません',
              type: 'danger'
            }).open();
            return;
          }

          console.log(inputFieldsTable);

          let prePrompt = config.prompt || '';
          (inputFieldsTable as Array<{ type?: string; keyword?: string }>).forEach((item) => {
            if (item.type === 'fieldCode') {
              prePrompt += `\n${record.record[item.keyword || ''].value || ''}`;
            } else if (item.type === 'additionalText') {
              prePrompt += `\n${item.keyword || ''}`;
            } else {
              console.warn('Unknown item type:', item);
            }
          });
          console.log('prePrompt:', prePrompt);

          const prompt = await func.showAiInputDialog(prePrompt, isMobile);
          console.log('prompt:', prompt);
          if (prompt === null) {
            return;
          }
          if (prompt === '') {
            new Notification({
              text: 'プロンプトが空です',
              type: 'danger'
            }).open();
            return;
          }

          const spinner = new Spinner({
            text: 'Gemini APIを実行中...'
          });
          spinner.open();
          try {
            const body = {
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ]
            };
            const response = await kintone.plugin.app.proxy(PLUGIN_ID, apiUrl, method, {}, body);
            const [responseBody, status, headers] = response;

            console.log('Status:', status);
            console.log('Headers:', headers);
            console.log('Body:', responseBody);

            if (status === 200) {
              const result = JSON.parse(responseBody);
              const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'レスポンスがありませんでした';

              // 出力フィールドに結果をセット
              record.record[config.outputFieldCode].value = generatedText;
              if (isMobile) {
                kintone.mobile.app.record.set(record);
              } else {
                kintone.app.record.set(record);
              }

              new Notification({
                text: 'Gemini APIの実行が完了しました',
                type: 'success',
                duration: 2000
              }).open();
            } else {
              throw new Error(`Gemini APIエラー: ステータス ${status}`);
            }

            spinner.close();
          } catch (err) {
            console.error('err:', err);
            spinner.close();
            throw 'Gemini APIエラー: ' + err;
          }
        } catch (err) {
          console.error('err:', err);
          new Notification({
            text: 'エラーが発生しました。\n' + err,
            type: 'danger'
          }).open();
        }
      });
      return event;
    }
  );
})(kintone.$PLUGIN_ID);
