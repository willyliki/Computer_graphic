//This template has been completed to meet the homework requirements
//for drawing shapes with different colors and maintaining only the last 5 shapes of each type

// Vertex shader program
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute float a_PointSize;
    attribute vec4 a_Color;
    varying vec4 v_Color;
    void main() {
        gl_Position = a_Position;
        gl_PointSize = a_PointSize;
        v_Color = a_Color;
    }
`;

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    void main() {
        gl_FragColor = v_Color;
    }
`;

// Shape flags
var shapeFlag = 'p'; // p: point, h: hori line, v: verti line, t: triangle, q: square, c: circle
var colorFlag = 'r'; // r: red, g: green, b: blue

// Arrays to store shape data
var g_points = [];
var g_horiLines = [];
var g_vertiLines = [];
var g_triangles = [];
var g_squares = [];
var g_circles = [];

// Maximum number of each shape type to keep
const MAX_SHAPES = 5;

// Current color
var currentColor = [1.0, 0.0, 0.0, 1.0]; // Default red

// Canvas and WebGL context
var canvas;
var gl;

function main() {
    // Get the canvas context
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Register event handlers
    canvas.onmousedown = function(ev) { click(ev, gl, canvas); };
    document.onkeydown = function(ev) { keydown(ev); };
}

// Initialize shader objects
function initShaders(gl, vshaderSource, fshaderSource) {
    // Create shader objects
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    
    // Set the shader source code
    gl.shaderSource(vertexShader, vshaderSource);
    gl.shaderSource(fragmentShader, fshaderSource);
    
    // Compile the shaders
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);
    
    // Check if compilation succeeded
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log('Failed to compile vertex shader: ' + gl.getShaderInfoLog(vertexShader));
        return false;
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log('Failed to compile fragment shader: ' + gl.getShaderInfoLog(fragmentShader));
        return false;
    }
    
    // Create the program object
    var program = gl.createProgram();
    
    // Attach the shader objects
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    
    // Link the program object
    gl.linkProgram(program);
    
    // Check if linking succeeded
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log('Failed to link program: ' + gl.getProgramInfoLog(program));
        return false;
    }
    
    // Use the program object
    gl.useProgram(program);
    
    // Save the program object
    gl.program = program;
    
    return true;
}

function keydown(ev) {
    // Change shape type based on key press
    if (ev.key === 'p' || ev.key === 'h' || ev.key === 'v' || 
        ev.key === 't' || ev.key === 'q' || ev.key === 'c') {
        shapeFlag = ev.key;
        console.log('Shape changed to: ' + shapeFlag);
    }
    
    // Change color based on key press
    if (ev.key === 'r') {
        colorFlag = 'r';
        currentColor = [1.0, 0.0, 0.0, 1.0]; // Red
        console.log('Color changed to red');
    } else if (ev.key === 'g') {
        colorFlag = 'g';
        currentColor = [0.0, 1.0, 0.0, 1.0]; // Green
        console.log('Color changed to green');
    } else if (ev.key === 'b') {
        colorFlag = 'b';
        currentColor = [0.0, 0.0, 1.0, 1.0]; // Blue
        console.log('Color changed to blue');
    }
}

function click(ev, gl, canvas) {
    // Convert mouse coordinates to WebGL coordinates
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.height/2)/(canvas.height/2);
    y = (canvas.width/2 - (y - rect.top))/(canvas.height/2);
    
    // Store the coordinates based on the current shape type
    switch (shapeFlag) {
        case 'p': // Point
            g_points.push({x: x, y: y, color: [...currentColor]});
            if (g_points.length > MAX_SHAPES) g_points.shift();
            break;
        case 'h': // Horizontal line
            g_horiLines.push({x: x, y: y, color: [...currentColor]});
            if (g_horiLines.length > MAX_SHAPES) g_horiLines.shift();
            break;
        case 'v': // Vertical line
            g_vertiLines.push({x: x, y: y, color: [...currentColor]});
            if (g_vertiLines.length > MAX_SHAPES) g_vertiLines.shift();
            break;
        case 't': // Triangle
            g_triangles.push({x: x, y: y, color: [...currentColor]});
            if (g_triangles.length > MAX_SHAPES) g_triangles.shift();
            break;
        case 'q': // Square
            g_squares.push({x: x, y: y, color: [...currentColor]});
            if (g_squares.length > MAX_SHAPES) g_squares.shift();
            break;
        case 'c': // Circle
            g_circles.push({x: x, y: y, color: [...currentColor]});
            if (g_circles.length > MAX_SHAPES) g_circles.shift();
            break;
    }
    
    // Redraw the canvas
    draw(gl);
}

function draw(gl) {
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Draw all shapes
    drawPoints(gl);
    drawHorizontalLines(gl);
    drawVerticalLines(gl);
    drawTriangles(gl);
    drawSquares(gl);
    drawCircles(gl);
}

