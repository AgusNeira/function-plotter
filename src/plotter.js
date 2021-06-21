const { evaluate } = require('unknown-parser');

export function plotter() {
    let root = d3.select('#plot-space'),
        size = root.node().getBoundingClientRect(),
        aspectRatio = size.height / size.width,
        resolution = 200, // points used to draw the function
        plotRanges = [[-100, 100], [-100 * aspectRatio, 100 * aspectRatio]],
        data = [],
        zoomDelay = 200,
        zoomInterval = 1.25;

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

    let expression;
    d3.select('#equation-input')
        .on('input', handleInput(1000));
    
    handleInput()();
    draw();

    function draw() {
        if (!expression) return;
        data = [];
        let resolutionScale = d3.scaleLinear()  // used to break the current
            .domain([0, resolution])            // into n evenly separated
            .range(plotRanges[0]);              // points

        for (let i = 0; i <= resolution; i++) {
            if (expression.unknowns.length === 1) {
                let unkname = expression.unknowns[0];
                data.push({
                    x: resolutionScale(i),
                    y: expression.calc({ [unkname]: resolutionScale(i) })
                });
            } else {
                data.push({
                    x: resolutionScale(i),
                    y: expresion.calc()
                });
            }
        }
        path.datum(data);
        svg.select('.plot-line')
            .attr('d', line);
    }

    function resize() {
        xScale.domain(plotRanges[0]);
        yScale.domain(plotRanges[1]);
        svg.select('.xaxis').transition().call(xAxis);
        svg.select('.yaxis').transition().call(yAxis);
        draw();
    }

    function SVGResizeHandler(event) {
        size = svg.node().getBoundingClientRect();
        svg.attr('viewBox', [0, 0, size.width, size.height]);
        resize();
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

    function delayed(fn, delay) {
        let timeout = 0;
        
        return (...args) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                fn(...args);
                timeout = null;
            }, delay);
        }
    }

    function handleInput(throttleDelay = 0) {
        let timeout = 0;
        return () => {
            let inputStr = d3.select('#equation-input').property('value');
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                console.log('equation found');
                console.log(inputStr);
                try {
                    expression = evaluate(inputStr);
                    if (expression.unknowns.length > 1) {
                        console.log('2D plotting supports up to one unknown');
                        expression = null;
                    }
                    draw();
                } catch (e) {
                    console.log(e);
                }
            }, throttleDelay);
        };
    }
}
