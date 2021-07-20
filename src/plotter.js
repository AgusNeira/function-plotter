const { evaluate } = require('unknown-parser');

export function plotter() {
    let root = d3.select('#plot-space'),
        size = root.node().getBoundingClientRect(),
        aspectRatio = size.height / size.width,
        resolution = 500, // points used to draw the function
        tickAmount = 20,
        plotRanges = [[-11, 11], [-11 * aspectRatio, 11 * aspectRatio]],
        data = [],
        zoomDelay = 200,
        zoomInterval = 1.25;

    let svg = d3.select('#plot-space')
        .append('svg')
        .attr('class', 'plot')
        .attr('viewBox', [0, 0, size.width, size.height])
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('resize', SVGResizeHandler)
        .on('wheel', delayedRescale(zoomDelay, rescaleAll));

    let xScale = d3.scaleLinear().domain(plotRanges[0]).range([0, size.width]);
    let yScale = d3.scaleLinear().domain(plotRanges[1]).range([size.height, 0]);

    // Gives the proper interval within a given range, so that it is
    // a power of 10 and can be distributed in the range between
    // `lowerBound` and `upperBound` times
    let interval = (domain, [ min, max ]) => {
        let range = domain[1] - domain[0];
        let interval = Math.pow(10, Math.round(Math.log10(range) - 1));
        while (range / interval < min) interval /= 2;
        while (range / interval > max) interval *= 2;
        return interval;
    }
    let fillRange = (interval, [ lowerBound, upperBound ]) => {
        let values = [ lowerBound - lowerBound % interval ];
        while (values[values.length - 1] < upperBound) 
            values.push(values[values.length - 1] + interval);
        values.pop();
        return values;
    }
    let numberFormatting = num => {
        let digits = Math.abs(Math.log10(Math.abs(num)));
        if (digits >= 3) return num.toExponential(2)
        else if (num % 1 !== 0) return num.toPrecision(Math.floor(digits) + 2);
        else return num.toPrecision(Math.floor(digits) + 1);
    }

    let xAxis = g => {
        let tickInterval = interval(plotRanges[0], [8, 25]);
        let tickValues = fillRange(tickInterval, plotRanges[0]);
        // Remove the tick surrounding zero
        tickValues = tickValues.filter(x => Math.abs(x - 0) > tickInterval / 10);

        // Tick values are applied to the axis and formatted properly
        g.call(d3
            .axisBottom(xScale)
            .tickValues(tickValues)
            .tickFormat(numberFormatting)
            .tickSize(0)
            .tickPadding(8)
        );
    };
    let yAxis = g => {
        let tickInterval = interval(plotRanges[0], [8, 25]);
        let tickValues = fillRange(tickInterval, plotRanges[1]);
        // Remove the tick surrounding zero
        tickValues = tickValues.filter(y => Math.abs(y - 0) > tickInterval / 10);

        g.call(d3
            .axisLeft(yScale)
            .tickValues(tickValues)
            .tickFormat(numberFormatting)
            .tickSize(0)
            .tickPadding(5)
        );
    }
    let xGrid = g => {
        let gridInterval = interval(plotRanges[0], [8, 25]) / 5;
        let gridValues = fillRange(gridInterval, plotRanges[0]);
        g.selectAll('line')
            .data(gridValues)
            .join('line')
                .attr('x1', d => xScale(d))
                .attr('x2', d => xScale(d))
                .attr('y1', 0)
                .attr('y2', size.height)
                .attr('class', d => {
                    if (d.toPrecision(4) % (gridInterval * 5) === 0)
                        return 'thick-line';
                });
    }
    let yGrid = g => {
        let gridInterval = interval(plotRanges[0], [8, 25]) / 5;
        let gridValues = fillRange(gridInterval, plotRanges[1]);
        g.selectAll('line')
            .data(gridValues)
            .join(g => g.append('line'))
            .attr('x1', 0)
            .attr('x2', size.width)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .attr('class', d => {
                if (d.toPrecision(4) % (gridInterval * 5) === 0)
                    return 'thick-line';
            })
    }

    let line = d3.line()
        .defined(d => !isNaN(d.x) && !isNaN(d.y))
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    let defTr = d3.transition().duration(200);
    
    svg.append('g')
        .attr('class', 'xgrid')
        .call(xGrid);
    svg.append('g')
        .attr('class', 'ygrid')
        .call(yGrid);
    
    svg.append('g')
        .attr('class', 'xaxis')
        .attr('transform', `translate(0, ${size.height / 2})`)
        .call(xAxis)
        .append('rect')
            .attr('x', 0).attr('width', size.width)
            .attr('y', -20).attr('height', 40)
            .attr('fill', 'transparent')
            .style('z-index', 1000)
            .on('wheel', delayedRescale(zoomDelay, rescaleX));

    svg.append('g')
        .attr('class', 'yaxis')
        .attr('transform', `translate(${size.width / 2}, 0)`)
        .call(yAxis)
        .append('rect')
            .attr('x', -30).attr('width', 60)
            .attr('y', 0).attr('height', size.height)
            .attr('fill', 'transparent')
            .style('z-index', 1000)
            .on('wheel', delayedRescale(zoomDelay, rescaleY));

    let path = svg.append('path')
        .datum(data)
        .attr('class', 'plot-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', 1.5);

    let expression;
    d3.select('#equation-input')
        .on('input', handleInput(500));
    
    handleInput()();
    draw();

    function draw() {
        if (!expression) {
            path.attr('display', 'none');
            return;
        }

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
                    y: expression.calc({})
                });
            }
        }
        path.attr('display', '');
        path.datum(data);
        svg.select('.plot-line')
            .transition()
            .attr('d', line);
    }

    function resize() {
        xScale.domain(plotRanges[0]);
        yScale.domain(plotRanges[1]);
        svg.select('.xaxis').transition().call(xAxis);
        svg.select('.yaxis').transition().call(yAxis);
        svg.select('.xgrid').call(xGrid);
        svg.select('.ygrid').call(yGrid);
        draw();
    }

    function SVGResizeHandler(event) {
        size = svg.node().getBoundingClientRect();
        aspectRatio = size.height / size.width;
        svg.attr('viewBox', [0, 0, size.width, size.height]);
        resize();
    }

    function rescaleAll(factor) {
        let midpoints = plotRanges.map(([min, max]) => (max + min) / 2);
        let deltas = midpoints.map((mid, index) => mid - plotRanges[index][0] * factor);
        plotRanges = midpoints.map((mid, index) => [mid - deltas[index], mid + deltas[index]]);
        resize();
    }
    function rescaleX (factor) {
        let midpointX = (plotRanges[0][0] + plotRanges[0][1]) / 2;
        let deltaX = (midpointX - plotRanges[0][0]) * factor;
        plotRanges[0] = [midpointX - deltaX, midpointX + deltaX];
        resize();
    }
    function rescaleY (factor) {
        let midpointY = (plotRanges[1][0] + plotRanges[1][1]) / 2;
        let deltaY = (midpointY - plotRanges[1][0]) * factor;
        plotRanges[1] = [midpointY - deltaY, midpointY + deltaY];
        resize();
    }

    // the rescaling is performed only after a set delay time has passed
    // without wheel events being triggered, and accumulating the
    // rescaling factor, to avoid excessive rescales
    function delayedRescale(delay, rescaleFn) {
        let timeout = 0;
        let factorAcc = 1.0;

        return event => {
            event.stopPropagation();
            if (event.deltaY < 0) factorAcc /= zoomInterval;
            else factorAcc *= zoomInterval;

            if (timeout) clearTimeout(timeout);
            timeout = setTimeout (() => {
                rescaleFn(factorAcc);
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
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                let inputStr = d3.select('#equation-input').property('value')
                    .replace('²', '^2')
                    .replace('³', '^3');
                
                if (inputStr === '') {
                    expression = null;
                    draw();
                    return;
                }

                console.log('equation found');
                console.log(inputStr);
                try {
                    expression = evaluate(inputStr);
                    if (expression.unknowns.length > 1) {
                        console.log('2D plotting supports up to one unknown');
                        d3.select('#equation-input').attr('class', 'wrong-syntax');
                        d3.select('#input-message').text('2D plotting supports up to one unknown');
                        expression = null;
                    } else {
                        d3.select('#equation-input').attr('class', '');
                        d3.select('#input-message').text('');
                    }
                } catch (e) {
                    d3.select('#equation-input').attr('class', 'wrong-syntax');
                    d3.select('#input-message').text(e.message);
                    console.log(e);
                }
                draw();
            }, throttleDelay);
        };
    }
}
