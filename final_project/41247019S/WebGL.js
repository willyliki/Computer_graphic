var VSHADER_SOURCE_ENVCUBE = `
  attribute vec4 a_Position;
  varying vec4 v_Position;
  void main() {
    v_Position = a_Position;
    gl_Position = a_Position;
  } 
`;

var FSHADER_SOURCE_ENVCUBE = `
  precision mediump float;
  uniform samplerCube u_envCubeMap;
  uniform mat4 u_viewDirectionProjectionInverse;
  varying vec4 v_Position;
  void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_Position;
    gl_FragColor = textureCube(u_envCubeMap, normalize(t.xyz / t.w));
  }
`;

var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_ProjMatrixFromLight;
    uniform mat4 u_MvpMatrixOfLight;
    varying vec4 v_PositionFromLight;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_PositionFromLight = u_MvpMatrixOfLight * a_Position; //for shadow
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform vec3 u_Color;
    uniform float u_shininess;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    uniform sampler2D u_ShadowMap;
    varying vec2 v_TexCoord;
    varying vec4 v_PositionFromLight;
    const float deMachThreshold = 0.005; //0.001 if having high precision depth
    uniform bool u_useTex;          
    uniform sampler2D u_DiffuseTex; 
    void main(){
        vec3 baseColor = u_Color.rgb;
        if(u_useTex){
            vec2 uv = v_PositionInWorld.xz * 0.1;
            baseColor = texture2D(u_DiffuseTex, uv).rgb;
        }

        // (you can also input them from ouside and make them different)
        vec3 ambientLightColor = u_Color.rgb;
        vec3 diffuseLightColor = u_Color.rgb;
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

        //***** shadow
        vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;
        vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);
        /////////******** LOW precision depth implementation ********///////////
        float depth = rgbaDepth.r;
        float visibility = (shadowCoord.z > depth + deMachThreshold) ? 0.3 : 1.0;

        gl_FragColor = vec4( (ambient + diffuse + specular)*visibility, 1.0);
    }
`;

var VSHADER_SOURCE_TEXTURE_ON_CUBE = `
  attribute vec4 a_Position;
  attribute vec4 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_modelMatrix;
  uniform mat4 u_normalMatrix;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
    v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
  } 
`;

var FSHADER_SOURCE_TEXTURE_ON_CUBE = `
  precision mediump float;
  uniform vec3 u_ViewPosition;
  uniform vec3 u_Color;
  uniform samplerCube u_envCubeMap;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  void main() {
    vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
    vec3 normal = normalize(v_Normal);
    vec3 R = reflect(-V, normal);
    gl_FragColor = vec4(0.78 * textureCube(u_envCubeMap, R).rgb + 0.3 * u_Color, 1.0);
  }
`;

var VSHADER_SHADOW_SOURCE = `
      attribute vec4 a_Position;
      uniform mat4 u_MvpMatrix;
      void main(){
          gl_Position = u_MvpMatrix * a_Position;
      }
  `;

var FSHADER_SHADOW_SOURCE = `
      precision mediump float;
      void main(){
        /////////** LOW precision depth implementation **/////
        gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
      }
  `;

var VSHADER_BUMP = `
  attribute vec4 a_Position;
  attribute vec4 a_Normal;
  attribute vec2 a_TexCoord;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_modelMatrix;
  uniform mat4 u_normalMatrix;
  varying vec2 v_Tex;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  void main(){
    gl_Position = u_MvpMatrix * a_Position;
    v_Tex = a_TexCoord;
    v_Normal = mat3(u_normalMatrix) * a_Normal.xyz;
    v_Position = vec3(u_modelMatrix * a_Position);
  }
`;

var FSHADER_BUMP = `
  precision mediump float;
  uniform sampler2D u_Diffuse;
  uniform sampler2D u_NormalMap;
  uniform vec3 u_LightPos;
  uniform vec3 u_ViewPos;
  varying vec2 v_Tex;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  void main(){
    // tangent-space normal (range 0~1 ➜ -1~1)
    vec3 N = texture2D(u_NormalMap, v_Tex).rgb * 2.0 - 1.0;
    N = normalize(N);

    vec3 L = normalize(u_LightPos - v_Position);
    vec3 V = normalize(u_ViewPos - v_Position);
    float diff = max(dot(N, L), 0.0);

    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(R, V), 0.0), 16.0);

    vec3 texColor = texture2D(u_Diffuse, v_Tex).rgb;

    vec3 color = texColor * (0.2 + 0.8 * diff) + vec3(1.0) * spec * 0.3;
    gl_FragColor = vec4(color, 1.0);
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

var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var modelMatrix;
var normalMatrix;
var nVertex;
var cameraX = 0, cameraY = 0, cameraZ = -5;
var cameraDirX = 0, cameraDirY = 0, cameraDirZ = 1;
var lightX = 5, lightY = 1, lightZ = 7;
var cubeObj;
var quadObj;
var marioObj;
var dinoObj;
var pillarObj;
var trophyObj;
var jointObj;
var armObj;
var cubeMapTex;
var rotateAngle = 0;
var fbo;
var offScreenWidth = 256, offScreenHeight = 256; 
let fallTimer     = -1;  
const RESPAWN_Y   = -1;   
const RESPAWN_SEC = 1.0; 

