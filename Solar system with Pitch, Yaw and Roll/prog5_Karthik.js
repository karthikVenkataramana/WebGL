/***************************************************************************************************
       Author:  Karthik Venkataramana Pemmaraju 
         Date:  11/16/2016
 Description:   The Webgl program displays a solar system. The main idea of rotation in 3 space is 
                by using quaternions. Zooming is achieved by scaling the radius of the view volume.
                Key codes for corresponding  events are mentioned in the HTML file.
                A vector p rotated through angle theta about a pole 'n' is given by q*p*q (inv).
                where q is an unit quaternion (cos(theta/2), n (sin(theta/2))).

 References:    Transformation Algebra Notes By Prof. Robert Renka.                 

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
var s = 0.018;
var r = 50;
var verticesOfStar = [];
var viewMatrix = new Matrix4();
var projectionMatrix = new Matrix4();
var radius = 0.35 / 1.35;
var frustum_left = -s * r;
var frustum_right = s * r;
var frustum_bottom = -s * r;
var frustum_top = s * r;
var x_increment_angle = 10;
var y_increment_angle = 10;
var u_x = 0;
var u_y = 0;
var u_z = 0;
var view_x = 0;
var view_y = 0;
var view_z = -2 * radius;

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
    computeVertices(radius, 'Sun');
    computeVertices(0.1 * radius, 'Mercury');
    computeVertices(0.2 * radius, 'Venus');
    computeVertices(0.3 * radius, 'Earth');
    computeVertices(0.15 * radius, 'Moon');
    computeVertices(0.45 * radius, 'Mars');
    computeVertices(0.75 * radius, 'Jupiter');
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
    viewMatrix.setLookAt(0, 0, -100, view_x, view_y, view_y, 0, 1, 0);
    projectionMatrix.setFrustum(frustum_left, frustum_right, frustum_bottom, frustum_top, r, 3 * r);

    gl.uniformMatrix4fv(view_Matrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(projection_Matrix, false, projectionMatrix.elements);

    document.onkeydown = function(ev) {
        keydown(ev, ModelMatrixForSun, u_ModelMatrix, vertexBufferForSun, indexBufferForSun, ModelMatrixForMercury, vertexBufferForMercury, indexBufferForMercury, ModelMatrixForVenus, vertexBufferForVenus, indexBufferForVenus, ModelMatrixForEarth, vertexBufferForEarth, indexBufferForEarth, ModelMatrixForMars, vertexBufferForMars, indexBufferForMars, ModelMatrixForJupiter, vertexBufferForJupiter, indexBufferForJupiter, indexBufferForMoon, vertexBufferForMoon, RotationMatrixForMoon, view_Matrix, projection_Matrix);
    }

    function tick() {
        angle = computeAngle(angle, n);

        // Set black as background color
        gl.clearColor(0, 0, 0, 1);

        // Clear depth and color buffer bits
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);


        DrawEverything(ModelMatrixForSun, u_ModelMatrix, vertexBufferForSun, indexBufferForSun, ModelMatrixForMercury, vertexBufferForMercury, indexBufferForMercury, ModelMatrixForVenus, vertexBufferForVenus, indexBufferForVenus, ModelMatrixForEarth, vertexBufferForEarth, indexBufferForEarth, ModelMatrixForMars, vertexBufferForMars, indexBufferForMars, ModelMatrixForJupiter, vertexBufferForJupiter, indexBufferForJupiter, indexBufferForMoon, vertexBufferForMoon, RotationMatrixForMoon, view_Matrix, projection_Matrix);

        if (!pause) {
            requestAnimationFrame(tick, canvas);
        }
    }

    tick();
}


/***The main draw function which draws all the planets *****************/

