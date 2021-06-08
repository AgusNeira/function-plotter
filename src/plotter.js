const { evaluate } = require('./../../expression-parser/index.js');

export function plotter() {
    /*d3.select('#equation-input')
        .on('input', e => equationParser(e.target.value));*/

    let root = d3.select('#plot-space'),
        size = root.node().getBoundingClientRect(),
        aspectRatio = size.height / size.width,
        resolution = 200, // points used to draw the function
        plotRanges = [[-100, 100], [-100 * aspectRatio, 100 * aspectRatio]],
        data = [],
        zoomDelay = 200,
        zoomInterval = 1.25;

    // Load data with linear function
    function load() {
        data = [];
        let resolutionScale = d3.scaleLinear()  // used to break the current
            .domain([0, resolution])            // into n evenly separated
            .range(plotRanges[0]);              // points

        for (let i = 0; i <= resolution; i++) {
            data.push({
                x: resolutionScale(i),
                y: resolutionScale(i)**3
            });
        }
    }

    let svg = d3.select('#plot-space')
        .append('svg')
        .attr('class', 'plot')
        .attr('viewBox', [0, 0, size.width, size.height])
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('resize', SVGResizeHandler)
        .on('wheel', delayedRescale(zoomDelay));

    let xScale = d3.scaleLinear().domain(plotRanges[0]).range([0, size.width]);
    let yScale = d3.scaleLinear().domain(plotRanges[1]).range([size.height, 0]);

    let xAxis = g => g.call(d3.axisBottom(xScale));
    let yAxis = g => g.call(d3.axisLeft(yScale));

    let line = d3.line()
        .defined(d => !isNaN(d.x) && !isNaN(d.y))
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    let defTr = d3.transition().duration(200);

    load();
    let path = svg.append('path')
        .datum(data)
        .attr('class', 'plot-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', 1.5);

    svg.append('g')
        .attr('class', 'xaxis')
        .attr('transform', `translate(0, ${size.height / 2})`)
        .call(xAxis);
    svg.append('g')
        .attr('class', 'yaxis')
        .attr('transform', `translate(${size.width / 2}, 0)`)
        .call(yAxis);

    function resize() {
        xScale.domain(plotRanges[0]);
        yScale.domain(plotRanges[1]);
        svg.select('.xaxis').transition().call(xAxis);
        svg.select('.yaxis').transition().call(yAxis);
        redraw();
    }

    function SVGResizeHandler(event) {
        size = svg.node().getBoundingClientRect();
        svg.attr('viewBox', [0, 0, size.width, size.height]);
        resize();
    }
    
    function redraw() {
        load();
        path.datum(data);
        console.log(data);
        console.log(plotRanges);
        svg.select('.plot-line')
            .attr('d', line);
    }

    function rescale(factor) {
        plotRanges = plotRanges.map(([min, max]) => [min * factor, max * factor]);
        resize();
    }
    // the rescaling is performed only after a set delay time has passed
    // without wheel events being triggered, and accumulating the
    // rescaling factor, to avoid excessive rescales
    function delayedRescale(delay) {
        let timeout = 0;
        let factorAcc = 1.0;

        return event => {
            if (event.deltaY < 0) factorAcc /= zoomInterval;
            else factorAcc *= zoomInterval;

            if (timeout) clearTimeout(timeout);
            timeout = setTimeout (() => {
                rescale(factorAcc);
                factorAcc = 1.0;
            }, delay);
        };
    }
}
