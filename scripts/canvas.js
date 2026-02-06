const fs = require("fs");
const path = require("path");


const canvas = document.querySelector('#canvas');
const zoomValue = document.querySelector('.zoomValue');
const zoom_percentage = document.querySelector('.value');

const color_input = document.querySelector('.color-input');
const fill_box = document.querySelectorAll('.fill-box');

const brush_size = document.querySelector('#brush-size');
const brush_size_value = document.querySelector("#brush-size-value");

const canvas_input_color = document.querySelector('#canvas-input');
const canvas_color_box = document.querySelectorAll('.canvas-box');


const ctx = canvas.getContext('2d');

const current_frame = document.querySelector('#current-frame');
const total_frame = document.querySelector('#total-frame');

// SELECTED TOOL
let tool = 'select';

let cleanupTool = null;


let ratio_for_height = 360;
let ratio_for_width = 640;

// ===== FRAMES STORE =====
const frames_array = []

// Store brush settings globally
let brushSettings = {
    color: color_input.value,
    size: 3,
    style: "round"
};

// Brush Setting Update

brush_size.addEventListener('input', () => {
    brush_size_value.innerText = brush_size.value;
    brushSettings.size = brush_size.value;
    if (tool === 'brush' || tool === 'eraser' || tool === 'rect' || tool === 'circle' || tool === 'line') {
        activateTool(tool)
    }
})



color_input.addEventListener('input', () => {
    brushSettings.color = color_input.value
    if (tool === 'brush' || tool === 'eraser' || tool === 'rect' || tool === 'circle' || tool === 'line') {
        activateTool(tool)
    }
})

fill_box.forEach(item => {


    item.addEventListener('click', () => {
        if (item.id === 'color-input') {
            brushSettings.color = item.value;
            if (tool === 'brush' || tool === 'eraser' || tool === 'rect' || tool === 'circle' || tool === 'line') {
                activateTool(tool)
            }
        }
        else {
            brushSettings.color = item.innerText;
            if (tool === 'brush' || tool === 'eraser' || tool === 'rect' || tool === 'circle' || tool === 'line') {
                activateTool(tool)
            }
        }

    })
})






// Initialize canvas size based on zoom
const Init = () => {
    const height = 360;

    const ratio = ratio_for_height / height;
    const width = ratio_for_width / ratio;

    canvas.style.height = `${height}px`;
    canvas.style.width = `${width}px`;

    // Optional: Adjust internal canvas resolution for crisp drawing
    canvas.width = width;
    canvas.height = height;
};

Init();


// =====  CANVAS STYLE =====

function drawCanvasBackground(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

drawCanvasBackground(canvas_input_color.value)






canvas_input_color.addEventListener('input', () => {
    drawCanvasBackground(canvas_input_color.value)
})

canvas_color_box.forEach(clr => {
    clr.addEventListener('click', () => {
        if (clr.id === 'canvas-input') {
            drawCanvasBackground(canvas_input_color.value)
        }
        else {
            drawCanvasBackground(clr.innerText)
            canvas_input_color.value = clr.innerText;
        }
    })
})






// ===== BRUSH TOOL =====
let drawing = false;

const startDrawing = (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);

    if(auto_key_frame_enable) autoKeyframe(true);
};

const draw = (e) => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
};

const stopDrawing = () => {
    drawing = false;
    updateCurrentFrame()
    autoKeyframe(false)
};





// Attach brush listeners only once
const enableBrush = (color, size, style) => {

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = style;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // ✅ cleanup function
    return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);
    };
};


const startErase = (e) => {
    erasing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    if(auto_key_frame_enable) autoKeyframe(true);
};

const erase = (e) => {
    if (!erasing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
};

const stopErase = () => {
    erasing = false;
    ctx.closePath();
    updateCurrentFrame()
    autoKeyframe(false);
};

// ===== ERASER TOOL =====
function enableEraser(canvas, size, style) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = size;
    ctx.lineCap = style;

    let erasing = false;



    canvas.addEventListener('mousedown', startErase);
    canvas.addEventListener('mousemove', erase);
    canvas.addEventListener('mouseup', stopErase);
    canvas.addEventListener('mouseleave', stopErase);

    // Return cleanup function (IMPORTANT)
    return () => {
        canvas.removeEventListener('mousedown', startErase);
        canvas.removeEventListener('mousemove', erase);
        canvas.removeEventListener('mouseup', stopErase);
        canvas.removeEventListener('mouseleave', stopErase);
        ctx.globalCompositeOperation = 'source-over'; // reset back to normal
    };
}

// ===== LINE TOOL =====
let lineStartX = 0;
let lineStartY = 0;
let isDrawingLine = false;