function DrawEverything(ModelMatrixForSun, u_ModelMatrix, vertexBufferForSun, indexBufferForSun, ModelMatrixForMercury, vertexBufferForMercury, indexBufferForMercury, ModelMatrixForVenus, vertexBufferForVenus, indexBufferForVenus, ModelMatrixForEarth, vertexBufferForEarth, indexBufferForEarth, ModelMatrixForMars, vertexBufferForMars, indexBufferForMars, ModelMatrixForJupiter, vertexBufferForJupiter, indexBufferForJupiter, indexBufferForMoon, vertexBufferForMoon, RotationMatrixForMoon, view_Matrix, projection_Matrix) {

    frustum_left = -s * r;
    frustum_right = s * r;
    frustum_bottom = -s * r;
    frustum_top = s * r;

    viewMatrix.setLookAt(0, 0, -100, view_x, view_y, view_z, 0, 1, 0);
    // Perspective projection with viewing angle of 45 degrees.
    // projectionMatrix.setOrtho(-1.25,1.25,-1,1, 1,1000);
    projectionMatrix.setFrustum(frustum_left, frustum_right, frustum_bottom, frustum_top, r, 3 * r);

    gl.uniformMatrix4fv(view_Matrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(projection_Matrix, false, projectionMatrix.elements);

    /*********Set Matrices of Sun and render *****************/
    ModelMatrixForSun.translate(0, 0, -2 * r);

    ModelMatrixForSun.setRotate(-angle, 0, 1, 0.15);

    // /ModelMatrixForSun.setRotate(product[0], product[1], product[2], product[3]);
    Draw(angle, ModelMatrixForSun, u_ModelMatrix, vertexBufferForSun, indexBufferForSun);


    /*******Set Matrices of Mercury and Render ***********/
    ModelMatrixForMercury.translate(0, 0, -2 * r);
    ModelMatrixForMercury.setRotate(angle / 2, 0, 1, 0.15);
    ModelMatrixForMercury.translate(0.3, 0, 0);
    Draw(angle, ModelMatrixForMercury, u_ModelMatrix, vertexBufferForMercury, indexBufferForMercury);

    /*******Set Matrices of Venus and Render ***********/
    ModelMatrixForVenus.translate(0, 0, -2 * r);
    ModelMatrixForVenus.setRotate(angle / 3, 0, 1, 0.15);
    ModelMatrixForVenus.translate(-0.4, 0, 0);
    Draw(angle, ModelMatrixForVenus, u_ModelMatrix, vertexBufferForVenus, indexBufferForVenus);

    /*******Set Matrices of Earth and Render ***********/
    ModelMatrixForEarth.translate(0, 0, -2 * r);
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
    ModelMatrixForMars.translate(0, 0, -2 * r);
    ModelMatrixForMars.setRotate(angle / 3.5, 0, 1, 0.15);
    ModelMatrixForMars.translate(0.85, 0, 0);
    Draw(angle, ModelMatrixForMars, u_ModelMatrix, vertexBufferForMars, indexBufferForMars);


    /******Set Matrices of Jupiter and Render **********/
    ModelMatrixForJupiter.translate(0, 0, -2 * r);
    ModelMatrixForJupiter.setRotate(angle / 6, 0, 1, 0.15);
    ModelMatrixForJupiter.translate(-1.0, 0, 0);
    Draw(angle, ModelMatrixForJupiter, u_ModelMatrix, vertexBufferForJupiter, indexBufferForJupiter);

    /**********Draw Random Stars******************************/
    //DrawStar(ModelMatrixForStar, u_ModelMatrix, vertexBufferForStar);

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
var Lattitudes = 35;
var Longitudes = 35;
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
    var i, j = 0,
        k;
    for (i = -0.99; i < 120; i += 0.015) {
        k = Math.random(0, 1);
        verticesOfStar.push(i);
        verticesOfStar.push(k);
        verticesOfStar.push(1);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(245 / 255);
        verticesOfStar.push(245 / 255);

    }

}

var pitch_x = 0;
var yaw_y = 0;
var roll_z = 0;

function keydown(ev, ModelMatrixForSun, u_ModelMatrix, vertexBufferForSun, indexBufferForSun, ModelMatrixForMercury, vertexBufferForMercury, indexBufferForMercury, ModelMatrixForVenus, vertexBufferForVenus, indexBufferForVenus, ModelMatrixForEarth, vertexBufferForEarth, indexBufferForEarth, ModelMatrixForMars, vertexBufferForMars, indexBufferForMars, ModelMatrixForJupiter, vertexBufferForJupiter, indexBufferForJupiter, indexBufferForMoon, vertexBufferForMoon, RotationMatrixForMoon, view_Matrix, projection_Matrix) {
    switch (ev.keyCode) {

        case 18:

            s = s * 1.1;
            break;
            // Alt key is pressed. Zoom out.
        case 16:
            s = s / 1.1;
            break;
            // Shift key is pressed. Zoom in.
        case 37:

            y_increment_angle = y_increment_angle + 0.1;
            rotate_Camera(toRadians(y_increment_angle), 0, 1, 0);
            break; // Left arrow is pressed rotate about Y axis
        case 39:
            y_increment_angle = y_increment_angle - 0.1;
            rotate_Camera(toRadians(y_increment_angle), 0, -1, 0);
            break; //Right arrow is pressed, rotate about -Y axis

        case 38:
            x_increment_angle = x_increment_angle + 0.1;
            rotate_Camera(toRadians(x_increment_angle), 1, 0, 0);
            break; // Up arrow is pressed rotate about X- axis
        case 40:

            x_increment_angle = x_increment_angle - 0.1;
            rotate_Camera(toRadians(x_increment_angle), -1, 0, 0);
            break; //Down arrow is pressed rotate about X- axis

        case 88:
            pitch_x = pitch_x + 0.01;
            x_increment_angle = x_increment_angle + 0.1;
            rotate_Camera(toRadians(x_increment_angle), pitch_x, yaw_y, roll_z);
            break; // x is  pressed. pitch x.

        case 65:
            pitch_x = pitch_x - 0.01;
            x_increment_angle = x_increment_angle - 0.1;
            rotate_Camera(toRadians(x_increment_angle), -pitch_x, yaw_y, roll_z);

            break; //a is pressed.

        case 89:
            yaw_y = yaw_y + 0.01;
            x_increment_angle = x_increment_angle + 0.1;
            rotate_Camera(toRadians(x_increment_angle), pitch_x, yaw_y, roll_z);
            break; // y is  pressed.

        case 66:
            yaw_y = yaw_y - 0.01;
            x_increment_angle = x_increment_angle - 0.1;
            rotate_Camera(toRadians(x_increment_angle), pitch_x, -yaw_y, roll_z);

            break; //b is pressed.
        case 90:
            roll_z = roll_z + 0.01;
            x_increment_angle = x_increment_angle + 0.1;
            rotate_Camera(toRadians(x_increment_angle), pitch_x, yaw_y, roll_z);
            break; // x is  pressed.

        case 67:
            roll_z = roll_z - 0.01;
            x_increment_angle = x_increment_angle - 0.1;
            rotate_Camera(toRadians(x_increment_angle), pitch_x, yaw_y, -roll_z);

            break; //a is pressed.




        default:
            return; // Prevent the unnecessary drawing
    }
    DrawEverything(ModelMatrixForSun, u_ModelMatrix, vertexBufferForSun, indexBufferForSun, ModelMatrixForMercury, vertexBufferForMercury, indexBufferForMercury, ModelMatrixForVenus, vertexBufferForVenus, indexBufferForVenus, ModelMatrixForEarth, vertexBufferForEarth, indexBufferForEarth, ModelMatrixForMars, vertexBufferForMars, indexBufferForMars, ModelMatrixForJupiter, vertexBufferForJupiter, indexBufferForJupiter, indexBufferForMoon, vertexBufferForMoon, RotationMatrixForMoon);


}

//performs product of two quaternions a and b .
function Quaternion_product(a, b) {

    var product = new Float32Array(4);
    product[0] = a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1]; //x
    product[1] = a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0]; //y
    product[2] = a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3]; //z
    product[3] = a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]; //w
    normalize(product);
    console.log(product);
    return product;


}