const platforms = [
  // start
  { pos:[ 0.0,  0.0,  0.0], scale:[4.0, 0.05, 4.0], color:[1,1,1] },
  // middle
  { pos:[-1.0, 0.5, -4.0], scale:[1.2, 0.05, 1.2], color:[0.6, 0.8, 1] },
  { pos:[ 1.5, 1.5, -8.0], scale:[1.5, 0.05, 1.5], color:[0.6, 1, 0.6] },
  { pos:[-2.0, 3.5, -8.5], scale:[1.0, 0.05, 1.0], color:[1.0, 1.0, 1.0] },
  { pos:[-6.5, 4.5, -8.0], scale:[1.2, 0.05, 1.2], color:[0.5, 0.6, 0.7] },
  { pos:[-10.0, 5.5, -10.0], scale:[1.0, 0.05, 1.0], color:[0.7, 0.3, 0.7] },
  { pos:[-7.0, 8.0, -7.0], scale:[1.2, 0.05, 1.2], color:[0.4, 0.8, 0.6] },
  { pos:[-4.0, 10.0, -4.0], scale:[0.7, 0.05, 0.7], color:[0.2, 0.9, 0.5] },
  { pos:[-2.5, 12.0, -7.5], scale:[0.7, 0.05, 0.7], color:[0.4, 0.2, 0.7] },
  { pos:[-1.0, 14.0, -10.0], scale:[0.7, 0.05, 0.7], color:[0.6, 0.6, 1.0] },
  // end
  { pos:[ 0.0, 15.0, -12.0], scale:[2.0, 0.05, 2.0], color:[1,0.6,0.6] },
];

let playerPos   = new Vector3([0, 1.0, 0]); 
let playerVel   = new Vector3([0, 0, 0]);
let onGround    = true;
let firstPerson = true;     
var textures = {};
var texCount = 0;
var numTextures = 2; 

function updateTextOverlay() {
    const textOverlay = document.getElementById('textOverlay');
    textOverlay.innerHTML = `
        -------------------------------------------------------------------------------<br>
        Control: <br><br>
        Left: a <br><br>
        Right: d <br><br>
        Forward: w <br><br>
        Backward: s <br><br>
        Jump: space bar <br><br>
        Switch view: t <br><br>
        Rotating view: mouse drag(left button) <br>
        -------------------------------------------------------------------------------<br>
        About the game: <br><br>
        You are the dino, <br>
        all you need to do is to jump to the top to get the trophy. <br>
        -------------------------------------------------------------------------------<br>
        **Remember** <br><br>
        If you want to jump to the other platform, <br>
        press space bar first, then w/a/s/d. <br>
        -------------------------------------------------------------------------------
    `;
}

