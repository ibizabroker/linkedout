import { useEffect, useRef, type ReactElement } from 'react';

type Detach = () => void;

export function Frame(props: {
  readonly src: string;
  readonly title: string;
  readonly width?: number;
  readonly height?: number;
  readonly fitContent?: boolean;
  readonly className?: string;
  readonly onDocument?: (document: Document) => Detach | void;
}): ReactElement {
  const frame = useRef<HTMLIFrameElement>(null);
  const onDocument = useRef(props.onDocument);

  useEffect(() => {
    onDocument.current = props.onDocument;
  });

  useEffect(() => {
    const element = frame.current;
    if (element === null) {
      return;
    }
    const attached: { detach: Detach | void } = { detach: undefined };
    const ready = (): void => {
      attached.detach?.();
      const doc = element.contentDocument;
      if (doc === null) {
        return;
      }
      const stopFit =
        props.fitContent === true ? fitHeight(element, doc) : undefined;
      const stopExtra = onDocument.current?.(doc);
      attached.detach = () => {
        stopFit?.();
        stopExtra?.();
      };
    };
    element.addEventListener('load', ready);
    if (element.contentDocument?.readyState === 'complete') {
      ready();
    }
    return () => {
      element.removeEventListener('load', ready);
      attached.detach?.();
    };
  }, [props.fitContent]);

  return (
    <iframe
      ref={frame}
      src={props.src}
      title={props.title}
      width={props.width}
      height={props.height}
      className={props.className}
    />
  );
}

function fitHeight(element: HTMLIFrameElement, doc: Document): Detach {
  const content = doc.body;
  const fit = (): void => {
    element.style.height = `${Math.ceil(content.getBoundingClientRect().height)}px`;
  };
  const observer = new ResizeObserver(fit);
  observer.observe(content);
  fit();
  return () => {
    observer.disconnect();
  };
}