//normalize the quaternion
function normalize(product) {
    var x = Math.sqrt(Math.pow(product[0], 2) + Math.pow(product[1], 2) + Math.pow(product[2], 2) + Math.pow(product[3], 2));
    if (x != 0)
        x = 1 / x;
    else
        x = 1;
    product[0] = product[0] * x;
    product[1] = product[1] * x;
    product[2] = product[2] * x;
    product[3] = product[3] * x;
    return product;
}

// conjugate of quaternion (w,v) is (w,-v)
function conjugate(p) {
    var conjugate_p = new Float32Array(4);
    conjugate_p[0] = -p[0]; //x
    conjugate_p[1] = -p[1]; //y
    conjugate_p[2] = -p[2]; //z
    conjugate_p[3] = p[3]; //w

    return conjugate_p;
}

function rotate_Camera(increment_angle, x, y, z) {
    var q = new Float32Array(4);
    q[0] = Math.sin(increment_angle / 2) * x; //x
    q[1] = Math.sin(increment_angle / 2) * y; //y
    q[2] = Math.sin(increment_angle / 2) * z; //z
    q[3] = Math.cos(increment_angle / 2); //w
    var p = new Float32Array(4);
    p[0] = view_x; //x
    p[1] = view_y; //y
    p[2] = view_z; //z
    p[3] = 0; //w
    var result = new Float32Array(4);
    //console.log(Quaternion_product(q,p));
    result = Quaternion_product(Quaternion_product(q, p), conjugate(q)); // From Theorem in the Notes (Quaternions, Page 3)
    view_x = result[0];
    view_y = result[1];
    view_z = result[2];
    console.log(result);
}