async function main(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    var quad = new Float32Array(
      [
        -1, -1, 1,
         1, -1, 1,
        -1,  1, 1,
        -1,  1, 1,
         1, -1, 1,
         1,  1, 1
      ]); 

    sphereObj = await loadOBJtoCreateVBO('sphere.obj');
    marioObj = await loadOBJtoCreateVBO('mario.obj');
    cubeObj = await loadOBJtoCreateVBO('cube.obj');
    dinoObj = await loadOBJtoCreateVBO('dino.obj');
    pillarObj = await loadOBJtoCreateVBO('pillar.obj');
    trophyObj = await loadOBJtoCreateVBO('trophy.obj');
    jointObj = await loadOBJtoCreateVBO('joint.obj');
    armObj = await loadOBJtoCreateVBO('arm.obj');

    var imagefloor = new Image();
    imagefloor.onload = function(){initTexture(gl, imagefloor, 'floorTex');};
    imagefloor.src = "floor.jpg";

    var imageBrick = new Image();
    imageBrick.onload = () => initTexture(gl, imageBrick, 'brickDiff');
    imageBrick.src = 'brick_diffuse.jpg';

    var imageBrickN = new Image();
    imageBrickN.onload = () => initTexture(gl, imageBrickN, 'brickNorm');
    imageBrickN.src = 'brick_normal.jpg';

    numTextures = 4;   

    shadowProgram = compileShader(gl, VSHADER_SHADOW_SOURCE, FSHADER_SHADOW_SOURCE);
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');

    programEnvCube = compileShader(gl, VSHADER_SOURCE_ENVCUBE, FSHADER_SOURCE_ENVCUBE);
    programEnvCube.a_Position = gl.getAttribLocation(programEnvCube, 'a_Position'); 
    programEnvCube.u_envCubeMap = gl.getUniformLocation(programEnvCube, 'u_envCubeMap'); 
    programEnvCube.u_viewDirectionProjectionInverse = 
               gl.getUniformLocation(programEnvCube, 'u_viewDirectionProjectionInverse'); 

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
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
    program.u_Color = gl.getUniformLocation(program, 'u_Color');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_ShadowMap = gl.getUniformLocation(program, "u_ShadowMap");

    programTextureOnCube = compileShader(gl, VSHADER_SOURCE_TEXTURE_ON_CUBE, FSHADER_SOURCE_TEXTURE_ON_CUBE);
    programTextureOnCube.a_Position = gl.getAttribLocation(programTextureOnCube, 'a_Position'); 
    programTextureOnCube.a_Normal = gl.getAttribLocation(programTextureOnCube, 'a_Normal'); 
    programTextureOnCube.u_MvpMatrix = gl.getUniformLocation(programTextureOnCube, 'u_MvpMatrix'); 
    programTextureOnCube.u_modelMatrix = gl.getUniformLocation(programTextureOnCube, 'u_modelMatrix'); 
    programTextureOnCube.u_normalMatrix = gl.getUniformLocation(programTextureOnCube, 'u_normalMatrix');
    programTextureOnCube.u_ViewPosition = gl.getUniformLocation(programTextureOnCube, 'u_ViewPosition');
    programTextureOnCube.u_envCubeMap = gl.getUniformLocation(programTextureOnCube, 'u_envCubeMap'); 
    programTextureOnCube.u_Color = gl.getUniformLocation(programTextureOnCube, 'u_Color'); 

    programBump = compileShader(gl, VSHADER_BUMP, FSHADER_BUMP);
    programBump.a_Position   = gl.getAttribLocation(programBump, 'a_Position');
    programBump.a_Normal     = gl.getAttribLocation(programBump, 'a_Normal');
    programBump.a_TexCoord   = gl.getAttribLocation(programBump, 'a_TexCoord');
    programBump.u_MvpMatrix  = gl.getUniformLocation(programBump, 'u_MvpMatrix');
    programBump.u_modelMatrix= gl.getUniformLocation(programBump, 'u_modelMatrix');
    programBump.u_normalMatrix=gl.getUniformLocation(programBump,'u_normalMatrix');
    programBump.u_Diffuse    = gl.getUniformLocation(programBump, 'u_Diffuse');
    programBump.u_NormalMap  = gl.getUniformLocation(programBump, 'u_NormalMap');
    programBump.u_LightPos   = gl.getUniformLocation(programBump, 'u_LightPos');
    programBump.u_ViewPos    = gl.getUniformLocation(programBump, 'u_ViewPos');

    quadObj = initVertexBufferForLaterUse(gl, quad);

    cubeMapTex = initCubeTexture("posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", 
                                      "posz.jpg", "negz.jpg", 512, 512)

    fbo = initFrameBufferForCubemapRendering(gl);

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};
    document.onkeydown = function(ev){keydown(ev)};

    var tick = function() {
      rotateAngle += 1;
      updatePhysics();      
      draw();
      requestAnimationFrame(tick);
    }
    tick();
}

function draw(){
  renderCubeMap(0, 0, 0);

  ///// off scree shadow
  gl.useProgram(shadowProgram);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, offScreenWidth, offScreenHeight);
  gl.clearColor(1.0, 1.0, 1.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  let lightVP = new Matrix4();
  lightVP.setPerspective(70, offScreenWidth/offScreenHeight, 1, 100);
  lightVP.lookAt(lightX, lightY, lightZ, 0, 0, 0, 0, 1, 0);

  drawRegularObjects(lightVP, true);   

  ///// on scree rendering
  //gl.useProgram(program);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.4, 0.4, 0.4, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  
  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);

  var vpFromCamera = new Matrix4();
  vpFromCamera.setPerspective(60, 1, 1, 15);
  var viewMatrixRotationOnly = new Matrix4();
  viewMatrixRotationOnly.lookAt(cameraX, cameraY, cameraZ, 
                                cameraX + newViewDir.elements[0], 
                                cameraY + newViewDir.elements[1], 
                                cameraZ + newViewDir.elements[2], 
                                0, 1, 0);
  viewMatrixRotationOnly.elements[12] = 0; //ignore translation
  viewMatrixRotationOnly.elements[13] = 0;
  viewMatrixRotationOnly.elements[14] = 0;
  vpFromCamera.multiply(viewMatrixRotationOnly);
  var vpFromCameraInverse = vpFromCamera.invert();

  
  let vpMatrix = new Matrix4();
  vpMatrix.setPerspective(70, 1, 1, 100);
  vpMatrix.lookAt(cameraX, cameraY, cameraZ,   
                  cameraX + newViewDir.elements[0], 
                  cameraY + newViewDir.elements[1],
                  cameraZ + newViewDir.elements[2], 
                  0, 1, 0);
  
  let camPos, camTarget;
  if(firstPerson){
    camPos    = new Vector3([
      playerPos.elements[0] + 0,
      playerPos.elements[1] + 0.4,
      playerPos.elements[2] + 0
    ]); 
    camTarget = new Vector3([
      camPos.elements[0] + newViewDir.elements[0],
      camPos.elements[1] + newViewDir.elements[1],
      camPos.elements[2] + newViewDir.elements[2]
    ]); 
  }
  else{// third person
    const backDist = 4.0;    
    const upDist   = 2.0;    

    camTarget = new Vector3([
      playerPos.elements[0],
      playerPos.elements[1] + 0.4,
      playerPos.elements[2]
    ]);

    camPos = new Vector3([
      camTarget.elements[0] - newViewDir.elements[0] * backDist,
      camTarget.elements[1] + upDist,
      camTarget.elements[2] - newViewDir.elements[2] * backDist
    ]);
  }

  vpMatrix = new Matrix4();
  vpMatrix.setPerspective(70, 1, 0.1, 100);
  vpMatrix.lookAt(
    camPos.elements[0], camPos.elements[1], camPos.elements[2],
    camTarget.elements[0], camTarget.elements[1], camTarget.elements[2],
    0,1,0
  );

  cameraX = camPos.elements[0];
  cameraY = camPos.elements[1];
  cameraZ = camPos.elements[2];


  drawRegularObjects(vpMatrix);// objects

  //quad
  gl.useProgram(programEnvCube);
  gl.depthFunc(gl.LEQUAL);
  gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, 
                      false, vpFromCameraInverse.elements);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
  gl.uniform1i(programEnvCube.u_envCubeMap, 0);
  initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
  gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);

  // right sphere
  let mdlMatrix = new Matrix4();
  mdlMatrix.setTranslate(3.5, 4.5, -3.0);
  mdlMatrix.scale(0.5, 0.5, 0.5);
  drawObjectWithDynamicReflection(sphereObj, mdlMatrix, vpMatrix, 1.0, 1.0, 1.0);

  // left sphere
  mdlMatrix = new Matrix4();
  mdlMatrix.setTranslate(-3.5, 4.5, -3.0);
  mdlMatrix.scale(0.5, 0.5, 0.5);
  drawObjectWithDynamicReflection(sphereObj, mdlMatrix, vpMatrix, 1.0, 1.0, 1.0);

  updateTextOverlay();
}

