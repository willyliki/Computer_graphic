var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    varying vec4 v_Color;
    void main(){
        gl_Position = a_Position;
        gl_PointSize = 10.0;
        v_Color = a_Color;
    }
    `;

var FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    void main(){
        gl_FragColor = v_Color;
    }
    `;

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

function main(){
    var canvas = document.getElementById('webgl');

    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    let renderProgram = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
 
    gl.useProgram(renderProgram);

    var n = initVertexBuffers(gl, renderProgram);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); //you are NOT allowed to change this line
}

function initVertexBuffers(gl, program){
    var vertices = new Float32Array(
        [-0.5, 0.5, 1.0, 0.0, 0.0,
         0.5, 0.5, 1.0, 1.0, 1.0, 
         -0.5, -0.5, 1.0, 1.0, 1.0, 
         0.5, -0.5, 0.0, 0.0, 1.0, 
         0.5, 0.5, 1.0, 1.0, 1.0,
         -0.5, -0.5, 1.0, 1.0, 1.0,
        ]
        //TODO-1: vertex and color array
    );
    
    //TODO-2: how many vertices to draw?
    var n = 6;
    
    //TODO-3: create a vertex buffer
    var vertexBuffer = gl.createBuffer();
    //TODO-4: bind buffer (gl.bindBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    //TODO-5: bind buffer data (gl.bufferData)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    var FSIZE = vertices.BYTES_PER_ELEMENT;

    //TODO-6: get reference of the attribute variable for vertex position
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    //TODO-7: layout of current vertex buffer object (gl.vertexAttribPointer)
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);
    //TODO-8: enable the attribute array
    gl.enableVertexAttribArray(a_Position);

    //TODO-9 repeat TODO-6~8 for the attribute variable to store vertex color information
    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
    gl.enableVertexAttribArray(a_Color);

    return n;
}