Array.prototype.findAll = function (condition) {
  let idxs = [];

  for (let i = 0; i < this.length; i++) {
    if (condition(this[i])) idxs.push(i);
  }

  return idxs;
};

function equationParser(equationText) {
  console.log(equationText);
  let termSeparators = equationText.split().findAll(ch => ch === '+' || ch === '-');
  console.log(termSeparators);
}
window.onload = function () {
  splitScreen();
  plotter();
};
function plotter() {
  d3.select('#equation-input').on('input', e => equationParser(e.target.value));
  let data = [];
  let size = {
    width: 600,
    height: 400
  };
  let plotRanges = {
    x: [-300, 300],
    y: [-200, 200]
  }; // Load data with linear function

  for (let i = plotRanges.x[0]; i <= plotRanges.x[1]; i++) {
    data.push({
      x: i,
      y: i
    });
  }

  let svg = d3.select('#plot-space').append('svg').attr('class', 'plot').attr('viewBox', [0, 0, size.width, size.height]);
  let xScale = d3.scaleLinear().domain(plotRanges.x).range([0, size.width]);
  let yScale = d3.scaleLinear().domain(plotRanges.y).range([size.height, 0]);
  let line = d3.line().defined(d => !isNaN(d.x) && !isNaN(d.y)).x(d => xScale(d.x)).y(d => yScale(d.y));
  svg.append('path').attr('class', 'plot-line').attr('d', line(data)).attr('fill', 'none').attr('stroke', 'black').attr('stroke-width', 1.5);
}
function splitScreen() {
  let splitScreen = document.querySelector('.split-screen');
  let leftScreen = splitScreen.querySelector('.left-screen');
  let rightScreen = splitScreen.querySelector('.right-screen');
  let resizer = splitScreen.querySelector('#resizer');
  let totalWidth = splitScreen.offsetWidth;
  let x = 0;
  resizer.onmousedown = mouseDownHandler;

  function mouseDownHandler(e) {
    x = e.clientX;
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  function mouseMoveHandler(e) {
    let dx = e.clientX - x;
    x = e.clientX;
    leftScreen.style.width = leftScreen.offsetWidth + dx;
  }

  function mouseUpHandler(e) {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  }
}