function enableLine(color, lineWidth, style = "round") {

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = style;

    let snapshot;

    const startLine = (e) => {
        isDrawingLine = true;
        lineStartX = e.offsetX;
        lineStartY = e.offsetY;

        // save canvas state for preview
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if(auto_key_frame_enable) autoKeyframe(true);
    };

    const drawLine = (e) => {
        if (!isDrawingLine) return;

        ctx.putImageData(snapshot, 0, 0);

        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    };

    const stopLine = () => {
        isDrawingLine = false;
        updateCurrentFrame()
        autoKeyframe(false);
    };

    canvas.addEventListener('mousedown', startLine);
    canvas.addEventListener('mousemove', drawLine);
    canvas.addEventListener('mouseup', stopLine);
    canvas.addEventListener('mouseleave', stopLine);

    // cleanup (future safe)
    return () => {
        canvas.removeEventListener('mousedown', startLine);
        canvas.removeEventListener('mousemove', drawLine);
        canvas.removeEventListener('mouseup', stopLine);
        canvas.removeEventListener('mouseleave', stopLine);
    };
}




// ===== RECTANGLE TOOL =====
let rectStartX = 0;
let rectStartY = 0;
let isDrawingRect = false;

function enableRectangle(color, lineWidth) {

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "square";

    let snapshot;

    const startRect = (e) => {
        isDrawingRect = true;
        rectStartX = e.offsetX;
        rectStartY = e.offsetY;

        // canvas snapshot for live preview
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if(auto_key_frame_enable) autoKeyframe(true);
    };

    const drawRect = (e) => {
        if (!isDrawingRect) return;

        ctx.putImageData(snapshot, 0, 0);

        const width = e.offsetX - rectStartX;
        const height = e.offsetY - rectStartY;

        ctx.strokeRect(rectStartX, rectStartY, width, height);
    };

    const stopRect = () => {
        isDrawingRect = false;
        updateCurrentFrame()
        autoKeyframe(false);
    };

    canvas.addEventListener('mousedown', startRect);
    canvas.addEventListener('mousemove', drawRect);
    canvas.addEventListener('mouseup', stopRect);
    canvas.addEventListener('mouseleave', stopRect);

    // cleanup (optional, future use)
    return () => {
        canvas.removeEventListener('mousedown', startRect);
        canvas.removeEventListener('mousemove', drawRect);
        canvas.removeEventListener('mouseup', stopRect);
        canvas.removeEventListener('mouseleave', stopRect);
    };
}


// ===== CIRCLE TOOL =====
let circleStartX = 0;
let circleStartY = 0;
let isDrawingCircle = false;

function enableCircle(color, lineWidth) {

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    let snapshot;

    const startCircle = (e) => {
        isDrawingCircle = true;
        circleStartX = e.offsetX;
        circleStartY = e.offsetY;

        // canvas snapshot for live preview
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if(auto_key_frame_enable) autoKeyframe(true);
    };

    const drawCircle = (e) => {
        if (!isDrawingCircle) return;

        ctx.putImageData(snapshot, 0, 0);

        const radius = Math.sqrt(
            Math.pow(e.offsetX - circleStartX, 2) +
            Math.pow(e.offsetY - circleStartY, 2)
        );

        ctx.beginPath();
        ctx.arc(circleStartX, circleStartY, radius, 0, Math.PI * 2);
        ctx.stroke();
    };

    const stopCircle = () => {
        isDrawingCircle = false;
        updateCurrentFrame()
        autoKeyframe(false);
    };

    canvas.addEventListener('mousedown', startCircle);
    canvas.addEventListener('mousemove', drawCircle);
    canvas.addEventListener('mouseup', stopCircle);
    canvas.addEventListener('mouseleave', stopCircle);

    // cleanup (optional future use)
    return () => {
        canvas.removeEventListener('mousedown', startCircle);
        canvas.removeEventListener('mousemove', drawCircle);
        canvas.removeEventListener('mouseup', stopCircle);
        canvas.removeEventListener('mouseleave', stopCircle);
    };
}



// ===== TOOL ACTIVATION =====
function activateTool(selectedTool) {

    // ❌ remove previous tool events
    if (cleanupTool) {
        cleanupTool();
        cleanupTool = null;
    }

    tool = selectedTool;

    switch (tool) {
        case 'select':
            console.log('Select tool active');
            // 👆 yahan kuch add nahi, sirf events removed
            break;

        case 'brush':
            cleanupTool = enableBrush(
                brushSettings.color,
                brushSettings.size,
                brushSettings.style
            );
            break;

        case 'eraser':
            cleanupTool = enableEraser(
                canvas,
                brushSettings.size,
                brushSettings.style
            );
            break;
        case 'rect':
            cleanupTool = enableRectangle(
                brushSettings.color,
                brushSettings.size
            );
            break;
        case 'circle':
            cleanupTool = enableCircle(
                brushSettings.color,
                brushSettings.size
            )
            break;
        case 'line':
            cleanupTool = enableLine(
                brushSettings.color,
                brushSettings.size
            )
    }
}


