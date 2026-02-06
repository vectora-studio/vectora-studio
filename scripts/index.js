
ctx = canvas.getContext('2d');


// SELCTED TOOL
let tool = 'select';


// BRUSH TOOL
function brush(canvas, color, size, style) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = style;

    let drawing = false;

    canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    });

    canvas.addEventListener('mouseup', () => {
        drawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        drawing = false;
    });


}


// ENABLE TOOLS
function activateTool(tool) {
    switch (tool) {
        case 'select':
            console.log('hi')
            break;
        case 'brush':
            brush(canvas,"#ff1133",3,'round');
            break;
    }
}

activateTool(tool)

document.addEventListener("toolChange", (e) => {
    tool = e.detail.tool;
    activateTool(tool);
});



