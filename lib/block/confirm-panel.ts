const PANEL_CSS = `
:host{all:initial}
*{box-sizing:border-box}
.panel{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;width:min(448px,calc(100vw - 32px));padding:16px;border:1px solid oklch(0.922 0 0);border-radius:10px;background:oklch(1 0 0);color:oklch(0.145 0 0);font:400 14px/1.5 system-ui,sans-serif;box-shadow:0 8px 24px oklch(0 0 0 / 14%);outline:none}
h2{margin:0;font-size:16px;font-weight:600;letter-spacing:-0.025em}
p{margin:4px 0 0;color:oklch(0.556 0 0)}
p.error{color:oklch(0.577 0.245 27.325)}
.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
button{height:32px;padding:0 12px;border:1px solid oklch(0.922 0 0);border-radius:10px;background:oklch(1 0 0);color:inherit;font:500 14px/1 system-ui,sans-serif;cursor:pointer}
button:hover{background:oklch(0.97 0 0)}
button:focus-visible{outline:3px solid oklch(0.708 0 0 / 50%);outline-offset:0}
button.primary{border-color:transparent;background:oklch(0.205 0 0);color:oklch(0.985 0 0)}
button.primary:hover{background:oklch(0.205 0 0 / 80%)}
@media (prefers-color-scheme:dark){
.panel{border-color:oklch(1 0 0 / 10%);background:oklch(0.205 0 0);color:oklch(0.985 0 0)}
p{color:oklch(0.708 0 0)}
p.error{color:oklch(0.704 0.191 22.216)}
button{border-color:oklch(1 0 0 / 15%);background:oklch(1 0 0 / 5%)}
button:hover{background:oklch(0.269 0 0)}
button.primary{background:oklch(0.922 0 0);color:oklch(0.205 0 0)}
button.primary:hover{background:oklch(0.922 0 0 / 80%)}
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
    'Their jobs will be hidden from your results. You can unblock them anytime in the LinkedOut popup.';

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
