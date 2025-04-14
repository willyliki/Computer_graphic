var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    varying vec4 v_Color;
    void main() {
        gl_Position = a_Position;
        gl_PointSize = 5.0;
        v_Color = a_Color;
    }
`;

var FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    void main() {
        gl_FragColor = v_Color;
    }
`;

function createProgram(gl, vertexShader, fragmentShader){
    //create the program and attach the shaders
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    //if success, return the program. if not, log the program info, and delete it.
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        return program;
    }
    alert(gl.getProgramInfoLog(program) + "");
    gl.deleteProgram(program);
}

function compileShader(gl, vShaderText, fShaderText){
    //////Build vertex and fragment shader objects
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    //The way to  set up shader text source
    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)
    //compile vertex shader
    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('vertex shader ereror');
        var message = gl.getShaderInfoLog(vertexShader); 
        console.log(message);//print shader compiling error message
    }
    //compile fragment shader
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('fragment shader ereror');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message);//print shader compiling error message
    }

    /////link shader to program (by a self-define function)
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    //if not success, log the program info, and delete it.
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        alert(gl.getProgramInfoLog(program) + "");
        gl.deleteProgram(program);
    }

    return program;
}

var shapeFlag = 'p'; // p: point, h: hori line, v: verti line, t: triangle, q: square, c: circle
var colorFlag = 'r'; // r: red, g: green, b: blue
var g_points = [];
var g_horiLines = [];
var g_vertiLines = [];
var g_triangles = [];
var g_squares = [];
var g_circles = [];
const MAX_NUM = 5;
var currentColor = [1.0, 0.0, 0.0, 1.0];

function main() {
    // Get the canvas context
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    
    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    gl.useProgram(program);

    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Register event handlers
    canvas.onmousedown = function(ev) { click(ev, gl, canvas); };
    document.onkeydown = function(ev) { keydown(ev); };
}

function keydown(ev) {
    // Change shape type based on key press
    if(ev.key == 'r' || ev.key == 'R'){ //an example for user press 'r'... 
        console.log('R');
        colorFlag = 'r';
        currentColor = [1.0, 0.0, 0.0, 1.0];
    }
    else if(ev.key == 'g' || ev.key == 'G'){
        console.log('G');
        colorFlag = 'g';
        currentColor = [0.0, 1.0, 0.0, 1.0];
    }
    else if(ev.key == 'b' || ev.key == 'B'){
        console.log('B');
        colorFlag = 'b';
        currentColor = [0.0, 0.0, 1.0, 1.0];
    }
    
    if(ev.key == 'p' || ev.key == 'P'){
        console.log('P');
        shapeFlag = 'p';
    }
    else if(ev.key == 'h' || ev.key == 'H'){
        console.log('H');
        shapeFlag = 'h';
    }
    else if(ev.key == 'v' || ev.key == 'V'){
        console.log('V');
        shapeFlag = 'v';
    }
    else if(ev.key == 't' || ev.key == 'T'){
        console.log('T');
        shapeFlag = 't';
    }
    else if(ev.key == 'q' || ev.key == 'Q'){
        console.log('Q');
        shapeFlag = 'q';
    }
    else if(ev.key == 'c' || ev.key == 'C'){
        console.log('C');
        shapeFlag = 'c';
    }
}

function click(ev, gl, canvas) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.height/2)/(canvas.height/2);
    y = (canvas.width/2 - (y - rect.top))/(canvas.height/2);
    
    switch (shapeFlag) {
        case 'p':
            g_points.push({x: x, y: y, color: [...currentColor]});
            if (g_points.length > MAX_NUM) g_points.shift();
            break;
        case 'h':
            g_horiLines.push({x: x, y: y, color: [...currentColor]});
            if (g_horiLines.length > MAX_NUM) g_horiLines.shift();
            break;
        case 'v':
            g_vertiLines.push({x: x, y: y, color: [...currentColor]});
            if (g_vertiLines.length > MAX_NUM) g_vertiLines.shift();
            break;
        case 't':
            g_triangles.push({x: x, y: y, color: [...currentColor]});
            if (g_triangles.length > MAX_NUM) g_triangles.shift();
            break;
        case 'q':
            g_squares.push({x: x, y: y, color: [...currentColor]});
            if (g_squares.length > MAX_NUM) g_squares.shift();
            break;
        case 'c':
            g_circles.push({x: x, y: y, color: [...currentColor]});
            if (g_circles.length > MAX_NUM) g_circles.shift();
            break;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    draw(gl);
}

