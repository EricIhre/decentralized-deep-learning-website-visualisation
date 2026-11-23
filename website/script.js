const rounds = buildRounds(20);
const graphContainer = document.getElementById('graphContainer');
const roundSlider = document.getElementById('roundSlider');
const roundLabel = document.getElementById('roundLabel');
const playPauseButton = document.getElementById('playPauseButton');

const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
graphContainer.appendChild(tooltip);

const svg = d3
  .select(graphContainer)
  .append('svg')
  .attr('viewBox', '0 0 900 560');

const g = svg.append('g');

const colorScale = d3
  .scaleOrdinal()
  .domain([0, 1, 2, 3])
  .range(['#69d2ff', '#a58bff', '#79f1c9', '#ff8ccc']);

function buildRounds(totalRounds) {
  const groups = [
    { cx: 280, cy: 210, radius: 140 },
    { cx: 520, cy: 200, radius: 120 },
    { cx: 360, cy: 380, radius: 150 },
    { cx: 620, cy: 360, radius: 150 },
  ];

  const nodes = Array.from({ length: 16 }, (_, index) => ({
    id: index,
    group: index % 4,
  }));

  return Array.from({ length: totalRounds }, (_, roundIndex) => {
    const nodesForRound = nodes.map((node, index) => {
      const group = groups[node.group];
      const angle = (Math.PI * 2 * index) / nodes.length + roundIndex * 0.28;
      const offset = 18 + ((index + roundIndex) % 5) * 8;
      const x = group.cx + Math.cos(angle) * (group.radius + Math.sin(roundIndex * 0.8 + index) * 24) + Math.sin(index + roundIndex) * 10;
      const y = group.cy + Math.sin(angle) * (group.radius + Math.cos(roundIndex * 0.7 + index) * 20) + Math.cos(index * 1.4 + roundIndex) * 12;

      return {
        id: node.id,
        group: node.group,
        x,
        y,
        label: `N${node.id + 1}`,
      };
    });

    const links = [];

    for (let i = 0; i < nodesForRound.length; i += 1) {
      for (let j = i + 1; j < nodesForRound.length; j += 1) {
        const a = nodesForRound[i];
        const b = nodesForRound[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 170) {
          const weight = Math.max(0.15, 1 - dist / 170 + ((a.group === b.group) ? 0.3 : 0.08));
          links.push({
            source: a.id,
            target: b.id,
            weight,
          });
        }
      }
    }

    return { nodes: nodesForRound, links };
  });
}

let currentRound = 0;
let playing = true;
let timer = null;

function renderRound(roundIndex) {
  const round = rounds[roundIndex];

  const links = g.selectAll('.link').data(round.links, d => `${d.source}-${d.target}`);
  links.exit().remove();

  links
    .enter()
    .append('line')
    .attr('class', 'link')
    .merge(links)
    .attr('x1', d => round.nodes.find(node => node.id === d.source).x)
    .attr('y1', d => round.nodes.find(node => node.id === d.source).y)
    .attr('x2', d => round.nodes.find(node => node.id === d.target).x)
    .attr('y2', d => round.nodes.find(node => node.id === d.target).y)
    .attr('stroke-width', d => 1 + d.weight * 3)
    .attr('opacity', d => 0.25 + d.weight * 0.75);

  const nodeMap = new Map(round.nodes.map(node => [node.id, node]));

  const nodes = g.selectAll('.node').data(round.nodes, d => d.id);

  nodes.exit().remove();

  const nodeEnter = nodes
    .enter()
    .append('g')
    .attr('class', 'node-group');

  nodeEnter
    .append('circle')
    .attr('class', 'node')
    .attr('r', 11)
    .style('fill', d => colorScale(d.group));

  nodeEnter
    .append('text')
    .attr('class', 'node-label')
    .attr('text-anchor', 'middle')
    .attr('dy', 26)
    .text(d => d.label);

  const mergedNodes = nodeEnter.merge(nodes);

  mergedNodes
    .select('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .style('fill', d => colorScale(d.group))
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, d) {
      tooltip.innerHTML = `<strong>Node ${d.label}</strong><br>Group ${d.group + 1}<br>Local neighborhood active`;
      tooltip.classList.add('visible');
      tooltip.style.left = `${event.offsetX}px`;
      tooltip.style.top = `${event.offsetY}px`;
    })
    .on('mousemove', function (event) {
      tooltip.style.left = `${event.offsetX}px`;
      tooltip.style.top = `${event.offsetY}px`;
    })
    .on('mouseleave', function () {
      tooltip.classList.remove('visible');
    });

  mergedNodes
    .select('text')
    .attr('x', d => d.x)
    .attr('y', d => d.y);

  roundLabel.textContent = `Round ${roundIndex + 1}`;
  roundSlider.value = String(roundIndex);
}

function advanceRound() {
  currentRound = (currentRound + 1) % rounds.length;
  renderRound(currentRound);
}

function togglePlay() {
  playing = !playing;
  playPauseButton.textContent = playing ? 'Pause' : 'Play';

  if (playing) {
    timer = setInterval(advanceRound, 1000);
  } else {
    clearInterval(timer);
  }
}

roundSlider.addEventListener('input', (event) => {
  currentRound = Number(event.target.value);
  renderRound(currentRound);
});

playPauseButton.addEventListener('click', togglePlay);

renderRound(currentRound);
timer = setInterval(advanceRound, 1000);
