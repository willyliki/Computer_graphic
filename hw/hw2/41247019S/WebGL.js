var VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        uniform mat4 u_modelMatrix;
        varying vec4 v_Color;
        void main(){
            gl_Position = u_modelMatrix * a_Position;
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

function initAttributeVariable(gl, a_attribute, buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(gl, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return null;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
    // Store the necessary information to assign the object to the attribute variable later
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

var transformMat = new Matrix4();
var transformMatObject = new Matrix4();
transformMatObject.setTranslate(0.5, 0, 0);

// rectangle for head
var rectangleVerticesA = [-0.3, 0.3, 0.0, 0.3, 0.3, 0.0, 0.3, 0.0, 0.0, -0.3, 0.0, 0.0]; // width: 0.6, height: 0.3
var rectangleColorA = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]; // gray

// rectangle for body
var rectangleVerticeB = [-0.15, 0.0, 0.0, 0.15, 0.0, 0.0, 0.15, -0.5, 0.0, -0.15, -0.5, 0.0]; // width: 0.2, height: 0.5
var rectangleColorB = [0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75]; // gray but whiter

// rectangle for leg and left arm
var rectangleVerticeC = [-0.05, 0.15, 0.0, 0.05, 0.15, 0.0, 0.05, -0.15, 0.0, -0.05, -0.15, 0.0]; // width: 0.05, height: 0.2
var rectangleColorC = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]; // white

// rectangle for right arm and object middle
var rectangleVerticeD = [-0.15, 0.05, 0.0, 0.15, 0.05, 0.0, 0.15, -0.05, 0.0, -0.15, -0.05, 0.0]; // width: 0.2, height: 0.05
var rectangleColorD = [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25]; // gray but darker

// triangle for left hand
var triangleVerticesA = [0.0, 0.1, 0.0, -0.05, 0.0, 0.0, 0.05, 0.0, 0.0]; // width: 0.1, height: 0.1
var triangleColorA = [1.0, 1.0, 0, 1.0, 1.0, 0, 1.0, 1.0, 0]; // yellow

// triangle for right hand
var triangleVerticesB = [0.0, 0.05, 0.0, -0.05, -0.05, 0.0, 0.05, -0.05, 0.0]; // width: 0.1, height: 0.1
var triangleColorB = [0, 0.5, 0.5, 0, 0.5, 0.5, 0, 0.5, 0.5]; // drak blue

// circle for robot joints
var circleVerticesA = [];
var circleColorsA = [];
var circleRadiusA = 0.05;
for (i = 0; i <= 1000; i++){
    var x = circleRadiusA * Math.cos(i * 2 * Math.PI / 200);
    var y = circleRadiusA * Math.sin(i * 2 * Math.PI / 200);
    circleVerticesA.push(x, y);
    circleColorsA.push(0.75, 0.75, 0.75); // gray but whiter
}

var robotXMove = 0;
var robotYMove = 0;
var arm1Angle = 0;
var arm2Angle = 0;
var handAngle = 90;
var object1Angle = 270;
var object2Angle = 0;
var grab = false;
var canGrab = false;
var joint = 1;
var sceneScale = 1.0;

// circle for object
var circleVerticesB = [];
var circleColorsB = [];
var circleColorsTouch = [];
var circleColorsGrab = [];
var circleRadiusB = 0.1;
for (i = 0; i <= 1000; i++){
    circleRadiusB = 0.05;
    x = circleRadiusB*Math.cos(i * 2 * Math.PI / 200);
    y = circleRadiusB*Math.sin(i * 2 * Math.PI / 200);
    circleVerticesB.push(x, y);
    circleColorsB.push(1, 0, 0);
    circleColorsTouch.push(0, 1, 0);
    circleColorsGrab.push(0, 0.5, 0); 
}

function updateTextOverlay() {
    const textOverlay = document.getElementById('textOverlay');
    textOverlay.innerHTML = `
        -------------------------------------------------------------------------------<br>
        Moving robot: <br>
        Left: a/A <br>
        Right: d/D <br>
        Up: w/W <br>
        Down: s/S <br>
        -------------------------------------------------------------------------------<br>
        Rotating joint: <br>
        Robot shoulder: 1 <br>
        Robot elbow: 2 <br>
        Robot wrist: 3 <br>
        Object top: 4 <br>
        Object bottom: 5 <br>
        -------------------------------------------------------------------------------<br>
        Zoom in: z/Z <br>
        Zoom out: x/X <br>
        -------------------------------------------------------------------------------<br>
        **Only the top circle can be grab.** <br> 
        Can grab: <br>
        Red -> Light green: it means the object can be grabed. <br> 
        Grab: <br>
        Light green -> dark green: it means you have grabed the object. <br>
        -------------------------------------------------------------------------------
    `;
}

function main(){
    var canvas = document.getElementById('webgl');
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix');
    if(program.a_Position<0 || program.a_Color<0 || program.u_modelMatrix < 0)  
        console.log('Error: f(program.a_Position<0 || program.a_Color<0 || .....');

    rectangleModelA = initVertexBufferForLaterUse(gl, rectangleVerticesA, rectangleColorA);
    rectangleModelB = initVertexBufferForLaterUse(gl, rectangleVerticeB, rectangleColorB);
    rectangleModelC = initVertexBufferForLaterUse(gl, rectangleVerticeC, rectangleColorC);
    rectangleModelD = initVertexBufferForLaterUse(gl, rectangleVerticeD, rectangleColorD);

    triangleModelA = initVertexBufferForLaterUse(gl, triangleVerticesA, triangleColorA);
    triangleModelB = initVertexBufferForLaterUse(gl, triangleVerticesB, triangleColorB);

    circleModelA = initVertexBufferForLaterUse(gl, circleVerticesA, circleColorsA);
    circleModelB = initVertexBufferForLaterUse(gl, circleVerticesB, circleColorsB);
    circleModelTouch = initVertexBufferForLaterUse(gl, circleVerticesB, circleColorsTouch);
    circleModelGrab = initVertexBufferForLaterUse(gl, circleVerticesB, circleColorsGrab);

    document.addEventListener('keydown', (event)=> {    
        if (event.key == 'a' || event.key == 'A') {
            console.log('A');
            robotXMove -= 0.025;
            if (robotXMove < -0.9/sceneScale) robotXMove = -0.9/sceneScale;
            draw(gl);
        } else if (event.key == 'd' || event.key == 'D') {
            console.log('D');
            robotXMove += 0.025;
            if (robotXMove > 0.9/sceneScale) robotXMove = 0.9/sceneScale;
            draw(gl);
        } else if (event.key == 's' || event.key == 'S') {
            console.log('S');
            robotYMove -= 0.025;
            if (robotYMove < -0.9/sceneScale) robotYMove = -0.9/sceneScale;
            draw(gl);
        } else if (event.key == 'w' || event.key == 'W') {
            console.log('W');
            robotYMove += 0.025;
            if (robotYMove > 0.9/sceneScale) robotYMove = 0.9/sceneScale;
            draw(gl);
        } else if (event.key == 'z' || event.key == 'Z') {
            console.log('Z');
            sceneScale *= 1.1;
            if (sceneScale > 2.0) sceneScale = 2.0;
            draw(gl);
        } else if (event.key == 'x' || event.key == 'X') {
            console.log('X');
            sceneScale /= 1.1;
            if (sceneScale < 0.2) sceneScale = 0.2;
            draw(gl);
        } else if (event.key == '1') {
            console.log('1');
            joint = 1;
        } else if (event.key == '2') {
            console.log('2');
            joint = 2;
        } else if (event.key == '3') {
            console.log('3');
            joint = 3;
        } else if (event.key == '4') {
            console.log('4');
            joint = 4;
        } else if (event.key == '5') {
            console.log('5');
            joint = 5;
        } else if (event.key == 'r' || event.key == 'R') {
            console.log('R');
            if (joint == 1) arm1Angle += 10;
            else if (joint == 2) arm2Angle += 10;
            else if (joint == 3) handAngle += 10;
            else if (joint == 4) object1Angle += 10;
            else if (joint == 5) object2Angle += 10;
            draw(gl);
        } else if (event.key == 'g' || event.key == 'G') {
            console.log('G');
            if (canGrab) {
                grab = !grab;
            }
            draw(gl);
        }
    });

    var tick = function() {
        draw(gl);
        requestAnimationFrame(tick);
    };
    tick();
}

function draw(gl){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    transformMat.setIdentity();
    transformMat.scale(sceneScale, sceneScale, 1.0);
    transformMat.translate(robotXMove, robotYMove, 0);

    // head
    initAttributeVariable(gl, program.a_Position, rectangleModelA.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleModelA.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleModelA.numVertices);

    // body
    initAttributeVariable(gl, program.a_Position, rectangleModelB.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleModelB.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleModelA.numVertices);

    // left arm
    transformMat.translate(-0.2, -0.2, 0);
    initAttributeVariable(gl, program.a_Position, rectangleModelC.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleModelC.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleModelC.numVertices);

    // left hand
    transformMat.translate(0, -0.25, 0);
    initAttributeVariable(gl, program.a_Position, triangleModelA.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, triangleModelA.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLES, 0, triangleModelA.numVertices);

    // left leg
    transformMat.translate(0.1, -0.2, 0);
    initAttributeVariable(gl, program.a_Position, rectangleModelC.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleModelC.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleModelC.numVertices);

    // right leg
    transformMat.translate(0.2, 0, 0);
    initAttributeVariable(gl, program.a_Position, rectangleModelC.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleModelC.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleModelC.numVertices);

    // right shoulder joint circle
    transformMat.translate(0.1, 0.55, 0); 
    transformMat.rotate(arm1Angle, 0, 0, 1);
    initAttributeVariable(gl, program.a_Position, circleModelA.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleModelA.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.LINE_LOOP, 0, circleModelA.numVertices);

    // right first arm segment 
    transformMat.translate(0, -0.05, 0);
    transformMat.translate(0.2, circleRadiusA, 0); 
    initAttributeVariable(gl, program.a_Position, rectangleModelD.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleModelD.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleModelD.numVertices);

    // right elbow joint circle 
    transformMat.translate(0.2, 0, 0);
    transformMat.rotate(arm2Angle, 0, 0, 1);
    initAttributeVariable(gl, program.a_Position, circleModelA.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleModelA.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.LINE_LOOP, 0, circleModelA.numVertices);

    // right second arm segment 
    transformMat.translate(0, -0.05, 0); 
    transformMat.translate(0.2, circleRadiusA, 0);
    initAttributeVariable(gl, program.a_Position, rectangleModelD.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleModelD.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleModelD.numVertices);

    // right wrist joint circle
    transformMat.translate(0.2, 0, 0); 
    transformMat.rotate(handAngle, 0, 0, 1);
    initAttributeVariable(gl, program.a_Position, circleModelA.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleModelA.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.LINE_LOOP, 0, circleModelA.numVertices);

    // right hand
    transformMat.translate(0, -0.15, 0); 
    transformMat.translate(0, circleRadiusA, 0);
    initAttributeVariable(gl, program.a_Position, triangleModelB.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, triangleModelB.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLES, 0, triangleModelB.numVertices);

    const handCornerWorld = transformMat.multiplyVector4(new Vector4(triangleVerticesB.slice(3, 6).concat(1)));
    transformMat = new Matrix4(transformMatObject)
    const objectCenterWorld = transformMat.multiplyVector4(new Vector4([0, 0, 0, 1]));

    const dx = handCornerWorld.elements[0] - objectCenterWorld.elements[0];
    const dy = handCornerWorld.elements[1] - objectCenterWorld.elements[1];
    const distanceSquared = dx * dx + dy * dy;
    const radiusSquared = circleRadiusB * circleRadiusB;
    canGrab = distanceSquared <= radiusSquared;

    transformMat.scale(sceneScale, sceneScale, 1.0);

    // first object circle (grab)
    if (grab) {
        transformMatObject.setTranslate(handCornerWorld.elements[0], handCornerWorld.elements[1], 0);
        initAttributeVariable(gl, program.a_Position, circleModelGrab.vertexBuffer);
        initAttributeVariable(gl, program.a_Color, circleModelGrab.colorBuffer);
    } else if (canGrab) {
        initAttributeVariable(gl, program.a_Position, circleModelTouch.vertexBuffer);
        initAttributeVariable(gl, program.a_Color, circleModelTouch.colorBuffer);
    } else {
        initAttributeVariable(gl, program.a_Position, circleModelB.vertexBuffer);
        initAttributeVariable(gl, program.a_Color, circleModelB.colorBuffer);
    }
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.LINE_LOOP, 0, circleModelB.numVertices);

    // first object triangle
    transformMat.translate(0, circleRadiusB, 0);
    initAttributeVariable(gl, program.a_Position, triangleModelA.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, triangleModelA.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLES, 0, triangleModelA.numVertices);

    transformMat.set(transformMatObject);
    transformMat.scale(sceneScale, sceneScale, 1.0);
    transformMat.rotate(object1Angle, 0, 0, 1);

    // object middle
    transformMat.translate(0.2, 0, 0);
    initAttributeVariable(gl, program.a_Position, rectangleModelD.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, rectangleModelD.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, rectangleModelD.numVertices);

    // second object circle
    transformMat.translate(0.2, 0, 0);
    transformMat.rotate(object2Angle, 0, 0, 1);
    initAttributeVariable(gl, program.a_Position, circleModelB.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, circleModelB.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.LINE_LOOP, 0, circleModelB.numVertices);

    // second object triangle
    transformMat.translate(0, circleRadiusB, 0);
    initAttributeVariable(gl, program.a_Position, triangleModelA.vertexBuffer);
    initAttributeVariable(gl, program.a_Color, triangleModelA.colorBuffer);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLES, 0, triangleModelA.numVertices);

    updateTextOverlay();
}