function drawRegularObjects(vpMatrix, forceShowDino=false){
  let mdlMatrix = new Matrix4();

  // right rotate cube
  mdlMatrix.setTranslate(3.5, 5.0, -3.0);
  mdlMatrix.rotate(rotateAngle, 0, 1, 0);
  mdlMatrix.translate(2.0, 0.0, 0.0);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  drawOneRegularObject(cubeObj, mdlMatrix, vpMatrix, 0.0, 0.0, 0.0);

  mdlMatrix.setTranslate(3.5, 5.0, -3.0);
  mdlMatrix.rotate(rotateAngle, 0, 1, 0);
  mdlMatrix.translate(-2.0, 0.0, 0.0);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  drawOneRegularObject(cubeObj, mdlMatrix, vpMatrix, 0.0, 0.0, 0.0);

  mdlMatrix.setTranslate(3.5, 5.0, -3.0);
  mdlMatrix.rotate(rotateAngle, 1, 0, 0);
  mdlMatrix.translate(0.0, 2.0, 0.0);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  drawOneRegularObject(cubeObj, mdlMatrix, vpMatrix, 0.0, 0.0, 0.0);

  mdlMatrix.setTranslate(3.5, 5.0, -3.0);
  mdlMatrix.rotate(rotateAngle, 1, 0, 0);
  mdlMatrix.translate(0.0, -2.0, 0.0);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  drawOneRegularObject(cubeObj, mdlMatrix, vpMatrix, 0.0, 0.0, 0.0);

  // left rotate cube
  mdlMatrix.setTranslate(-3.5, 5.0, -3.0);
  mdlMatrix.rotate(-rotateAngle, 0, 1, 0);
  mdlMatrix.translate(2.0, 0.0, 0.0);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  drawOneRegularObject(cubeObj, mdlMatrix, vpMatrix, 0.0, 0.0, 0.0);

  mdlMatrix.setTranslate(-3.5, 5.0, -3.0);
  mdlMatrix.rotate(-rotateAngle, 0, 1, 0);
  mdlMatrix.translate(-2.0, 0.0, 0.0);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  drawOneRegularObject(cubeObj, mdlMatrix, vpMatrix, 0.0, 0.0, 0.0);

  mdlMatrix.setTranslate(-3.5, 5.0, -3.0);
  mdlMatrix.rotate(rotateAngle, 1, 0, 0);
  mdlMatrix.translate(0.0, 2.0, 0.0);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  drawOneRegularObject(cubeObj, mdlMatrix, vpMatrix, 0.0, 0.0, 0.0);

  mdlMatrix.setTranslate(-3.5, 5.0, -3.0);
  mdlMatrix.rotate(rotateAngle, 1, 0, 0);
  mdlMatrix.translate(0.0, -2.0, 0.0);
  mdlMatrix.scale(0.1, 0.1, 0.1);
  drawOneRegularObject(cubeObj, mdlMatrix, vpMatrix, 0.0, 0.0, 0.0);

  // right pillar
  for(let i = 0; i < 5; i++){
    mdlMatrix.setTranslate(3.5, 1.5, -3.0+1.5*i);
    mdlMatrix.scale(0.5, 0.5, 0.5);
    drawOneRegularObject(pillarObj, mdlMatrix, vpMatrix, 1.0, 1.0, 1.0);
  }
  // back pillar
  for(let i = 0; i < 5; i++){
    mdlMatrix.setTranslate(3.5-1.5*i, 1.5, -3.0+1.5*4);
    mdlMatrix.scale(0.5, 0.5, 0.5);
    drawOneRegularObject(pillarObj, mdlMatrix, vpMatrix, 1.0, 1.0, 1.0);
  }
  // left pillar
  for(let i = 0; i < 5; i++){
    mdlMatrix.setTranslate(-3.5, 1.5, -3.0+1.5*i);
    mdlMatrix.scale(0.5, 0.5, 0.5);
    drawOneRegularObject(pillarObj, mdlMatrix, vpMatrix, 1.0, 1.0, 1.0);
  }
  mdlMatrix.setTranslate(3.5, 1.5, -3.0);
  mdlMatrix.scale(0.5, 0.5, 0.5);
  drawOneRegularObject(pillarObj, mdlMatrix, vpMatrix, 1.0, 1.0, 1.0);

  mdlMatrix.setTranslate(0.0, 17.0, -12.0);
  mdlMatrix.rotate(rotateAngle, 0.0, 1.0, 0.0);
  mdlMatrix.scale(0.5, 0.5, 0.5);
  drawObjectWithDynamicReflection(trophyObj, mdlMatrix, vpMatrix, 1.0, 1.0, 0.0);

  // dino
  if(!firstPerson || forceShowDino){ 
    mdlMatrix.setTranslate(
        playerPos.elements[0],
        playerPos.elements[1],
        playerPos.elements[2]);

    mdlMatrix.rotate(angleX, 0, 1, 0);
    mdlMatrix.scale(0.2, 0.2, 0.2);
    drawOneRegularObject(dinoObj, mdlMatrix, vpMatrix, 0.4, 0.4, 0.4);
    mdlMatrix.translate(-1.0, -0.3, 0.0);
    mdlMatrix.scale(0.8, 0.8, 0.8);
    drawOneRegularObject(armObj, mdlMatrix, vpMatrix, 0.4, 0.4, 0.4);
    
  }
  
  // plateform
  platforms.forEach(plat=>{
    let mdlMatrix = new Matrix4();
    mdlMatrix.setTranslate(...plat.pos);
    mdlMatrix.scale(...plat.scale);
    drawOneRegularObject(
        cubeObj,
        mdlMatrix,
        vpMatrix,
        plat.color[0], plat.color[1], plat.color[2]
    );
  });

  // Bump-mapped Cube
  mdlMatrix.setIdentity();
  mdlMatrix.setTranslate(0.0, 15.0, -12.0); 
  mdlMatrix.scale(1.2, 1.2, 1.2);

  gl.useProgram(programBump);

  let mvp = new Matrix4(vpMatrix);
  mvp.multiply(mdlMatrix);

  let nmat = new Matrix4();
  nmat.setInverseOf(mdlMatrix);
  nmat.transpose();

  gl.uniformMatrix4fv(programBump.u_MvpMatrix,  false, mvp.elements);
  gl.uniformMatrix4fv(programBump.u_modelMatrix,false, mdlMatrix.elements);
  gl.uniformMatrix4fv(programBump.u_normalMatrix,false, nmat.elements);
  gl.uniform3f(programBump.u_LightPos, lightX, lightY, lightZ);
  gl.uniform3f(programBump.u_ViewPos,  cameraX, cameraY, cameraZ);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures['brickDiff']);
  gl.uniform1i(programBump.u_Diffuse, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures['brickNorm']);
  gl.uniform1i(programBump.u_NormalMap, 1);

  for(let i=0;i<cubeObj.length;i++){
    initAttributeVariable(gl, programBump.a_Position, cubeObj[i].vertexBuffer);
    initAttributeVariable(gl, programBump.a_Normal,   cubeObj[i].normalBuffer);
    initAttributeVariable(gl, programBump.a_TexCoord, cubeObj[i].texCoordBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, cubeObj[i].numVertices);
  }

}

