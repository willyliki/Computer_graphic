var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform vec3 u_Color;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        // let ambient and diffuse color are u_Color 
        // (you can also input them from ouside and make them different)
        vec3 ambientLightColor = u_Color;
        vec3 diffuseLightColor = u_Color;
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;

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

function initVertexBufferForLaterUse(gl, vertices, normals, texCoords){
  var nVertices = vertices.length / 3;

  var o = new Object();
  o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
  if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
  if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);

  o.numVertices = nVertices;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

function getNormalOnVertices(vertices){
  var normals = [];
  var nTriangles = vertices.length/9;
  for(let i=0; i < nTriangles; i ++ ){
      var idx = i * 9 + 0 * 3;
      var p0x = vertices[idx+0], p0y = vertices[idx+1], p0z = vertices[idx+2];
      idx = i * 9 + 1 * 3;
      var p1x = vertices[idx+0], p1y = vertices[idx+1], p1z = vertices[idx+2];
      idx = i * 9 + 2 * 3;
      var p2x = vertices[idx+0], p2y = vertices[idx+1], p2z = vertices[idx+2];

      var ux = p1x - p0x, uy = p1y - p0y, uz = p1z - p0z;
      var vx = p2x - p0x, vy = p2y - p0y, vz = p2z - p0z;

      var nx = uy*vz - uz*vy;
      var ny = uz*vx - ux*vz;
      var nz = ux*vy - uy*vx;

      var norm = Math.sqrt(nx*nx + ny*ny + nz*nz);
      nx = nx / norm;
      ny = ny / norm;
      nz = nz / norm;

      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  }
  return normals;
}

var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var mvpMatrix;
var modelMatrix;
var normalMatrix;
var nVertex;
var dino = [];
var joint = [];
var arm = [];
var hand = [];
var cube = [];
var XmoveDistance = 0;
var ZmoveDistance = 0;
var cameraX = 0, cameraY = 4, cameraZ = 12;
var rotateAngle = 0;
var sceneScale = 1;
var grab = false;
var canGrab = false;
var jointchoice = 0;
var arm1Angle = 0;
var arm2Angle = 90;
var handAngle = 0;
var object1Angle = 0;
var object2Angle = 0;

var transformMatObject = new Matrix4();
var objectPosition = new Vector3([2.0, 0.15, 2.0]); // 初始位置
//transformMatObject.scale(sceneScale, sceneScale, sceneScale);
transformMatObject.setIdentity();
//transformMatObject.translate(5.0, 0.5, 5.0); // 初始位置
transformMatObject.translate(objectPosition.elements[0], objectPosition.elements[1], objectPosition.elements[2]);

async function main(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, 'a_Position'); 
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal'); 
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix'); 
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix'); 
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka'); 
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_Color = gl.getUniformLocation(program, 'u_Color'); 

    // 3D model dino
    response = await fetch('dino.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for(let i = 0; i < obj.geometries.length; i++){
      let o = initVertexBufferForLaterUse(gl, 
        obj.geometries[i].data.position,
        obj.geometries[i].data.normal, 
        obj.geometries[i].data.texcoord);
      dino.push(o);
    }

    // 3D model joint1
    response = await fetch('joint.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for(let i = 0; i < obj.geometries.length; i++){
      let o = initVertexBufferForLaterUse(gl, 
        obj.geometries[i].data.position,
        obj.geometries[i].data.normal, 
        obj.geometries[i].data.texcoord);
      joint.push(o);
    }

    // 3D model arm
    response = await fetch('arm.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for(let i = 0; i < obj.geometries.length; i++){
      let o = initVertexBufferForLaterUse(gl, 
        obj.geometries[i].data.position,
        obj.geometries[i].data.normal, 
        obj.geometries[i].data.texcoord);
      arm.push(o);
    }

    // 3D model hand
    response = await fetch('hand.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for(let i = 0; i < obj.geometries.length; i++){
      let o = initVertexBufferForLaterUse(gl, 
        obj.geometries[i].data.position,
        obj.geometries[i].data.normal, 
        obj.geometries[i].data.texcoord);
      hand.push(o);
    }

    // 3D model cube
    response = await fetch('cube.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for(let i = 0; i < obj.geometries.length; i++){
      let o = initVertexBufferForLaterUse(gl, 
        obj.geometries[i].data.position,
        obj.geometries[i].data.normal, 
        obj.geometries[i].data.texcoord);
      cube.push(o);
    }

    mvpMatrix = new Matrix4();
    modelMatrix = new Matrix4();
    normalMatrix = new Matrix4();

    gl.enable(gl.DEPTH_TEST);

    draw();

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};

    var slider1 = document.getElementById("Zoom");
    slider1.oninput = function(){
      sceneScale = this.value/50
      draw();
    }

    document.addEventListener('keydown', (event)=> {
      if (event.key == 'a' || event.key == 'A') {
        console.log('A');
        XmoveDistance -= 0.025;
        if (XmoveDistance < -0.47) XmoveDistance = -0.47;
        draw();
    } else if (event.key == 'd' || event.key == 'D') {
        console.log('D');
        XmoveDistance += 0.025;
        if (XmoveDistance > 0.47) XmoveDistance = 0.47;
        draw();
    } else if (event.key == 's' || event.key == 'S') {
        console.log('S');
        ZmoveDistance += 0.025;
        if (ZmoveDistance > 0.47) ZmoveDistance = 0.47;
        draw();
    } else if (event.key == 'w' || event.key == 'W') {
        console.log('W');
        ZmoveDistance -= 0.025;
        if (ZmoveDistance < -0.47) ZmoveDistance = -0.47;
        draw();
    } else if (event.key == '0') {
        console.log('0');
        jointchoice = 0;
    } else if (event.key == '1') {
        console.log('1');
        jointchoice = 1;
    } else if (event.key == '2') {
        console.log('2');
        jointchoice = 2;
    } else if (event.key == '3') {
        console.log('3');
        jointchoice = 3;
    } else if (event.key == '4') {
        console.log('4');
        jointchoice = 4;
    } else if (event.key == '5') {
        console.log('5');
        jointchoice = 5;
    } else if (event.key == 'r' || event.key == 'R') {
        console.log('R');
        if (jointchoice == 0) rotateAngle += 10; 
        else if (jointchoice == 1) arm1Angle += 10;
        else if (jointchoice == 2) arm2Angle += 10;
        else if (jointchoice == 3) handAngle += 10;
        else if (jointchoice == 4) object1Angle += 10;
        else if (jointchoice == 5) object2Angle += 10;
        draw();
    } else if (event.key == 'g' || event.key == 'G') {
        console.log('G');
        if (canGrab) {
            grab = !grab;
        }
        console.log('grab: ', grab);
        draw();
    } 
    });
}