function drawPoints(gl) {
    if (g_points.length === 0) return;
    
    // Create vertex buffer
    var vertices = [];
    var colors = [];
    var sizes = [];
    
    // Add point data
    for (var i = 0; i < g_points.length; i++) {
        var p = g_points[i];
        vertices.push(p.x, p.y);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0); // Point size
    }
    
    // Create and bind buffers
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    var sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
    
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_PointSize);
    
    // Draw the points
    gl.drawArrays(gl.POINTS, 0, g_points.length);
}

function drawHorizontalLines(gl) {
    if (g_horiLines.length === 0) return;
    
    // Create vertex buffer
    var vertices = [];
    var colors = [];
    var sizes = [];
    
    // Line length - horizontal line that extends 0.1 units left and right
    var lineLength = 10;
    
    // Add line data
    for (var i = 0; i < g_horiLines.length; i++) {
        var p = g_horiLines[i];
        // Start point (left)
        vertices.push(p.x - lineLength, p.y);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
        
        // End point (right)
        vertices.push(p.x + lineLength, p.y);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
    }
    
    // Create and bind buffers
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    var sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
    
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_PointSize);
    
    // Draw the lines
    gl.drawArrays(gl.LINES, 0, g_horiLines.length * 2);
}

function drawVerticalLines(gl) {
    if (g_vertiLines.length === 0) return;
    
    // Create vertex buffer
    var vertices = [];
    var colors = [];
    var sizes = [];
    
    // Line length - vertical line that extends 0.1 units up and down
    var lineLength = 10;
    
    // Add line data
    for (var i = 0; i < g_vertiLines.length; i++) {
        var p = g_vertiLines[i];
        // Start point (bottom)
        vertices.push(p.x, p.y - lineLength);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
        
        // End point (top)
        vertices.push(p.x, p.y + lineLength);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
    }
    
    // Create and bind buffers
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    var sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
    
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_PointSize);
    
    // Draw the lines
    gl.drawArrays(gl.LINES, 0, g_vertiLines.length * 2);
}

function drawTriangles(gl) {
    if (g_triangles.length === 0) return;
    
    // Create vertex buffer
    var vertices = [];
    var colors = [];
    var sizes = [];
    
    // Triangle size
    var size = 0.05;
    
    // Add triangle data
    for (var i = 0; i < g_triangles.length; i++) {
        var p = g_triangles[i];
        
        // Triangle vertices
        // Top point
        vertices.push(p.x, p.y + size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
        
        // Bottom left
        vertices.push(p.x - size, p.y - size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
        
        // Bottom right
        vertices.push(p.x + size, p.y - size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
    }
    
    // Create and bind buffers
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    var sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
    
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_PointSize);
    
    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, g_triangles.length * 3);
}

function drawSquares(gl) {
    if (g_squares.length === 0) return;
    
    // Create vertex buffer
    var vertices = [];
    var colors = [];
    var sizes = [];
    
    // Square size
    var size = 0.05;
    
    // Add square data
    for (var i = 0; i < g_squares.length; i++) {
        var p = g_squares[i];
        
        // Square vertices (two triangles)
        // Triangle 1
        // Top left
        vertices.push(p.x - size, p.y + size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
        
        // Bottom left
        vertices.push(p.x - size, p.y - size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
        
        // Top right
        vertices.push(p.x + size, p.y + size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
        
        // Triangle 2
        // Bottom left
        vertices.push(p.x - size, p.y - size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
        
        // Bottom right
        vertices.push(p.x + size, p.y - size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
        
        // Top right
        vertices.push(p.x + size, p.y + size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        sizes.push(5.0);
    }
    
    // Create and bind buffers
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    var sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
    
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_PointSize);
    
    // Draw the squares
    gl.drawArrays(gl.TRIANGLES, 0, g_squares.length * 6);
}

function drawCircles(gl) {
    if (g_circles.length === 0) return;
    
    // Create vertex buffer
    var vertices = [];
    var colors = [];
    var sizes = [];
    
    // Circle parameters
    var radius = 0.05;
    var segments = 40; // Number of segments to approximate a circle
    
    // Add circle data
    for (var i = 0; i < g_circles.length; i++) {
        var p = g_circles[i];
        
        // Create a fan of triangles to form a circle
        for (var j = 0; j < segments; j++) {
            // Center point
            vertices.push(p.x, p.y);
            colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
            sizes.push(5.0);
            
            // First point on circumference
            var angle1 = j * 2 * Math.PI / segments;
            var x1 = p.x + radius * Math.cos(angle1);
            var y1 = p.y + radius * Math.sin(angle1);
            vertices.push(x1, y1);
            colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
            sizes.push(5.0);
            
            // Second point on circumference
            var angle2 = (j + 1) * 2 * Math.PI / segments;
            var x2 = p.x + radius * Math.cos(angle2);
            var y2 = p.y + radius * Math.sin(angle2);
            vertices.push(x2, y2);
            colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
            sizes.push(5.0);
        }
    }
    
    // Create and bind buffers
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    var sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
    
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_PointSize);
    
    // Draw the circles
    gl.drawArrays(gl.TRIANGLES, 0, g_circles.length * segments * 3);
}