function drawOffScreen(obj, mdlMatrix){
  var mvpFromLight = new Matrix4();
  //model Matrix (part of the mvp matrix)
  let modelMatrix = new Matrix4();
  modelMatrix.setRotate(angleY, 1, 0, 0);
  modelMatrix.rotate(angleX, 0, 1, 0);
  modelMatrix.multiply(mdlMatrix);
  //mvp: projection * view * model matrix  
  mvpFromLight.setPerspective(70, offScreenWidth/offScreenHeight, 1, 15);
  mvpFromLight.lookAt(lightX, lightY, lightZ, 0, 0, 0, 0, 1, 0);
  mvpFromLight.multiply(modelMatrix);

  gl.uniformMatrix4fv(shadowProgram.u_MvpMatrix, false, mvpFromLight.elements);

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, shadowProgram.a_Position, obj[i].vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }

  return mvpFromLight;
}

//obj: the object components
//mdlMatrix: the model matrix without mouse rotation
//colorR, G, B: object color
function drawOneObjectOnScreen(obj, mdlMatrix, mvpFromLight, colorR, colorG, colorB){
  var mvpFromCamera = new Matrix4();
  //model Matrix (part of the mvp matrix)
  let modelMatrix = new Matrix4();
  modelMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  modelMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  modelMatrix.multiply(mdlMatrix);
  //mvp: projection * view * model matrix  
  mvpFromCamera.setPerspective(60, 1, 1, 15);
  mvpFromCamera.lookAt(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 1, 0);
  mvpFromCamera.multiply(modelMatrix);

  //normal matrix
  let normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(program.u_LightPosition, lightX, lightY, lightZ);
  gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1f(program.u_Ka, 0.2);
  gl.uniform1f(program.u_Kd, 0.7);
  gl.uniform1f(program.u_Ks, 1.0);
  gl.uniform1f(program.u_shininess, 10.0);
  gl.uniform1i(program.u_ShadowMap, 0);
  gl.uniform3f(program.u_Color, colorR, colorG, colorB);

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpFromCamera.elements);
  gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(program.u_MvpMatrixOfLight, false, mvpFromLight.elements);

  gl.activeTexture(gl.TEXTURE0);   
  gl.bindTexture(gl.TEXTURE_2D, fbo.texture); 

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }
}

