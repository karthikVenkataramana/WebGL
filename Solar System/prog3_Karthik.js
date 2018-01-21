/***************************************************************************************************
       Author:  Karthik Venkataramana Pemmaraju 
         Date:  10/10/2016 - 10/12/2016
 Description:   This program attempts to mimic solar system. The hieracrchy followed by the program is 
        		Sun -> Planets (Earth) ->Moon.  Each Planet revolves around itself(revolution) and Sun. 
  				Moon revolves around Earth in Counter clockwise whereas all the other planets
  				revolve Clockwise around Sun. Color codes for each planet are displayed in the HTML.
  				Use the buttons Slow , Medium and Fast to control the pace of animation. Use On and Off
  				to toggle animation.   				  		

****************************************************************************************************/
"use strict";


/************ Vertex shader Text************************/

/* Assigns the vertex color to the fragments.
 * Updates the position of vertex by multiplying current position 
 * with the transformation Matrix.
 * Sets point size to 3 pixels.
 */
var VSHADER_SOURCE = [
    'precision mediump float;',
    'attribute vec3 a_Position;',
    'uniform mat4 model_Matrix;',
    'uniform mat4 view_Matrix;',
    'uniform mat4 projection_Matrix;',
    'attribute vec3 vertColor;',
    'varying vec3 fragColor;',
    'void main() {',
    'fragColor=vertColor;',
    'gl_Position = (projection_Matrix)*(view_Matrix)* (model_Matrix)*(vec4(a_Position,1.0));',
    'gl_PointSize=3.0;',
    '}'
].join('\n');



/************Fragment shader Text************************/

/* Takes the input color from Vertex Shader and sets it to the Fragment color.*/

var FSHADER_SOURCE = [
    'precision mediump float;',
    'varying vec3 fragColor;',
    'void main() {',
    '  gl_FragColor = vec4(fragColor, 1.0);',
    '}'
].join('\n');

/************Global Variables************************************/
var gl, canvas;
var verticesOfSun = [];
var indicesOfSun = [];
var indicesOfEarth = [];
var verticesOfEarth = [];
var verticesOfMoon = [];
var indicesOfMoon = [];
var verticesOfMercury = [];
var verticesOfVenus = [];
var indicesOfVenus = [];
var indicesOfMercury = [];
var verticesOfMars = [];
var indicesOfMars = [];
var verticesOfJupiter = [];
var indicesOfJupiter = [];
var angle = 0;
var radius;
var pause = false;
var n = 150;
var verticesOfStar = [];

/************ Main Function ************************************/