// Activate initial tool
activateTool(tool);

// Listen for tool changes
document.addEventListener("toolChange", (e) => {
    tool = e.detail.tool;
    activateTool(tool);
});



// ===== CLEAR CANVAS =====
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateCurrentFrame()
}


// ===== ADD IMAGE IN CANVAS =====
function drawImageOnCanvas(src, x, y, w = 150, h = 150) {
    const img = new Image();
    img.src = src;

    img.onload = () => {
        ctx.drawImage(img, (x - w / 2), (y - h / 2), w, h);
        updateCurrentFrame()
        if(auto_key_frame_enable) addFrame();


    };
}

canvas.addEventListener("dragover", (e)=>{
    e.preventDefault()
    
});

canvas.addEventListener("drop", e => {
    e.preventDefault();
    const path = e.dataTransfer.getData("path");

    const rect = canvas.getBoundingClientRect();

    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    drawImageOnCanvas(path, x, y);
});






// ===== FRAMES ADD AND PLAYBACK =====

function addFrame() {
    const frame_obj = ctx.getImageData(0, 0, canvas.width, canvas.height);
    frames_array.push(frame_obj);

    generateFrames()

    if (frames_array.length >= total_frame.value) {
        total_frame.value = frames_array.length;

        generateFramesNumbers(total_frame.value)
        frames.style.width = frames_array.length * 30 + 'px';
        track.style.width = frames_array.length * 30 + 'px';
    }

    updateRenderFrames()


}

function loadFrame(index) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(frames_array[index], 0, 0);
}
total_frame.addEventListener('input', () => {
    frames_length = total_frame.value
})

current_frame.addEventListener('input', () => {
    loadFrame(current_frame.value);
})

let currentFrame = parseInt(current_frame.value);
let fps = parseInt(document.querySelector("#fps").value);
let playing = false;
let playInterval;

const fpsSelect = document.querySelector("#fps");

fpsSelect.addEventListener("change", () => {
    fps = parseInt(fpsSelect.value);


    if (playing) {
        stop();
        play();
    }
});


function play() {
    if (frames_array.length === 0) return;
    let currentFrame = current_frame.value;

    document.querySelector('#play-btn').style.display = 'none';
    document.querySelector('#stop-btn').style.display = 'block';

    playing = true;
    playInterval = setInterval(() => {
        loadFrame(currentFrame);
        currentFrame = (currentFrame + 1) % frames_array.length;
        current_frame.value = currentFrame + 1;
        current_frame.readOnly = true
    }, 1000 / fps);
}

function stop() {
    playing = false;
    clearInterval(playInterval);
    current_frame.readOnly = false
    document.querySelector('#play-btn').style.display = 'block';
    document.querySelector('#stop-btn').style.display = 'none';
}


document.querySelector('#prev-frame').addEventListener('click', () => {

    // convert to number
    let frame_value = parseInt(current_frame.value);

    // stop at 0
    if (frame_value <= 0) return;

    frame_value--;

    current_frame.value = frame_value;
    currentFrame = frame_value;

    loadFrame(frame_value);
});

document.querySelector('#next-frame').addEventListener('click', () => {

    // convert to number
    let frame_value_next = parseInt(current_frame.value);



    frame_value_next++;

    current_frame.value = frame_value_next;
    currentFrame = frame_value_next;

    loadFrame(frame_value_next);
});

// ===== TIMELINE =====
const frames = document.querySelector('.frames');
const tracks = document.querySelector('.tracks');
const track = document.querySelector('.track');

let frames_length = total_frame.value;

frames.style.width = frames_length * 30 + 'px';
track.style.width = frames_length * 30 + 'px';

let active_frame = (frames_array.length - 1);




function generateFramesNumbers(length) {
    frames.innerHTML = ''
    for (let f = 1; f <= length; f++) {
        const frame = document.createElement('p');
        frame.classList.add('frame');
        frame.textContent = f;

        frames.appendChild(frame)
    }
}

generateFramesNumbers(total_frame.value);

total_frame.addEventListener('input', () => {
    generateFramesNumbers(total_frame.value)
    frames.style.width = total_frame.value * 30 + 'px';
    track.style.width = total_frame.value * 30 + 'px';


})