function drawOneRegularObject(obj, modelMatrix, vpMatrix, colorR, colorG, colorB){
  gl.useProgram(program);
  let mvpMatrix = new Matrix4();
  let normalMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(modelMatrix);

  //normal matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(program.u_LightPosition, lightX, lightY, lightZ);
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


function drawOneRegularObject_floor(obj, modelMatrix, vpMatrix, colorR, colorG, colorB){
  gl.useProgram(program);
  let mvpMatrix = new Matrix4();
  let normalMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(modelMatrix);

  //normal matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(program.u_LightPosition, lightX, lightY, lightZ);
  gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1f(program.u_Ka, 0.2);
  gl.uniform1f(program.u_Kd, 0.7);
  gl.uniform1f(program.u_Ks, 1.0);
  gl.uniform1f(program.u_shininess, 10.0);
  gl.uniform3f(program.u_Color, colorR, colorG, colorB);
  gl.uniform1i(program.u_useTex, true);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures['floorTex']);
  gl.uniform1i(program.u_DiffuseTex, 1);

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
    initAttributeVariable(gl, program.a_TexCoord, obj[i].texCoordBuffer);
    initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }
}


function drawObjectWithDynamicReflection(obj, modelMatrix, vpMatrix, colorR, colorG, colorB){
  gl.useProgram(programTextureOnCube);
  let mvpMatrix = new Matrix4();
  let normalMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix);
  mvpMatrix.multiply(modelMatrix);

  //normal matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(programTextureOnCube.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform3f(programTextureOnCube.u_Color, colorR, colorG, colorB);

  gl.uniformMatrix4fv(programTextureOnCube.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(programTextureOnCube.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(programTextureOnCube.u_normalMatrix, false, normalMatrix.elements);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, fbo.texture);
  gl.uniform1i(programTextureOnCube.u_envCubeMap, 0);

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, programTextureOnCube.a_Position, obj[i].vertexBuffer);
    initAttributeVariable(gl, programTextureOnCube.a_Normal, obj[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }
}

async function loadOBJtoCreateVBO( objFile ){
  let objComponents = [];
  response = await fetch(objFile);
  text = await response.text();
  obj = parseOBJ(text);
  for( let i=0; i < obj.geometries.length; i ++ ){
    let o = initVertexBufferForLaterUse(gl, 
                                        obj.geometries[i].data.position,
                                        obj.geometries[i].data.normal, 
                                        obj.geometries[i].data.texcoord);
    objComponents.push(o);
  }
  return objComponents;
}

function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
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
      // should check for missing v and extra w?
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
    s: noop,    // smoothing group
    mtllib(parts, unparsedArgs) {
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
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
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // remove any arrays that have no entries.
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
        var factor = 100/canvas.height; //100 determine the spped you rotate the object
        var dx = factor * (x - mouseLastX);
        var dy = factor * (y - mouseLastY);

        angleX += dx; //yes, x for y, y for x, this is right
        angleY += dy;
    }
    mouseLastX = x;
    mouseLastY = y;

    draw();
}

function initCubeTexture(posXName, negXName, posYName, negYName, 
                         posZName, negZName, imgWidth, imgHeight)
{
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      fName: posXName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      fName: negXName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      fName: posYName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      fName: negYName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      fName: posZName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      fName: negZName,
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const {target, fName} = faceInfo;
    // setup each face so it's immediately renderable
    gl.texImage2D(target, 0, gl.RGBA, imgWidth, imgHeight, 0, 
                  gl.RGBA, gl.UNSIGNED_BYTE, null);

    var image = new Image();
    image.onload = function(){
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);   // ← 保證 cubemap 永遠不翻 Y
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    };
    image.src = fName;
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  return texture;
}

