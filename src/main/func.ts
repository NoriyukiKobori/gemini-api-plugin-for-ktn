import Swal from 'sweetalert2';

export const showAiConfirm = async () => {
  const { isConfirmed } = await Swal.fire({
    title: 'AI利用に関する注意',
    html: `
      <p>
        この機能は外部のAIサービス（Gemini API）を利用します。<br><br>
        <strong>パスワード、APIキー、個人情報、機密情報などは入力しないでください。</strong>
      </p>
      <label style="display:block; margin-top:12px;">
        <input type="checkbox" id="aiAgree">
        秘密情報・個人情報を含んでいないことを確認しました
      </label>
    `,
    icon: 'warning',
    width: '700px',
    showCancelButton: true,
    confirmButtonText: 'OK',
    cancelButtonText: 'キャンセル',
    didOpen: () => {
      const confirmBtn = Swal.getConfirmButton();
      if (confirmBtn) {
        confirmBtn.disabled = true;

        document.getElementById('aiAgree')?.addEventListener('change', (e) => {
          confirmBtn.disabled = !(e.target as HTMLInputElement).checked;
        });
      }
    },
    preConfirm: () => {
      const checkbox = document.getElementById('aiAgree') as HTMLInputElement | null;
      const checked = checkbox?.checked ?? false;
      if (!checked) {
        Swal.showValidationMessage('確認チェックを入れてください');
      }
      return checked;
    }
  });

  return isConfirmed;
};
