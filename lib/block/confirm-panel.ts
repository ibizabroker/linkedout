const PANEL_CSS = `
:host{all:initial}
*{box-sizing:border-box}
.panel{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;width:min(448px,calc(100vw - 32px));padding:14px 16px;border:1px solid #e8e5df;border-radius:10px;background:#fdfcfa;color:#23211e;font:400 13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue','Noto Sans',Arial,sans-serif;box-shadow:0 6px 16px -6px rgb(35 33 30 / 18%);outline:none}
h2{margin:0;font-size:14px;font-weight:600}
p{margin:2px 0 0;color:#6b665e}
p.error{color:#b42318}
.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
button{height:26px;padding:0 10px;border:1px solid #e8e5df;border-radius:6px;background:#fdfcfa;color:inherit;font:500 12px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue','Noto Sans',Arial,sans-serif;cursor:pointer}
button:hover{background:#f4f2ee}
button:focus-visible{outline:2px solid #3b5bdb;outline-offset:1px}
button.primary{border-color:#3b5bdb;background:#3b5bdb;color:#fff}
button.primary:hover{background:#3351c4}
@media (prefers-color-scheme:dark){
.panel{border-color:#363431;background:#1e1d1b;color:#eceae6;box-shadow:0 6px 16px -6px rgb(0 0 0 / 50%)}
p{color:#a9a49b}
p.error{color:#f2826f}
button{border-color:#363431;background:#1e1d1b}
button:hover{background:#292825}
button:focus-visible{outline-color:#8da2f5}
button.primary{border-color:#8da2f5;background:#8da2f5;color:#16171c}
button.primary:hover{background:#a3b4f8}
}`;

let close: (() => void) | undefined;

export function closeBlockConfirmation(): void {
  close?.();
}

export function openBlockConfirmation(
  name: string,
  onConfirm: () => Promise<void>,
  onClose?: () => void,
): void {
  closeBlockConfirmation();

  const trigger = document.activeElement;
  const host = document.createElement('div');
  host.setAttribute('data-linkedout-panel', '');
  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = PANEL_CSS;

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.tabIndex = -1;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'title');

  const title = document.createElement('h2');
  title.id = 'title';
  title.textContent = `Block ${name}?`;

  const body = document.createElement('p');
  body.textContent =
    'Their jobs will be hidden from your results. You can unblock them anytime in LinkedOut settings.';

  const error = document.createElement('p');
  error.className = 'error';
  error.setAttribute('role', 'alert');
  error.textContent = 'Could not block this company. Try again.';

  const actions = document.createElement('div');
  actions.className = 'actions';
  const cancel = actionButton('Cancel', '', dismiss);
  const confirm = actionButton('Block', 'primary', () => {
    error.remove();
    confirm.disabled = true;
    onConfirm().then(dismiss, () => {
      if (dismissed) {
        return;
      }
      confirm.disabled = false;
      body.after(error);
      confirm.focus();
    });
  });
  actions.append(cancel, confirm);

  panel.append(title, body, actions);
  root.append(style, panel);
  document.body.append(host);
  panel.focus();

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      dismiss();
    }
  };
  document.addEventListener('keydown', onKeydown, true);

  close = dismiss;
  let dismissed = false;

  function dismiss(): void {
    if (dismissed) {
      return;
    }
    dismissed = true;
    document.removeEventListener('keydown', onKeydown, true);
    host.remove();
    if (close === dismiss) {
      close = undefined;
    }
    if (trigger instanceof HTMLElement && trigger.isConnected) {
      trigger.focus();
    }
    onClose?.();
  }
}

function actionButton(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}