function main() {
    var vertexBufferForStar, indexBufferForSun, vertexBufferForSun, indexBufferForEarth, vertexBufferForEarth, vertexBufferForMoon, indexBufferForMoon, vertexBufferForMercury, indexBufferForMercury, vertexBufferForVenus, indexBufferForVenus, vertexBufferForMars, indexBufferForMars, vertexBufferForJupiter, indexBufferForJupiter;

    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Compute vertices for each object
    computeVertices(0.25 / 1.35, 'Sun');
    computeVertices(0.02 / 1.35, 'Mercury');
    computeVertices(0.06 / 1.35, 'Venus');
    computeVertices(0.09 / 1.35, 'Earth');
    computeVertices(0.03 / 1.35, 'Moon');
    computeVertices(0.045 / 1.35, 'Mars');
    computeVertices(0.14 / 1.35, 'Jupiter');
    computeVerticesOfStar();

    // Compute indices of each Object
    computeIndices();

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Initialize vertex and Fragment Buffers for each object
    vertexBufferForStar = initVertexBuffers(vertexBufferForStar, verticesOfStar);
    vertexBufferForSun = initVertexBuffers(vertexBufferForSun, verticesOfSun);
    indexBufferForSun = initIndexBuffers(indexBufferForSun, indicesOfSun);
    vertexBufferForMercury = initVertexBuffers(vertexBufferForMercury, verticesOfMercury);
    indexBufferForMercury = initIndexBuffers(indexBufferForMercury, indicesOfMercury);
    vertexBufferForVenus = initVertexBuffers(vertexBufferForVenus, verticesOfVenus);
    indexBufferForVenus = initIndexBuffers(indexBufferForVenus, indicesOfVenus);
    vertexBufferForEarth = initVertexBuffers(vertexBufferForEarth, verticesOfEarth);
    indexBufferForEarth = initIndexBuffers(indexBufferForEarth, indicesOfEarth);
    vertexBufferForMoon = initVertexBuffers(vertexBufferForMoon, verticesOfMoon);
    indexBufferForMoon = initIndexBuffers(indexBufferForMoon, indicesOfMoon);
    vertexBufferForMars = initVertexBuffers(vertexBufferForMars, verticesOfMars);
    indexBufferForMars = initIndexBuffers(indexBufferForMars, indicesOfMars);
    vertexBufferForJupiter = initVertexBuffers(vertexBufferForJupiter, verticesOfJupiter);
    indexBufferForJupiter = initIndexBuffers(indexBufferForJupiter, indicesOfJupiter);


    // Get storage location of u_ModelMatrix
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'model_Matrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of model_Matrix');
        return;
    }

    // Get storage location of view Matrix
    var view_Matrix = gl.getUniformLocation(gl.program, 'view_Matrix');
    if (!view_Matrix) {
        console.log('Failed to get the storage location of view_Matrix');
        return;
    }

    // Get storage location of projection Matrix
    var projection_Matrix = gl.getUniformLocation(gl.program, 'projection_Matrix');
    if (!projection_Matrix) {
        console.log('Failed to get the storage location of projection_Matrix');
        return;
    }
    // Enable depth test
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // Front facing polygon with counter clockwise winding.
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    // Model Matrices for each Object 

    var ModelMatrixForSun = new Matrix4();
    var ModelMatrixForEarth = new Matrix4();
    var ModelMatrixForMercury = new Matrix4();
    var ModelMatrixForVenus = new Matrix4();
    var ModelMatrixForMars = new Matrix4();
    var ModelMatrixForJupiter = new Matrix4();
    var ModelMatrixForStar = new Matrix4();
    var RotationMatrixForMoon = new Matrix4();

    // View and Projection Matrices
    var viewMatrix = new Matrix4();
    var projectionMatrix = new Matrix4();

    /********* Matrices to Identity *************************/
    ModelMatrixForMercury.setIdentity();
    ModelMatrixForEarth.setIdentity();
    RotationMatrixForMoon.setIdentity();
    ModelMatrixForSun.setIdentity();
    ModelMatrixForMars.setIdentity();
    ModelMatrixForJupiter.setIdentity();
    ModelMatrixForVenus.setIdentity();
    ModelMatrixForStar.setIdentity();
    viewMatrix.setIdentity();
    projectionMatrix.setIdentity();

    // Set looking point
    viewMatrix.setLookAt(0, 0, -100, 0, 0, 0, 0, 1, 0);
    // Perspective projection with viewing angle of 45 degrees.
    projectionMatrix.setPerspective(toRadians(45), (canvas.width / canvas.height), 0.1, 1000);
    gl.uniformMatrix4fv(view_Matrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(projection_Matrix, false, projectionMatrix.elements);

    function tick() {
        angle = computeAngle(angle, n);

        // Set black as background color
        gl.clearColor(0, 0, 0, 1);

        // Clear depth and color buffer bits
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        /*********Set Matrices of Sun and render *****************/
        ModelMatrixForSun.setRotate(-angle, 0, 1, 0.25);
        Draw(angle, ModelMatrixForSun, u_ModelMatrix, vertexBufferForSun, indexBufferForSun);


        /*******Set Matrices of Mercury and Render ***********/
        ModelMatrixForMercury.setRotate(angle / 2, 0, 1, 0.15);
        ModelMatrixForMercury.translate(0.3, 0, 0);
        Draw(angle, ModelMatrixForMercury, u_ModelMatrix, vertexBufferForMercury, indexBufferForMercury);

        /*******Set Matrices of Venus and Render ***********/
        ModelMatrixForVenus.setRotate(angle / 3, 0, 1, 0.15);
        ModelMatrixForVenus.translate(-0.4, 0, 0);
        Draw(angle, ModelMatrixForVenus, u_ModelMatrix, vertexBufferForVenus, indexBufferForVenus);

        /*******Set Matrices of Earth and Render ***********/
        ModelMatrixForEarth.setRotate(angle / 3.5, 0, 1, 0.15);
        ModelMatrixForEarth.translate(0.6, 0, 0);
        Draw(angle, ModelMatrixForEarth, u_ModelMatrix, vertexBufferForEarth, indexBufferForEarth);

        /*******Set Matrices of Moon and Render ***********/

        pushMatrix(ModelMatrixForEarth); // Save for later use (next draw call)
        RotationMatrixForMoon.setRotate(-angle / 0.5, 0, 1, 0.15);
        ModelMatrixForEarth.multiply(RotationMatrixForMoon, ModelMatrixForEarth);
        ModelMatrixForEarth.translate(0.12, 0, 0);
        Draw(angle, ModelMatrixForEarth, u_ModelMatrix, vertexBufferForMoon, indexBufferForMoon);

        ModelMatrixForEarth = popMatrix(); // Taken from Matsuda and Lea Example

        /********** Set Matrices of Mars and Render **************/

        ModelMatrixForMars.setRotate(angle / 3.5, 0, 1, 0.15);
        ModelMatrixForMars.translate(0.85, 0, 0);
        Draw(angle, ModelMatrixForMars, u_ModelMatrix, vertexBufferForMars, indexBufferForMars);


        /******Set Matrices of Jupiter and Render **********/
        ModelMatrixForJupiter.setRotate(angle / 6, 0, 1, 0.15);
        ModelMatrixForJupiter.translate(1.0, 0, 0);
        Draw(angle, ModelMatrixForJupiter, u_ModelMatrix, vertexBufferForJupiter, indexBufferForJupiter);

        /**********Draw Random Stars******************************/
        DrawStar(ModelMatrixForStar, u_ModelMatrix, vertexBufferForStar);

        if (!pause) {
            requestAnimationFrame(tick, canvas);
        }
    }

    tick();
}



