const { evaluate } = require('./../../expression-parser/index.js');

console.log(evaluate);


export function plotter() {
    /*d3.select('#equation-input')
        .on('input', e => equationParser(e.target.value));*/

    let root = d3.select('#plot-space');
    let size = { width: 600, height: 400 };  


    let plotRanges = [[-100, 100], [-100, 100]];


    let data = [];
    // Load data with linear function
    for (let i = plotRanges[0][0]; i <= plotRanges[0][1]; i++){
        data.push({ x: i, y: i });
    }

    let svg = d3.select('#plot-space')
        .append('svg')
        .attr('class', 'plot')
        .attr('viewBox', [0, 0, size.width, size.height])
        .attr('preserveAspectRatio', 'xMidYMid slice');

    root.on('resize', event => {
        console.log('root resized')
        size = root.node().getBoundingClientRect();
        svg.attr('viewBox', [0, 0, size.width, size.height]);
    });

    let xScale = d3.scaleLinear()
        .domain(plotRanges[0])
        .range([0, size.width]);

    let yScale = d3.scaleLinear()
        .domain(plotRanges[1])
        .range([size.height, 0]);

    let xAxis = g => g.call(d3.axisBottom(xScale));

    let yAxis = g => g.call(d3.axisLeft(yScale));

    let line = d3.line()
        .defined(d => !isNaN(d.x) && !isNaN(d.y))
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    svg.append('path')
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

    function rescale(factor) {
        plotRanges = plotRanges.map(([min, max]) => [min * factor, max * factor]);
        xScale.domain(plotRanges[0]);
        yScale.domain(plotRanges[1]);

        svg.select('.xaxis')
            .transition().duration(350)
            .call(xAxis);
        svg.select('.yaxis')
            .transition().duration(350)
            .call(yAxis);
    }
    // the rescaling is performed only after a set delay time has passed
    // without wheel events being triggered, and accumulating the
    // rescaling factor, to avoid excessive rescales
    function delayedRescale(delay) {
        let timeout = 0;
        let factorAcc = 1.0;

        return event => {
            factorAcc += event.deltaY < 0 ? -0.1 : 0.1;
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout (() => {
                rescale(factorAcc);
                factorAcc = 1.0;
            }, delay);
        };
    }
    svg.on('wheel', delayedRescale(200));
}
