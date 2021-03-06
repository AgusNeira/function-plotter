export function plotter() {
    /*d3.select('#equation-input')
        .on('input', e => equationParser(e.target.value));*/

    let data = [];

    let size = { width: 600, height: 400 };
    let plotRanges = {
        x: [-300, 300],
        y: [-200, 200]
    }

    // Load data with linear function
    for (let i = plotRanges.x[0]; i <= plotRanges.x[1]; i++){
        data.push({ x: i, y: i });
    }

    let svg = d3.select('#plot-space').append('svg')
        .attr('class', 'plot')
        .attr('viewBox', [0, 0, size.width, size.height]);

    let xScale = d3.scaleLinear()
        .domain(plotRanges.x)
        .range([0, size.width]);

    let yScale = d3.scaleLinear()
        .domain(plotRanges.y)
        .range([size.height, 0]);

    let line = d3.line()
        .defined(d => !isNaN(d.x) && !isNaN(d.y))
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    svg.append('path').attr('class', 'plot-line')
        .attr('d', line(data))
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', 1.5);
}