function draw(){
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let mdlMatrix = new Matrix4(); 

    //camera cube
    mdlMatrix.setIdentity();
    mdlMatrix.translate(0, 7, 5);
    mdlMatrix.scale(0.001, 0.01, 0.001);
    mdlMatrix.scale(sceneScale, sceneScale, sceneScale);
    drawOneObject(cube, mdlMatrix, 0.0, 1.0, 1.0);
    
    //Cube (ground)
    mdlMatrix.setIdentity();
    mdlMatrix.scale(0.5, 0.5, 0.5);
    mdlMatrix.scale(sceneScale, sceneScale, sceneScale);
    drawOneObject(cube, mdlMatrix, 1.0, 0.4, 0.4);

    // below is dino and object
    // setting
    mdlMatrix.setIdentity();
    mdlMatrix.scale(sceneScale, sceneScale, sceneScale);
    mdlMatrix.translate(XmoveDistance * 5, 0.0, ZmoveDistance * 5);
    mdlMatrix.rotate(rotateAngle, 0.0, 1.0, 0.0);

    //dino
    mdlMatrix.scale(0.3, 0.3, 0.3);
    mdlMatrix.translate(0, 3, 0);
    drawOneObject(dino, mdlMatrix, 0.6, 0.6, 0.6);

    //joint1 (shoulder)
    mdlMatrix.translate(-0.9, 0.3, 0.0);
    mdlMatrix.rotate(90, 0.0, 0.0, 1.0);
    mdlMatrix.rotate(arm1Angle, 0.0, 1.0, 0.0);
    drawOneObject(joint, mdlMatrix, 0.0, 1.0, 1.0);

    //arm1 (upper)
    mdlMatrix.scale(0.8, 0.8, 0.85);
    mdlMatrix.translate(-1.4, 0.25, 0.0);
    mdlMatrix.rotate(-90, 0.0, 0.0, 1.0);
    drawOneObject(arm, mdlMatrix, 1.0, 1.0, 0.0);

    //joint2 (elbow)
    mdlMatrix.scale(1.25, 1.25, 1.18);
    mdlMatrix.translate(0.1, -1.2, 0.0);
    mdlMatrix.rotate(arm2Angle, 1.0, 0.0, 0.0);
    mdlMatrix.rotate(90, 0.0, 0.0, 1.0);
    drawOneObject(joint, mdlMatrix, 0.0, 1.0, 1.0);

    //arm2 (lower)
    mdlMatrix.scale(0.8, 0.8, 0.85);
    mdlMatrix.translate(-1.4, 0.15, 0.0);
    mdlMatrix.rotate(-90, 0.0, 0.0, 1.0);
    drawOneObject(arm, mdlMatrix, 1.0, 1.0, 0.0);

    //joint3 (wrist)
    mdlMatrix.scale(1.25, 1.25, 1.18);
    mdlMatrix.translate(0.0, -1.2, 0.0);
    mdlMatrix.rotate(90, 0.0, 0.0, 1.0);
    mdlMatrix.rotate(handAngle, 0.0, 1.0, 0.0);
    drawOneObject(joint, mdlMatrix, 0.0, 1.0, 1.0);

    //hand
    mdlMatrix.scale(0.3, 0.3, 0.3);
    mdlMatrix.rotate(-90, 0.0, 0.0, 1.0);
    mdlMatrix.translate(0.0, -2.0, 0.0);
    drawOneObject(hand, mdlMatrix, 1.0, 0.5, 0.0);

    const handCenter = mdlMatrix.multiplyVector4(new Vector4([0, 0, 0, 1]));
    
    mdlMatrix.setIdentity();
    if (grab) {
        mdlMatrix.scale(sceneScale, sceneScale, sceneScale);
        mdlMatrix.translate(handCenter.elements[0], handCenter.elements[1], handCenter.elements[2]);

        objectPosition.elements[0] = (handCenter.elements[0]) / sceneScale;
        objectPosition.elements[1] = (handCenter.elements[1]) / sceneScale;
        objectPosition.elements[2] = (handCenter.elements[2]) / sceneScale;
    } else {
        mdlMatrix.scale(sceneScale, sceneScale, sceneScale);
        mdlMatrix.translate(objectPosition.elements[0], objectPosition.elements[1], objectPosition.elements[2]);
    }
    const joint1Center = mdlMatrix.multiplyVector4(new Vector4([0, 0, 0, 1]));

    let dx = handCenter.elements[0] - joint1Center.elements[0];
    let dy = handCenter.elements[1] - joint1Center.elements[1];
    let dz = handCenter.elements[2] - joint1Center.elements[2];
    let distance = dx * dx + dy * dy + dz * dz;
    const radius = 0.4 * 0.4 * 0.4;
    canGrab = distance <= radius;

    transformMatObject.set(mdlMatrix);

    let joint1ColorR = 1.0;
    let joint1ColorG = 1.0;
    let joint1ColorB = 1.0;
    if (grab) { 
        joint1ColorR = 1.0;
        joint1ColorG = 0.0;
        joint1ColorB = 1.0;
    } else if (canGrab) {
        joint1ColorR = 0.5;
        joint1ColorG = 0.0;
        joint1ColorB = 0.5;
    }
    
    mdlMatrix.scale(0.3, 0.3, 0.3);
    mdlMatrix.rotate(object1Angle, 0.0, 1.0, 0.0);
    drawOneObject(joint, mdlMatrix, joint1ColorR, joint1ColorG, joint1ColorB);

    //object triangle1
    mdlMatrix.scale(0.5, 0.15, 0.5);
    mdlMatrix.translate(-1.5, 0.6, 0.0);
    mdlMatrix.rotate(-90, 0.0, 0.0, 1.0);
    drawOneObject(hand, mdlMatrix, 0.0, 1.0, 0.0)

    //object rectangle
    mdlMatrix.scale(1.0, 2.0, 4.0);
    mdlMatrix.translate(0.0, 0.75, -0.65);
    mdlMatrix.rotate(90, 0.0, 0.0, 1.0);
    drawOneObject(arm, mdlMatrix, 1.0, 1.0, 1.0);

    //object joint2
    mdlMatrix.scale(1.0, 5.0, 0.5);
    mdlMatrix.translate(0.0, 0.0, -1.3);
    mdlMatrix.rotate(object2Angle, 0.0, 1.0, 0.0);
    drawOneObject(joint, mdlMatrix, 1.0, 1.0, 1.0);

    //object triangle2
    mdlMatrix.scale(0.5, 0.3, 0.5);
    mdlMatrix.translate(-1.5, 0.0, 0.0);
    mdlMatrix.rotate(-90, 0.0, 0.0, 1.0);
    drawOneObject(hand, mdlMatrix, 0.0, 1.0, 0.0);

}

