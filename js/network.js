const SVG_NS = 'http://www.w3.org/2000/svg';
const points = [
  [290,130],[130,45],[225,28],[370,26],[463,65],[505,145],[460,215],
  [380,241],[210,237],[90,187],[60,118],[155,132],[390,136]
];
const connections = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[0,12],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11]];

function svgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

export function buildNetwork(container) {
  const svg = svgElement('svg', { viewBox: '0 0 580 270', preserveAspectRatio: 'xMidYMid meet' });
  const decorative = svgElement('g');
  const lines = svgElement('g');
  const signals = svgElement('g');
  const nodes = svgElement('g');
  for (const [index, [from, to]] of connections.entries()) {
    const [x1,y1] = points[from], [x2,y2] = points[to];
    const attributes = { x1, y1, x2, y2 };
    const line = svgElement('line', { ...attributes, class: from === 0 ? 'network-line' : 'network-secondary' });
    line.style.setProperty('--order', String(from === 0 ? index : index - 12));
    lines.append(line);
    if (from === 0) signals.append(svgElement('line', { ...attributes, class: 'network-signal' }));
  }
  for (const [index, [cx,cy]] of points.entries()) {
    if (index === 0) continue;
    const node = svgElement('circle', { cx, cy, r: index % 3 === 0 ? 6 : 4.5, class: 'network-node' });
    node.style.setProperty('--order', String(index - 1));
    nodes.append(node);
  }
  decorative.append(svgElement('circle', { cx: 290, cy: 130, r: 51, class: 'network-pulse' }));
  decorative.append(svgElement('circle', { cx: 290, cy: 130, r: 36, class: 'network-core-glow' }));
  nodes.append(svgElement('circle', { cx: 290, cy: 130, r: 25, class: 'network-core' }));
  nodes.append(svgElement('circle', { cx: 290, cy: 130, r: 7, fill: '#62e7a0' }));
  svg.append(lines, signals, decorative, nodes);
  container.replaceChildren(svg);
}