function computeAngle(angle, n) {
    // One full rotation per 6*n seconds 

    angle = performance.now() / 1000 / 6 * n * Math.PI;
    return angle;
}

/************Initialize the vertex buffers************************************/

function initVertexBuffers(vertexBuffer, vertices) {

    // Create a buffer object  
    vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    return vertexBuffer;
}

/************Initialize the Index buffers************************************/


function initIndexBuffers(indexBuffer, indices) {
    /************** Index buffer for Each Planet **************/
    indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the  index buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return indexBuffer;
}


/****** You can change number of Lattitudes, Longitudes in each sphere*********/
var Lattitudes = 25;
var Longitudes = 25;
var latIndex = 0,
    longIndex, tag;


/********* Given radius, tag the function computes vertices for spherical object****************/

function computeVertices(radius, tag) {
    var theta, sinTheta, cosTheta, sinPhi, cosPhi, x, y, z, phi;
    var countForEarth = 0;
    var countForSun = 0;
    var countForMercury = 0;
    var countForVenus = 0;
    var countForMars = 0;
    var countForJupiter = 0;
    var countForMoon = 0;
    for (latIndex = 0; latIndex <= Lattitudes; latIndex++) {
        theta = latIndex * Math.PI / Lattitudes;
        sinTheta = Math.sin(theta);
        cosTheta = Math.cos(theta);

        for (longIndex = 0; longIndex <= Longitudes; longIndex++) {
            phi = longIndex * 2 * Math.PI / Longitudes;
            sinPhi = Math.sin(phi);
            cosPhi = Math.cos(phi);
            x = cosPhi * sinTheta;
            y = cosTheta;
            z = sinPhi * sinTheta;
            if (tag == 'Sun') {
                verticesOfSun.push(radius * x);
                verticesOfSun.push(radius * y);
                verticesOfSun.push(radius * z);
                verticesOfSun.push(255 - countForSun / 255.0);
                verticesOfSun.push((255 - countForSun) / 255.0);
                verticesOfSun.push(0 / 255.0);
                countForSun = countForSun + 0.4;
            }
            if (tag == 'Earth') {
                verticesOfEarth.push(radius * x);
                verticesOfEarth.push(radius * y);
                verticesOfEarth.push(radius * z);
                verticesOfEarth.push(countForEarth / 255.0);
                verticesOfEarth.push((255 - countForEarth) / 255.0);
                verticesOfEarth.push(255 - countForEarth / 255.0);
                countForEarth = countForEarth + 0.35;
            }
            if (tag == 'Mercury') {
                verticesOfMercury.push(radius * x);
                verticesOfMercury.push(radius * y);
                verticesOfMercury.push(radius * z);
                verticesOfMercury.push((255 - countForMercury) / 255.0);
                verticesOfMercury.push(128 / 255.0);
                verticesOfMercury.push(128 / 255.0);
                countForMercury = countForMercury + 0.3;
            }
            if (tag == 'Venus') {
                verticesOfVenus.push(radius * x);
                verticesOfVenus.push(radius * y);
                verticesOfVenus.push(radius * z);
                verticesOfVenus.push(175 / 255.0);
                verticesOfVenus.push((255 - countForVenus) / 255.0);
                verticesOfVenus.push(0 / 255.0);
                countForVenus = countForVenus + 0.4;
            }
            if (tag == 'Mars') {
                verticesOfMars.push(radius * x);
                verticesOfMars.push(radius * y);
                verticesOfMars.push(radius * z);
                verticesOfMars.push(172 - countForMars / 255.0);
                verticesOfMars.push(42 / 255.0);
                verticesOfMars.push(42 / 255.0);
                countForMars = countForMars + 0.4;
            }
            if (tag == 'Jupiter') {
                verticesOfJupiter.push(radius * x);
                verticesOfJupiter.push(radius * y);
                verticesOfJupiter.push(radius * z);
                verticesOfJupiter.push(255 / 255.0);
                verticesOfJupiter.push((255 - countForJupiter) / 255.0);
                verticesOfJupiter.push(0 + countForJupiter / 255.0);
                countForJupiter = countForJupiter + 0.2;
            }
            if (tag == 'Moon') {
                verticesOfMoon.push(radius * x);
                verticesOfMoon.push(radius * y);
                verticesOfMoon.push(radius * z);
                verticesOfMoon.push(255 / 255.0);
                verticesOfMoon.push((255 - countForMoon) / 255.0);
                verticesOfMoon.push(255 / 255.0);
                countForMoon = countForMoon + 0.15;
            }

        }
    }
}