function drawOneObject(obj, mdlMatrix, colorR, colorG, colorB){
    modelMatrix.setRotate(angleY, 1, 0, 0);
    modelMatrix.rotate(angleX, 0, 1, 0);
    modelMatrix.multiply(mdlMatrix);
 
    mvpMatrix.setPerspective(30, 1, 1, 100); // x+XmoveDistance*5, z+ZmoveDistance*5(camera move with dino)
    mvpMatrix.lookAt(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 1, 0); // x+XmoveDistance*5, z+ZmoveDistance*5(camera move with dino)
    mvpMatrix.multiply(modelMatrix);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(program.u_LightPosition, 0, 7, 5);
    gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(program.u_Ka, 0.2);
    gl.uniform1f(program.u_Kd, 0.7);
    gl.uniform1f(program.u_Ks, 1.0);
    gl.uniform1f(program.u_shininess, 10.0);
    gl.uniform3f(program.u_Color, colorR, colorG, colorB);

    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);

    for( let i=0; i < obj.length; i ++ ){
      initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
      initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function parseOBJ(text) {
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  let webglVertexData = [
    [], 
    [],  
    [],   
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  function newGeometry() {
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,   
    mtllib(parts, unparsedArgs) {
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword); 
      continue;
    }
    handler(parts, unparsedArgs);
  }

  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
}

function mouseDown(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if( rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
        mouseLastX = x;
        mouseLastY = y;
        mouseDragging = true;
    }
}

function mouseUp(ev){ 
    mouseDragging = false;
}

function mouseMove(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    if( mouseDragging ){
        var factor = 100/canvas.height; 
        var dx = factor * (x - mouseLastX);
        var dy = factor * (y - mouseLastY);

        angleX += dx; 
        angleY += dy;
    }
    mouseLastX = x;
    mouseLastY = y;

    draw();
}
