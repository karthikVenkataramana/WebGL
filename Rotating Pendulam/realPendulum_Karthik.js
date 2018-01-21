/***************************************************************************************************
     Author: Karthik Venkataramana Pemmaraju 
       Date: 09/27/2016
Description: This script creates a pendulum which oscillates in free space. The buttons
             can increase or decrease the gravity on the rotating pendulam by a
             factor of 10. The Slider sets Gravity to any arbitrary value.
             Use Reset button to set gravity to 30 and Stop to set it to 0.
             Damping effect can be increased by decreasing the damping variable in the code.
****************************************************************************************************/
"use strict";


/************ Vertex shader Text************************/
var VSHADER_SOURCE = [
    'precision mediump float;',
    'attribute vec4 a_Position;',
    'uniform mat4 u_ModelMatrix;',
    'attribute vec3 vertColor;',
    'varying vec3 fragColor;',
    'void main() {',
    'fragColor=vertColor;',
    'gl_Position = u_ModelMatrix* a_Position;',
    'gl_PointSize=5.0;',
    '}'
].join('\n');



/************Fragment shader Text************************/
var FSHADER_SOURCE = [
    'precision mediump float;',
    'varying vec3 fragColor;',
    'void main() {',
    '  gl_FragColor = vec4(fragColor, 1.0);',
    '}'
].join('\n');




/************Global Variable*********************************/
// Rotation angle (degrees/second)
var ANGLE_STEP = 0.0;
var radius = 0.1;
var length = 175;
var angularVelocity = 0;
var angularacceleration = 0;
var gravity = 30;
var damping = 0.995;
var newAngle;

// Vertices of the Hexagon
var A = [],
    B = [],
    C = [],
    D = [],
    E = [],
    F = [];



/************Main Program************************************/

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    computeVerticesOfBob();
    // Write the positions of vertices to a vertex shader
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }


    // Get storage location of u_ModelMatrix
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }
    // Current rotation angle
    var currentAngle = 45;
    // Model matrix
    var modelMatrixForLine = new Matrix4();
    var modelMatrixForSquare = new Matrix4();
    var modelMatrixForBob = new Matrix4();

    // Start drawing
    var tick = function() {
        currentAngle = animate(currentAngle); // Update the rotation angle
        draw(gl, u_ModelMatrix, modelMatrixForLine, 0, currentAngle);
        draw(gl, u_ModelMatrix, modelMatrixForSquare, 1, currentAngle);
        draw(gl, u_ModelMatrix, modelMatrixForBob, 2, currentAngle);
        requestAnimationFrame(tick, canvas); // Request that the browser calls tick
    };


    tick();
}


/************Compute Hexagon vertices************************************/
var x = 0;
var y = -0.8;

function computeVerticesOfBob() {

    A = [(x + (radius * (Math.cos(toRadians(0))))), (y + radius * (Math.sin(toRadians(0))))];
    B = [(x + (radius * (Math.cos(toRadians(60))))), (y + radius * (Math.sin(toRadians(60))))];
    C = [(x + (radius * (Math.cos(toRadians(120))))), (y + radius * (Math.sin(toRadians(120))))];
    D = [(x + (radius * (Math.cos(toRadians(180))))), (y + radius * (Math.sin(toRadians(180))))];
    E = [(x + (radius * (Math.cos(toRadians(240))))), (y + radius * (Math.sin(toRadians(240))))];
    F = [(x + (radius * (Math.cos(toRadians(300))))), (y + radius * (Math.sin(toRadians(300))))];
}


/************Draw function************************************/
function draw(gl, u_ModelMatrix, modelMatrix, i, currentAngle) {
    // Sets values for a 4x4 floating point vector matrix into a uniform location as a matrix or a matrix array.
    gl.uniformMatrix4fv(
        u_ModelMatrix, //storage location of the matrix.
        false, //Transpose.
        modelMatrix.elements //Pass on Array of values.
    );

    /**** Draw the string********/
    if (i == 0) {
        modelMatrix.setRotate(currentAngle, 0, 0, 1);
        modelMatrix.translate(0, 0, 0);
        gl.drawArrays(
            gl.LINES,
            6, //Skip First 6 vertices
            2 // Draw a Line with 2 points
        );
    }
    /***** Draw square with two triangles********/
    if (i == 1) {
        modelMatrix.setIdentity();
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // return;

    }
    /****** Draw Bob with 4 triangles (12 vertices) ********/
    if (i == 2) {

        modelMatrix.setRotate(currentAngle, 0, 0, 1);
        modelMatrix.translate(0, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 8, 12);
        // return;
    }
}


/************Intialize the vertex buffers************************************/

function initVertexBuffers(gl) {
    var vertices = [

        // vertices of the Square
        0.05, -0.05, 0, 1, 0, 0.05, 0.05, 0, 1, 0, -0.05, 0.05, 0, 1, 0, -0.05, 0.05, 0, 1, 0, -0.05, -0.05, 0, 1, 0, 0.05, -0.05, 0, 1, 0,

        // vertices of the rigid wire
        0, 0, 1, 0, 0, 0, -0.8, 1, 0, 0,

        // vertices of the Hexagon
        E[0], E[1], 0, 0, 1, F[0], F[1], 0, 0, 1, A[0], A[1], 0, 0, 1,
        A[0], A[1], 0, 0, 1, B[0], B[1], 0, 0, 1, E[0], E[1], 0, 0, 1,
        B[0], B[1], 0, 0, 1, C[0], C[1], 0, 0, 1, E[0], E[1], 0, 0, 1,
        C[0], C[1], 0, 0, 1, D[0], D[1], 0, 0, 1, E[0], E[1], 0, 0, 1


    ];


    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Assign the buffer object to a_Position variable
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    var vertColor = gl.getAttribLocation(gl.program, 'vertColor');
    if (vertColor < 0) {
        console.log('Failed to get the storage location of vertColor');
        return;
    }
    gl.vertexAttribPointer(vertColor, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(vertColor);
    //return n;
}




// Last time that this function was called
var g_last = Date.now();



/************Compute current angle************************/

function animate(angle) {

    /* Angular acceleration of the rotating pendulum can be calculated using the
       formula a= -(g/R) * sin (Theta) */
    angularacceleration = -(gravity / length) * Math.sin(toRadians(angle));
    // Increment angular velocity.
    angularVelocity = angularVelocity + angularacceleration;
    // Increment angle.
    angle = angle + angularVelocity;
    // Damp the velocity by a factor of 0.995
    angularVelocity = angularVelocity * damping;
    return angle;
}

function up() {
    gravity += 10;
    updateSlider();
}

function down() {
    gravity -= 10;
    updateSlider();
}

/************JQuery function to display slider************************/

$(function() {
    $("#slider-vertical").slider({
        orientation: "vertical",
        range: "min",
        min: -1800,
        max: 1800,
        slide: function(event, ui) {
            gravity = ui.value;
            $("#amount").val(ui.value);
        }
    });
});

function reset() {
    gravity = 30;
    updateSlider();
}

function stop() {
    gravity = 0;
    updateSlider();

}

function updateSlider() {
    var value = $("#slider-vertical").slider("option", "value");
    $("#amount").val(gravity);
    $("#slider-vertical").slider("option", "value", gravity);
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}