// ===== FRAMES KEYS GENERATE =====
function generateFrames() {
    track.innerHTML = '';

    frames_array.forEach((frame, index) => {
        const frame_key = document.createElement("div");
        frame_key.classList.add('frame_key');

        frame_key.style.left = (index * 30) + 'px';

        // active frame highlight (initial render)
        if (index === active_frame) {
            frame_key.classList.add('selectedFrame');
        }

        frame_key.addEventListener('click', (e) => {
            e.stopPropagation()
            active_frame = index;

            // remove selected from all
            document.querySelectorAll('.frame_key').forEach(el => {
                el.classList.remove('selectedFrame');
            });

            // add to clicked
            frame_key.classList.add('selectedFrame');

            //load a frame
            loadFrame(index)
            current_frame.value = index;
        });

        track.appendChild(frame_key);
    });
}

document.addEventListener('click', () => {
    document.querySelectorAll('.frame_key').forEach(el => {
        el.classList.remove('selectedFrame');
    });
})

// ===== DELETE FRAME =====
function deleteFrame(index) {
    if (index < 0 || index >= frames_array.length) return;

    frames_array.splice(index, 1);

    // active frame adjust
    if (active_frame >= frames_array.length) {
        active_frame = frames_array.length - 1;
    }

    // if no frames left
    if (frames_array.length === 0) {
        active_frame = -1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        loadFrame(active_frame);
    }

    generateFrames();
    updateRenderFrames();
}

document.querySelector("#delete-frame").addEventListener('click', () => {
    deleteFrame(active_frame);
});

// ===== EDIT CURRENT FRAME =====
function updateCurrentFrame() {
    if (active_frame < 0) return;

    const new_frame = ctx.getImageData(0, 0, canvas.width, canvas.height);


    frames_array[active_frame] = new_frame;

    generateFrames();


}


// ===== RENDER FRAMES =====
const renderQuality = document.querySelectorAll('.fileSize')
const export_path = document.querySelector('#export-path');
const render_frames = document.querySelector('#export-frames');
const renderStart = document.querySelector('#renderStart');




function updateRenderFrames() {
    document.querySelector('#export-frames').value = frames_array.length;
}

updateRenderFrames()




function renderNow() {
    for (let r = 0; r < render_frames.value; r++) {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        loadFrame(r)



        document.querySelector('.render-progress').style.display = 'block'

        const dataURL = canvas.toDataURL("image/png");
        const base64 = dataURL.replace(/^data:image\/png;base64,/, "");

        const frameName = `frame_${String(r).padStart(4, "0")}.png`;
        const filePath = path.join(export_path.value, frameName);

        fs.writeFileSync(filePath, base64, "base64");

        let per = (r + 1) / render_frames.value * 100;



        document.querySelector('.progress-text').innerText = `Render Frames ${r + 1} / ${render_frames.value}`;

        document.querySelector('.progress-fill').style.width = `${per}%`


    }
}

renderStart.addEventListener('click', () => {
    renderStartNow()

})

function renderStartNow() {
    if (!export_path.value.trim()) {
        alert("Select export location");
        return;
    }

    if (render_frames.value < 1) {
        alert("Invalid frame count");
        return;
    }



    renderNow()







    setTimeout(() => {
        document.querySelector('.render-progress').style.display = 'none'
        document.querySelector('.export').style.display = 'none'

    }, 1000)
}



document.addEventListener('keydown',(e)=>{
    switch(e.key){
        case 'F10':
            document.querySelector('.export').style.display = 'flex'
            break
    }
})

// ===== AUTO KEYFRAME ADD =====
let auto_key_frame_enable = false;
let auto_frame; // interval handle

function autoKeyframe(start) {
    if (start) {
        // start interval only if not already running
        if (!auto_frame) {
            auto_frame = setInterval(() => {
                addFrame();
            }, 1000 / fps);
        }
    } else {
        // stop interval
        clearInterval(auto_frame);
        auto_frame = null;
    }
}

// toggle button just changes enable flag
document.querySelector('#auto-frame').addEventListener('click', () => {
    auto_key_frame_enable = !auto_key_frame_enable;

    if (auto_key_frame_enable) {
        document.querySelector('#auto-frame').style.backgroundColor = '#f42a2a';
        document.querySelector('#auto-frame').style.borderRadius = '50%';
    } else {
        document.querySelector('#auto-frame').style.backgroundColor = '#1b1c1d';
        // optionally stop autoKeyframe if you want
        autoKeyframe(false);
    }
});

// example usage on canvas draw
canvas.addEventListener('mousedown', () => {
    if (auto_key_frame_enable) autoKeyframe(true); // start auto keyframes while drawing
});

canvas.addEventListener('mouseup', () => {
    autoKeyframe(false); // stop auto keyframes when mouse up
});
