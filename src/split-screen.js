export function splitScreen() {
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