function keydown(ev){ 
  //implment keydown event here
  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);

  const speed = 0.1;

  let fwd = new Vector3([ newViewDir.elements[0], 0, newViewDir.elements[2] ]);
  fwd.normalize();
  let right = new Vector3([ fwd.elements[2], 0, -fwd.elements[0] ]);
  right.normalize();

  // speed = 0
  playerVel.elements[0] = 0;
  playerVel.elements[2] = 0;

  if(ev.key == 'w'){ 
      playerVel.elements[0] +=  fwd.elements[0] * speed;
      playerVel.elements[2] +=  fwd.elements[2] * speed;
  }
  else if(ev.key == 's'){ 
    playerVel.elements[0] += -fwd.elements[0] * speed;
    playerVel.elements[2] += -fwd.elements[2] * speed;
  }
  else if(ev.key == 'a'){
    playerVel.elements[0] += right.elements[0] * speed;
    playerVel.elements[2] += right.elements[2] * speed;
  }
  else if(ev.key == 'd'){
    playerVel.elements[0] +=  -right.elements[0] * speed;
    playerVel.elements[2] +=  -right.elements[2] * speed;
  }
  else if(ev.key===' ' && onGround){// jump
    playerVel.elements[1] = 0.5;
    onGround = false;
  }
  else if(ev.key==='t'){// switch view 
    firstPerson = !firstPerson; 
  }

  console.log(cameraX, cameraY, cameraZ)
  draw();
}

function updatePhysics(){
  // gravity
  if(!onGround){
    playerVel.elements[1] -= 0.02;
  }
  // move
  playerPos.elements[0] += playerVel.elements[0];
  playerPos.elements[1] += playerVel.elements[1];
  playerPos.elements[2] += playerVel.elements[2];

  // fall on ground
  onGround = false;
  const radiusXZ = 0.25;
  platforms.forEach(plat=>{
    const [px, py, pz]   = plat.pos;          // plat center
    const [sx, sy, sz]   = plat.scale;        // half length
    const topY = py + sy; 
    const dinoFoot = 0.5;

    const insideX = Math.abs(playerPos.elements[0] - px) < (sx - radiusXZ);
    const insideZ = Math.abs(playerPos.elements[2] - pz) < (sz - radiusXZ);

    const fallingOn =  playerVel.elements[1] <= 0.0 &&
                       playerPos.elements[1] >= topY - 0.3 &&
                       playerPos.elements[1] <= topY + 0.5;

    if(insideX && insideZ && fallingOn){
      playerPos.elements[1] = topY + dinoFoot;
      playerVel.elements[1] = 0;
      onGround = true;
    }
  });

  // slowly stop
  if(onGround){
    playerVel.elements[0] *= 0.7;
    playerVel.elements[2] *= 0.7;
  }

  // falling count
  if(fallTimer >= 0){
      fallTimer -= 1/60;               
      if(fallTimer <= 0){
          respawnPlayer();
      }
  }else if(playerPos.elements[1] < RESPAWN_Y){
      fallTimer = RESPAWN_SEC;          
  }
}

function respawnPlayer(){
    const start = platforms[0]; 
    const topY  = start.pos[1] + start.scale[1];
    const dinoFoot = 0.5;
    playerPos.set([ start.pos[0], topY + dinoFoot, start.pos[2] ]);      
    playerVel.set([0, 0, 0]); 
    onGround  = true; 
    fallTimer = -1;                  
}

function initFrameBufferForCubemapRendering(gl){
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  // 6 2D textures
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  for (let i = 0; i < 6; i++) {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, 
                  gl.RGBA, offScreenWidth, offScreenHeight, 0, gl.RGBA, 
                  gl.UNSIGNED_BYTE, null);
  }

  //create and setup a render buffer as the depth buffer
  var depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
                          offScreenWidth, offScreenHeight);

  //create and setup framebuffer: linke the depth buffer to it (no color buffer here)
  var frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
                              gl.RENDERBUFFER, depthBuffer);

  frameBuffer.texture = texture;

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return frameBuffer;
}