/**********Computes the indices of the spherical objects*******************/

function computeIndices() {
    var first, second;
    for (latIndex = 0; latIndex < Lattitudes; latIndex++) {
        for (longIndex = 0; longIndex < Longitudes; longIndex++) {
            first = (latIndex * (Longitudes + 1)) + longIndex;
            second = first + Longitudes + 1;
            indicesOfSun.push(first);
            indicesOfSun.push(second);
            indicesOfSun.push(first + 1);
            indicesOfSun.push(second);
            indicesOfSun.push(second + 1);
            indicesOfSun.push(first + 1);
        }
    }
    indicesOfEarth = indicesOfSun; //Since we use same indices for all spherical objects.
    indicesOfMercury = indicesOfSun;
    indicesOfVenus = indicesOfSun;
    indicesOfMars = indicesOfSun;
    indicesOfJupiter = indicesOfSun;
    indicesOfMoon = indicesOfSun;
}


/*************Draw Function **********************************************/

function Draw(angle, ModelMatrix, u_ModelMatrix, vertexBuffer, indexBuffer) {


    /************** Set up position *********************/
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(a_Position);

    /********* Draw Vertex Color *********************/
    var vertColor = gl.getAttribLocation(gl.program, 'vertColor');
    if (vertColor < 0) {
        console.log('Failed to get the storage location of vertColor');
        return;
    }
    gl.vertexAttribPointer(vertColor, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(vertColor);
    gl.uniformMatrix4fv(u_ModelMatrix, false, ModelMatrix.elements);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, (indicesOfSun.length), gl.UNSIGNED_SHORT, 0);

}

// Since Trignometric functions in Javascript take arguments in terms of Radians
function toRadians(angle) {
    return angle * (Math.PI / 180);
}
// Stop animation.
function stopAnimation() {
    pause = true;
}

// Restart animation.
function startAnimation() {
    pause = false;
    main();
}

// If slow button is clicked.
function slow() {
    n = 50; // 50 rotations for every 6 seconds.
}

// For Medium.
function medium() {
    n = 450; // 450 rotations for every 6 seconds.
}

// For Fast.
function fast() {
    n = 800;
}


/********************* Function to draw the Random stars*********************/

function DrawStar(ModelMatrix, u_ModelMatrix, vertexBuffer) {
    /************** Set up position *********************/
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(a_Position);

    /********* Draw Vertex Color ***********/
    var vertColor = gl.getAttribLocation(gl.program, 'vertColor');
    if (vertColor < 0) {
        console.log('Failed to get the storage location of vertColor');
        return;
    }
    gl.vertexAttribPointer(vertColor, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
    // gl.enableVertexAttribArray(vertColor);
    gl.uniformMatrix4fv(u_ModelMatrix, false, ModelMatrix.elements);
    gl.drawArrays(gl.POINTS, 0, verticesOfStar.length / 6);

}

/********************* Adopted from Matsuda and Lea Example*********************/

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
    var m2 = new Matrix4(m);
    g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
    return g_matrixStack.pop();
}


/*********************Compute Vertices of Star (Random points)*********************/
function computeVerticesOfStar() {
    var i = 0,
        k;
    for (i = 0.25; i < 120; i += 0.015) {
        k = Math.random(0, 1);
        verticesOfStar.push(i);
        verticesOfStar.push(k);
        verticesOfStar.push(1);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(i);
        verticesOfStar.push(-k);
        verticesOfStar.push(1);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(-k);
        verticesOfStar.push(i);
        verticesOfStar.push(1);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(-i);
        verticesOfStar.push(-k);
        verticesOfStar.push(1);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(245 / 255);
    }

}