var VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        varying vec4 v_Color;
        void main(){
            gl_Position = u_modelMatrix * a_Position;
            gl_PointSize = 5.0;
            v_Color = a_Color;
        }
    `;

var FSHADER_SOURCE = `
        precision mediump float;
        varying vec4 v_Color;
        void main(){
            gl_FragColor = u_FragColor;
        }
    `;

function createProgram(gl, vertexShader, fragmentShader){
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        return program;
    }
    alert(gl.getProgramInfoLog(program) + "");
    gl.deleteProgram(program);
}

function compileShader(gl, vShaderText, fShaderText){
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)

    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('vertex shader ereror');
        var message = gl.getShaderInfoLog(vertexShader); 
        console.log(message);
    }

    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('fragment shader ereror');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message);
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        alert(gl.getProgramInfoLog(program) + "");
        gl.deleteProgram(program);
    }

    return program;
}

function initAttributeVariable(gl, a_attribute, buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(gl, data, num, type) {

    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
    buffer.num = num;
    buffer.type = type;
  
    return buffer;
}

function initVertexBufferForLaterUse(gl, vertices, colors){
    var nVertices = vertices.length / 3;

    var o = new Object();
    o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
    o.colorBuffer = initArrayBufferForLaterUse(gl, new Float32Array(colors), 3, gl.FLOAT);
    if (!o.vertexBuffer || !o.colorBuffer) 
        console.log("Error: in initVertexBufferForLaterUse(gl, vertices, colors)"); 
    o.numVertices = nVertices;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

var shapeFlag = 'p'; //p: point, h: hori line: v: verti line, t: triangle, q: square, c: circle
var colorFlag = 'r'; //r g b 
var g_points = [];
var g_horiLines = [];
var g_vertiLines = [];
var g_triangles = [];
var g_squares = [];
var g_circles = [];
//var ... of course you may need more variables
const MAX_NUM = 5;
var currentColor = [1.0, 0.0, 0.0, 1.0];
//point
var p_vertices = [];
var p_colors = [];
for (var i = 0; i < g_points.length; i++) {
    var p = g_points[i];
    p_vertices.push(p.x, p.y);
    p_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
}
//horizontal line
var h_vertices = [];
var h_colors = [];
var lineLength = 10.0;
for (var i = 0; i < g_horiLines.length; i++) {
    var p = g_horiLines[i];

    h_vertices.push(p.x - lineLength, p.y);
    h_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);

    h_vertices.push(p.x + lineLength, p.y);
    h_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
}
//vertical line
var v_vertices = [];
var v_colors = [];
for (var i = 0; i < g_vertiLines.length; i++) {
    var p = g_vertiLines[i];

    v_vertices.push(p.x, p.y - lineLength);
    v_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);

    v_vertices.push(p.x, p.y + lineLength);
    v_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
}
//triangle
var t_vertices = [];
var t_colors = [];
var t_size = 0.05;
for (var i = 0; i < g_triangles.length; i++) {
    var p = g_triangles[i];

    t_vertices.push(p.x, p.y + size);
    t_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);

    t_vertices.push(p.x - size, p.y - size);
    t_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);

    t_vertices.push(p.x + size, p.y - size);
    t_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
}
//square
var q_vertices = [];
var q_colors = [];
var q_size = 0.05;
for (var i = 0; i < g_squares.length; i++) {
    var p = g_squares[i];
    
    q_vertices.push(p.x - size, p.y + size);
    q_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    
    q_vertices.push(p.x - size, p.y - size);
    q_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    
    q_vertices.push(p.x + size, p.y + size);
    q_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    
    q_vertices.push(p.x - size, p.y - size);
    q_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    
    q_vertices.push(p.x + size, p.y - size);
    q_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    
    q_vertices.push(p.x + size, p.y + size);
    q_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
}
//circle
var c_vertices = [];
var c_colors = [];
var radius = 0.05;
var sagments = 40;
for (var i = 0; i < g_circles.length; i++) {
    var p = g_circles[i];
    
    for (var j = 0; j < segments; j++) {
        c_vertices.push(p.x, p.y);
        c_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        var angle1 = j * 2 * Math.PI / segments;
        var x1 = p.x + radius * Math.cos(angle1);
        var y1 = p.y + radius * Math.sin(angle1);
        c_vertices.push(x1, y1);
        c_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
        
        var angle2 = (j + 1) * 2 * Math.PI / segments;
        var x2 = p.x + radius * Math.cos(angle2);
        var y2 = p.y + radius * Math.sin(angle2);
        c_vertices.push(x2, y2);
        c_colors.push(p.color[0], p.color[1], p.color[2], p.color[3]);
    }
}

function main(){
    //////Get the canvas context
    var canvas = document.getElementById('webgl');
    //var gl = canvas.getContext('webgl') || canvas.getContext('exprimental-webgl') ;
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    // compile shader and use program
    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    if(program.a_Position<0 || program.a_Color<0) {
        console.log('Error: f(program.a_Position<0 || program.a_Color<0 || .....');
    }

    pointModel = initVertexBufferForLaterUse(gl, );
    horizontal_line_Model = 
    vertical_line_Model = 
    triangleModel = 
    squareModel = 
    circleModel = 

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // mouse and key event...
    canvas.onmousedown = function(ev){click(ev)};
    document.onkeydown = function(ev){keydown(ev)};
}

function keydown(ev){ //you may want to define more arguments for this function
    //implment keydown event here

    if(ev.key == 'r'){ //an example for user press 'r'... 
        console.log('R');
        colorFlag = 'r';
        currentColor = [1.0, 0.0, 0.0, 1.0];
    }
    else if(ev.key == 'g'){
        console.log('G');
        colorFlag = 'g';
        currentColor = [0.0, 1.0, 0.0, 1.0];
    }
    else if(ev.key == 'b'){
        console.log('B');
        colorFlag = 'b';
        currentColor = [0.0, 0.0, 1.0, 1.0];
    }
    
    if(ev.key == 'p'){
        console.log('P');
        shapeFlag = 'p';
    }
    else if(ev.key == 'h'){
        console.log('H');
        shapeFlag = 'h';
    }
    else if(ev.key == 'v'){
        console.log('V');
        shapeFlag = 'v';
    }
    else if(ev.key == 't'){
        console.log('T');
        shapeFlag = 't';
    }
    else if(ev.key == 'q'){
        console.log('Q');
        shapeFlag = 'q';
    }
    else if(ev.key == 'c'){
        console.log('C');
        shapeFlag = 'c';
    }
}

function click(ev, gl, canvas){ //you may want to define more arguments for this function
    //mouse click: recall our quiz1 in calss
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.height/2)/(canvas.height/2)
    y = (canvas.width/2 - (y - rect.top))/(canvas.height/2)

    //you might want to do something here
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

    //self-define draw() function
    //I suggest that you can clear the canvas
    //and redraw whole frame(canvas) after any mouse click
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    draw(gl);
}

function draw(gl){ //you may want to define more arguments for this function
    //redraw whole canvas here
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    //Note: you are only allowed to same shapes of this frame by single gl.drawArrays() call
}
