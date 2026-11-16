const PANEL_CSS = `
:host{all:initial}
*{box-sizing:border-box}
.panel{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;width:min(448px,calc(100vw - 32px));padding:14px 16px;border:1px solid #e8e5df;border-radius:10px;background:#fdfcfa;color:#23211e;font:400 13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue','Noto Sans',Arial,sans-serif;box-shadow:0 6px 16px -6px rgb(35 33 30 / 18%);outline:none}
h2{margin:0;font-size:14px;font-weight:600}
p{margin:2px 0 0;color:#6b665e}
p.error{color:#b42318}
.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
button{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:24px;padding:0 9px;overflow:hidden;border:1px solid #e8e5df;border-bottom:2px solid #d6d2ca;border-radius:5px;background:#fff;color:inherit;font:500 12px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue','Noto Sans',Arial,sans-serif;white-space:nowrap;cursor:pointer;transition:transform .12s,border-color .15s}
button svg{flex:none;color:#0a66c2}
button:hover{transform:translateY(-1px);border-bottom-color:#0a66c2}
button:active{transform:translateY(1px)}
button:focus-visible{outline:2px solid #0a66c2;outline-offset:2px}
button.neutral svg{color:#6b665e}
button.neutral:hover{border-bottom-color:#6b665e}
button:disabled{cursor:default;transform:none}
.slash{stroke-dasharray:18}
button:hover .slash{animation:draw .35s ease}
@keyframes draw{from{stroke-dashoffset:18}to{stroke-dashoffset:0}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media (prefers-color-scheme:dark){
.panel{border-color:#363431;background:#1e1d1b;color:#eceae6;box-shadow:0 6px 16px -6px rgb(0 0 0 / 50%)}
p{color:#a9a49b}
p.error{color:#f2826f}
button{border-color:#363431;border-bottom-color:#0f0e0d;background:#2a2926}
button svg{color:#70b5f9}
button:hover{border-bottom-color:#0a66c2}
button:focus-visible{outline-color:#70b5f9}
button.neutral svg{color:#a9a49b}
button.neutral:hover{border-bottom-color:#a9a49b}
}`;

const BAN_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path class="slash" d="m5.7 5.7 12.6 12.6"></path></svg>';

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
    'Their jobs will be hidden from your results. You can unblock them anytime in LinkedOut Settings.';

  const error = document.createElement('p');
  error.className = 'error';
  error.setAttribute('role', 'alert');
  error.textContent = 'Could not block this company. Try again.';

  const actions = document.createElement('div');
  actions.className = 'actions';
  const cancel = actionButton('Cancel', 'neutral', dismiss);
  const confirm = actionButton('Block', '', () => {
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
  if (label === 'Block') {
    button.insertAdjacentHTML('beforeend', BAN_ICON);
  }
  const text = document.createElement('span');
  text.textContent = label;
  button.append(text);
  button.addEventListener('click', onClick);
  return button;
}