function draw(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    drawPoints(gl);
    drawHorizontalLines(gl);
    drawVerticalLines(gl);
    drawTriangles(gl);
    drawSquares(gl);
    drawCircles(gl);
}

function drawPoints(gl) {
    if (g_points.length === 0) return;
    
    var vertices = [];
    var colors = [];
    
    for (var i = 0; i < g_points.length; i++) {
        var p = g_points[i];
        vertices.push(p.x, p.y);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    }
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    gl.drawArrays(gl.POINTS, 0, g_points.length);
}

function drawHorizontalLines(gl) {
    if (g_horiLines.length === 0) return;
    
    var vertices = [];
    var colors = [];
    
    var lineLength = 10;
    
    for (var i = 0; i < g_horiLines.length; i++) {
        var p = g_horiLines[i];

        vertices.push(p.x - lineLength, p.y);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        vertices.push(p.x + lineLength, p.y);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    }
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    gl.drawArrays(gl.LINES, 0, g_horiLines.length * 2);
}

function drawVerticalLines(gl) {
    if (g_vertiLines.length === 0) return;
    
    var vertices = [];
    var colors = [];
    
    var lineLength = 10;
    
    for (var i = 0; i < g_vertiLines.length; i++) {
        var p = g_vertiLines[i];

        vertices.push(p.x, p.y - lineLength);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        vertices.push(p.x, p.y + lineLength);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    }
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    gl.drawArrays(gl.LINES, 0, g_vertiLines.length * 2);
}

function drawTriangles(gl) {
    if (g_triangles.length === 0) return;
    
    var vertices = [];
    var colors = [];
    
    var size = 0.05;
    
    for (var i = 0; i < g_triangles.length; i++) {
        var p = g_triangles[i];
        
        vertices.push(p.x, p.y + size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        vertices.push(p.x - size, p.y - size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        vertices.push(p.x + size, p.y - size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    }
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_triangles.length * 3);
}

function drawSquares(gl) {
    if (g_squares.length === 0) return;
    
    var vertices = [];
    var colors = [];
    
    var size = 0.05;
    
    for (var i = 0; i < g_squares.length; i++) {
        var p = g_squares[i];
        
        // Square vertices (two triangles)
        // Triangle 1
        // Top left
        vertices.push(p.x - size, p.y + size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        // Bottom left
        vertices.push(p.x - size, p.y - size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        // Top right
        vertices.push(p.x + size, p.y + size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        // Triangle 2
        // Bottom left
        vertices.push(p.x - size, p.y - size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        // Bottom right
        vertices.push(p.x + size, p.y - size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        // Top right
        vertices.push(p.x + size, p.y + size);
        colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    }
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_squares.length * 6);
}

function drawCircles(gl) {
    if (g_circles.length === 0) return;
    
    var vertices = [];
    var colors = [];
    
    var radius = 0.05;
    var segments = 40;
    
    for (var i = 0; i < g_circles.length; i++) {
        var p = g_circles[i];
        
        for (var j = 0; j < segments; j++) {
            // Center point
            vertices.push(p.x, p.y);
            colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
            
            // First point on circumference
            var angle1 = j * 2 * Math.PI / segments;
            var x1 = p.x + radius * Math.cos(angle1);
            var y1 = p.y + radius * Math.sin(angle1);
            vertices.push(x1, y1);
            colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
            
            // Second point on circumference
            var angle2 = (j + 1) * 2 * Math.PI / segments;
            var x2 = p.x + radius * Math.cos(angle2);
            var y2 = p.y + radius * Math.sin(angle2);
            vertices.push(x2, y2);
            colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        }
    }
    
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_circles.length * segments * 3);
}
