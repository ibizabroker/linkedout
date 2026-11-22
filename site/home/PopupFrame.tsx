import { useCallback, useState, type ReactElement } from 'react';
import { Frame } from './Frame';

type Rect = {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
};

function appliedRow(doc: Document): HTMLElement | null {
  for (const row of doc.querySelectorAll<HTMLElement>('[role="switch"]')) {
    if (row.textContent?.trim().startsWith('Applied') === true) {
      return row;
    }
  }
  return null;
}

export function PopupFrame(props: {
  readonly open: boolean;
  readonly hint: boolean;
}): ReactElement {
  const [rect, setRect] = useState<Rect | undefined>();

  const track = useCallback((doc: Document) => {
    const measure = (): void => {
      const row = appliedRow(doc);
      if (row === null) {
        setRect(undefined);
        return;
      }
      const box = row.getBoundingClientRect();
      setRect((previous) =>
        previous?.top === box.top &&
        previous.left === box.left &&
        previous.width === box.width &&
        previous.height === box.height
          ? previous
          : {
              top: box.top,
              left: box.left,
              width: box.width,
              height: box.height,
            },
      );
    };
    const resize = new ResizeObserver(measure);
    resize.observe(doc.documentElement);
    const mutate = new MutationObserver(measure);
    mutate.observe(doc.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    measure();
    return () => {
      resize.disconnect();
      mutate.disconnect();
    };
  }, []);

  return (
    <div className="popup" data-open={props.open}>
      <Frame
        src="frames/popup/"
        title="LinkedOut popup"
        width={352}
        height={420}
        fitContent
        onDocument={track}
      />
      {props.hint && props.open && rect !== undefined ? (
        <span
          className="hint"
          aria-hidden="true"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : null}
    </div>
  );
}