function renderCubeMap(camX, camY, camZ)
{
  //camera 6 direction to render 6 cubemap faces
  var ENV_CUBE_LOOK_DIR = [
      [1.0, 0.0, 0.0],
      [-1.0, 0.0, 0.0],
      [0.0, 1.0, 0.0],
      [0.0, -1.0, 0.0],
      [0.0, 0.0, 1.0],
      [0.0, 0.0, -1.0]
  ];

  //camera 6 look up vector to render 6 cubemap faces
  var ENV_CUBE_LOOK_UP = [
      [0.0, -1.0, 0.0],
      [0.0, -1.0, 0.0],
      [0.0, 0.0, 1.0],
      [0.0, 0.0, -1.0],
      [0.0, -1.0, 0.0],
      [0.0, -1.0, 0.0]
  ];

  gl.useProgram(program);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, offScreenWidth, offScreenHeight);
  gl.clearColor(0.4, 0.4, 0.4,1);
  for (var side = 0; side < 6;side++){
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                            gl.TEXTURE_CUBE_MAP_POSITIVE_X+side, fbo.texture, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let vpMatrix = new Matrix4();
    vpMatrix.setPerspective(90, 1, 1, 100);
    vpMatrix.lookAt(camX, camY, camZ,   
                    camX + ENV_CUBE_LOOK_DIR[side][0], 
                    camY + ENV_CUBE_LOOK_DIR[side][1],
                    camZ + ENV_CUBE_LOOK_DIR[side][2], 
                    ENV_CUBE_LOOK_UP[side][0],
                    ENV_CUBE_LOOK_UP[side][1],
                    ENV_CUBE_LOOK_UP[side][2]);
  
    drawRegularObjects(vpMatrix, true);

    gl.depthFunc(gl.LEQUAL);                 
    gl.useProgram(programEnvCube);

    let vpInv = new Matrix4();
    vpInv.set(vpMatrix);
    vpInv.invert();
    gl.uniformMatrix4fv(
        programEnvCube.u_viewDirectionProjectionInverse,
        false,
        vpInv.elements
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex); 
    gl.uniform1i(programEnvCube.u_envCubeMap, 0);

    initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function initFrameBuffer(gl){
  //create and set up a texture object as the color buffer
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, offScreenWidth, offScreenHeight,
                  0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  

  //create and setup a render buffer as the depth buffer
  var depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
                          offScreenWidth, offScreenHeight);

  //create and setup framebuffer: linke the color and depth buffer to it
  var frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                            gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
                              gl.RENDERBUFFER, depthBuffer);
  frameBuffer.texture = texture;
  return frameBuffer;
}

function initTexture(gl, img, texKey){
  var tex = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.bindTexture(gl.TEXTURE_2D, tex);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  
  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);   // ← 用完立刻設回 0

  textures[texKey] = tex;

  texCount++;
  if( texCount == numTextures)draw();
}

function calculateTangentSpace(position, texcoord){
  //iterate through all triangles
  let tagents = [];
  let bitagents = [];
  for( let i = 0; i < position.length/9; i++ ){
    let v00 = position[i*9 + 0];
    let v01 = position[i*9 + 1];
    let v02 = position[i*9 + 2];
    let v10 = position[i*9 + 3];
    let v11 = position[i*9 + 4];
    let v12 = position[i*9 + 5];
    let v20 = position[i*9 + 6];
    let v21 = position[i*9 + 7];
    let v22 = position[i*9 + 8];
    let uv00 = texcoord[i*6 + 0];
    let uv01 = texcoord[i*6 + 1];
    let uv10 = texcoord[i*6 + 2];
    let uv11 = texcoord[i*6 + 3];
    let uv20 = texcoord[i*6 + 4];
    let uv21 = texcoord[i*6 + 5];

    let deltaPos10 = v10 - v00;
    let deltaPos11 = v11 - v01;
    let deltaPos12 = v12 - v02;
    let deltaPos20 = v20 - v00;
    let deltaPos21 = v21 - v01;
    let deltaPos22 = v22 - v02;

    let deltaUV10 = uv10 - uv00;
    let deltaUV11 = uv11 - uv01;
    let deltaUV20 = uv20 - uv00;
    let deltaUV21 = uv21 - uv01;

    let r = 1.0 / (deltaUV10 * deltaUV21 - deltaUV11 * deltaUV20);
    let tangentX = (deltaPos10 * deltaUV21   - deltaPos20 * deltaUV11)*r;
    let tangentY = (deltaPos11 * deltaUV21   - deltaPos21 * deltaUV11)*r;
    let tangentZ = (deltaPos12 * deltaUV21   - deltaPos22 * deltaUV11)*r;
    for( let j = 0; j < 3; j++ ){
      tagents.push(tangentX);
      tagents.push(tangentY);
      tagents.push(tangentZ);
    }
    let bitangentX = (deltaPos20 * deltaUV10   - deltaPos10 * deltaUV20)*r;
    let bitangentY = (deltaPos21 * deltaUV10   - deltaPos11 * deltaUV20)*r;
    let bitangentZ = (deltaPos22 * deltaUV10   - deltaPos12 * deltaUV20)*r;
    for( let j = 0; j < 3; j++ ){
      bitagents.push(bitangentX);
      bitagents.push(bitangentY);
      bitagents.push(bitangentZ);
    }
  }
  let obj = {};
  obj['tagents'] = tagents;
  obj['bitagents'] = bitagents;
  return obj;
}

async function loadOBJtoCreateVBO( objFile ){
  let objComponents = [];
  response = await fetch(objFile);
  text = await response.text();
  obj = parseOBJ(text);
  for( let i=0; i < obj.geometries.length; i ++ ){
    let tagentSpace = calculateTangentSpace(obj.geometries[i].data.position, 
                                            obj.geometries[i].data.texcoord);
    let o = initVertexBufferForLaterUse(gl, 
                                        obj.geometries[i].data.position,
                                        obj.geometries[i].data.normal, 
                                        obj.geometries[i].data.texcoord,
                                        tagentSpace.tagents,
                                        tagentSpace.bitagents);
    objComponents.push(o);
  }
  return objComponents;
}
