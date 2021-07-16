const { evaluate } = require('unknown-parser');

export function plotter() {
    let root = d3.select('#plot-space'),
        size = root.node().getBoundingClientRect(),
        aspectRatio = size.height / size.width,
        resolution = 500, // points used to draw the function
        tickAmount = 20,
        plotRanges = [[-109, 109], [-109 * aspectRatio, 109 * aspectRatio]],
        data = [],
        zoomDelay = 200,
        zoomInterval = 1.25;

    let xTicks = Array(tickAmount).fill(0).map((x, i) => i / tickAmount)
        .filter(x => x < 1 && x > 0 && x !== 0.5);
    let yTicks = Array(tickAmount).fill(0)
        .map((y, i) => (i / tickAmount - 0.5) / aspectRatio + 0.5)
        .filter(y => y > 0 && y < 1 && y !== 0.5);

    let svg = d3.select('#plot-space')
        .append('svg')
        .attr('class', 'plot')
        .attr('viewBox', [0, 0, size.width, size.height])
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('resize', SVGResizeHandler)
        .on('wheel', delayedRescale(zoomDelay));

    let xScale = d3.scaleLinear().domain(plotRanges[0]).range([0, size.width]);
    let yScale = d3.scaleLinear().domain(plotRanges[1]).range([size.height, 0]);

    let xAxis = g => {
        let xRange = plotRanges[0][1] - plotRanges[0][0];
        let tickInterval = Math.pow(10, Math.round(Math.log10(xRange) - 1));
        while (xRange / tickInterval < 8) tickInterval /= 2;
        while (xRange / tickInterval > 25) tickInterval *= 2;

        let tickValues = [ plotRanges[0][0] - plotRanges[0][0] % tickInterval ];

        console.log(plotRanges[0]);
        while (tickValues[tickValues.length - 1] < plotRanges[0][1]) 
            tickValues.push(tickValues[tickValues.length - 1] + tickInterval);

        tickValues.pop();
        tickValues = tickValues.filter(x => x !== 0);

       g.call(d3
           .axisBottom(xScale)
           .tickValues(tickValues)
           .tickFormat(d => {
               if (Math.abs(Math.log10(d)) >= 3) return d.toExponential(2)
               else return d.toPrecision(3);
           })
       );
    };
    let yAxis = g => {
        let i = d3.interpolate(...plotRanges[1]);
        g.call(d3.axisLeft(yScale).tickValues(yTicks.map(i)));
    }

    let line = d3.line()
        .defined(d => !isNaN(d.x) && !isNaN(d.y))
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    let defTr = d3.transition().duration(200);

    svg.append('g')
        .attr('class', 'xaxis')
        .attr('transform', `translate(0, ${size.height / 2})`)
        .call(xAxis);
    svg.append('g')
        .attr('class', 'yaxis')
        .attr('transform', `translate(${size.width / 2}, 0)`)
        .call(yAxis);

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
        draw();
    }

    function SVGResizeHandler(event) {
        size = svg.node().getBoundingClientRect();
        aspectRatio = size.height / size.width;
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
