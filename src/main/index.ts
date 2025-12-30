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
          text: config.buttonLabel || 'Gemini API実行',
          className: 'hazime-gemini-plugin-execute-mobile-button'
        });
        button.style.margin = '10px';
        kintone.mobile.app.record.getSpaceElement(config.spaceFieldCode)?.appendChild(button);
      } else {
        button = new Button({
          text: config.buttonLabel || 'Gemini API実行',
          className: 'hazime-gemini-plugin-execute-button'
        });
        kintone.app.record.getSpaceElement(config.spaceFieldCode)?.appendChild(button);
      }

      button.addEventListener('click', async () => {
        const record = isMobile ? kintone.mobile.app.record.get() : kintone.app.record.get();
        const inputFieldValue = record.record[config.inputFieldCode]?.value || '';
        console.log('inputFieldValue:', inputFieldValue);

        if (!inputFieldValue) {
          new Notification({
            text: `入力フィールド(${config.inputFieldCode})が空です`,
            type: 'danger'
          }).open();
          return;
        }

        const isConfirmed = await func.showAiConfirm();
        if (!isConfirmed) {
          return;
        }

        const prompt = config.prompt + '\n' + inputFieldValue;
        console.log('prompt:', prompt);
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
              type: 'success'
            }).open();
          } else {
            throw new Error(`API呼び出しエラー: ステータス ${status}`);
          }

          spinner.close();
        } catch (err) {
          console.error('err:', err);
          new Notification({
            text: 'Gemini APIの呼び出しに失敗しました',
            type: 'danger'
          }).open();
          spinner.close();
        }
      });
      return event;
    }
  );
})(kintone.$PLUGIN_ID);
