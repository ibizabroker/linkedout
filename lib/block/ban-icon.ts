const SVG_NS = 'http://www.w3.org/2000/svg';

export function createBanIcon(
  doc: Document,
  options: {
    readonly size: number;
    readonly radius?: number;
    readonly slashPath?: string;
    readonly slashClass?: string;
  },
): SVGSVGElement {
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(options.size));
  svg.setAttribute('height', String(options.size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  const circle = doc.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', String(options.radius ?? 10));

  const path = doc.createElementNS(SVG_NS, 'path');
  if (options.slashClass !== undefined) {
    path.setAttribute('class', options.slashClass);
  }
  path.setAttribute('d', options.slashPath ?? 'm4.9 4.9 14.2 14.2');

  svg.append(circle, path);
  return svg;
}
