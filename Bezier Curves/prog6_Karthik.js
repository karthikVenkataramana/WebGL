/*
       Author:  Karthik Venkataramana Pemmaraju 
         Date:  12/8/2016 - 12/12/2016
 Description:   This program is intended to draw a two segment piecewise cubic Bezier curve.
                To ensure tangent continuity: control points P2,P3 and P4 are adjusted accordingly.
                One can select and drag the control points by left mouse press. Zooming in and out
                is achieved by adjusting parameters of setOrtho() function.
                The color codes are given in the HTML page.  
*/

/* ************************************************************************** *
 * ************************************************************************** *
 *                                                                            *
 * Copyright (c) 2016, Karthik Venkataramana Pemmaraju                        *
 * All rights reserved.                                                       *
 *                                                                            *
 * Redistribution and use in source and binary forms, with or without         *
 * modification, are permitted provided that the following conditions         *
 * are met:                                                                   *
 *                                                                            *
 *     1. Redistributions of source code must retain the above copyright      *
 *     notice, this list of conditions and the following disclaimer.          *
 *                                                                            *
 *     2. Redistributions in binary form must reproduce the above copyright   *
 *     notice, this list of conditions and the following disclaimer in the    *
 *     documentation and/or other materials provided with the distribution.   *
 *                                                                            *
 *     3. Neither the name of the copyright holder nor the names of its       *
 *     contributors may be used to endorse or promote products derived from   *
 *     this software without specific prior written permission.               *
 *                                                                            *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS    *
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED      *
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A            *
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT         *
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,     *
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED   *
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR     *
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF     *
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING       *
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS         *
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.               *
 *                                                                            *
 * ************************************************************************** *
 * ************************************************************************** */

"use strict";

/************ Vertex shader Text************************/

/* Assigns the vertex color to the fragments.
 * Updates the position of vertex by multiplying current position 
 * with the transformation Matrix.
 * Sets point size to 10 pixels.
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
    'gl_Position = (projection_Matrix)*(view_Matrix)* (model_Matrix)*(vec4(a_Position,1.0));', // mvp matrix, since webgl does right multiplies.
    'gl_PointSize= 7.0;', //pixel size.
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

var vertices = [];

var control_points = [];
var indices_Of_Control_Points = [];

/** vertex arrays of control points*****/
var sphere_vertices_of_P0 = [];
var sphere_vertices_of_P1 = [];
var sphere_vertices_of_P2 = [];
var sphere_vertices_of_P3 = [];
var sphere_vertices_of_P4 = [];
var sphere_vertices_of_P5 = [];
var sphere_vertices_of_P6 = [];

/** These define our control points, Total of 7  P0..6********/
var P0 = [0.65, -0.1, 0.2];
var P1 = [0.5, 0.4, 0.2];
var P2 = [0, 0.8, 0.2];
var P3 = [0, 0, 0.2];
var P4 = [0, -0.5, 0.22];
var P5 = [-0.2, -0.2, 0.2];
var P6 = [-0.8, 0.5, 0.2];

// setOrtho() parameters
var ortho_left = -1;
var ortho_right = 1;
var ortho_bottom = -1;
var ortho_top = 1;

/* global variables */
var dragok = false;
var Point_3D;
var Point_Clicked;
var viewProjectionMatrix, modelMatrix, u_ModelMatrix, vertexBuffer, view_Matrix, projection_Matrix;
var viewMatrix = new Matrix4();
var projectionMatrix = new Matrix4();
var modelMatrix = new Matrix4();
modelMatrix.setIdentity();
var xRotationMatrix = new Matrix4();
var yRotationMatrix = new Matrix4();
var zRotationMatrix = new Matrix4();
xRotationMatrix.setIdentity();
yRotationMatrix.setIdentity();
zRotationMatrix.setIdentity();
//vertex buffers for control points.
var controlPointsBufferForP0, controlPointsBufferForP1, controlPointsBufferForP2, controlPointsBufferForP3, controlPointsBufferForP4, controlPointsBufferForP5, controlPointsBufferForP6;
// index buffer for control points.
var control_points_index_Buffer;
//For curve 1 r,g,b values
var r = getRandomArbitrary(0.5, 1);
var g = getRandomArbitrary(0, 1);
var b = getRandomArbitrary(0, 1);
// For curve 2 r,g,b values
var r1 = getRandomArbitrary(0, 1);
var g1 = getRandomArbitrary(0.15, 1);
var b1 = getRandomArbitrary(0, 1);
// Angles for rotation.
var angle_x = 0;
var angle_y = 0;
var angle_z = 0;

//vertices of tangent.
var vertices_of_tangent = [];
//vertex buffer for tangent.
var buffer_for_tangent;
/************ Main Function ************************************/

function main() {

    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }


    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'model_Matrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of model_Matrix');
        return;
    }

    // Get storage location of view Matrix
    view_Matrix = gl.getUniformLocation(gl.program, 'view_Matrix');
    if (!view_Matrix) {
        console.log('Failed to get the storage location of view_Matrix');
        return;
    }

    // Get storage location of projection Matrix
    projection_Matrix = gl.getUniformLocation(gl.program, 'projection_Matrix');
    if (!projection_Matrix) {
        console.log('Failed to get the storage location of projection_Matrix');
        return;
    }
    var t;

    drawEverything(); // Draws every object on the screen check definition.

}
//This functions renders every object on to the screen.
function drawEverything() {

    Bezier_points(); //compute vertices of bezier points.
    vertices_of_tangent = []; //set to empty
    // Computing vertices of control points (Sphere) 
    compute_Vertices_Of_Control_Points(0.015, P0, sphere_vertices_of_P0, "P0"); //radius is 0.015  
    compute_Vertices_Of_Control_Points(0.015, P1, sphere_vertices_of_P1, "P1");
    compute_Vertices_Of_Control_Points(0.015, P2, sphere_vertices_of_P2, "P2");
    compute_Vertices_Of_Control_Points(0.015, P3, sphere_vertices_of_P3, "P3");
    compute_Vertices_Of_Control_Points(0.015, P4, sphere_vertices_of_P4, "P4");
    compute_Vertices_Of_Control_Points(0.015, P5, sphere_vertices_of_P5, "P5");
    compute_Vertices_Of_Control_Points(0.015, P6, sphere_vertices_of_P6, "P6");
    // Computing the indices of control points (Since indices are same for all control points)
    compute_indices_Of_Control_Points();
    // Compute vertices of tangent line
    compute_vertices_of_tangent();
    // This is the vertex buffer for bezier curve points
    vertexBuffer = initVertexBuffers(vertexBuffer, vertices);
    buffer_for_tangent = initVertexBuffers(buffer_for_tangent, vertices_of_tangent);

    // These are the vertex buffers for control points.
    controlPointsBufferForP0 = initVertexBuffers(controlPointsBufferForP0, sphere_vertices_of_P0);
    controlPointsBufferForP1 = initVertexBuffers(controlPointsBufferForP1, sphere_vertices_of_P1);
    controlPointsBufferForP2 = initVertexBuffers(controlPointsBufferForP2, sphere_vertices_of_P2);
    controlPointsBufferForP3 = initVertexBuffers(controlPointsBufferForP3, sphere_vertices_of_P3);
    controlPointsBufferForP4 = initVertexBuffers(controlPointsBufferForP4, sphere_vertices_of_P4);
    controlPointsBufferForP5 = initVertexBuffers(controlPointsBufferForP5, sphere_vertices_of_P5);
    controlPointsBufferForP6 = initVertexBuffers(controlPointsBufferForP6, sphere_vertices_of_P6);

    // This is the index buffer for control points.(Note indices are same for spheres).
    control_points_index_Buffer = initIndexBuffers(control_points_index_Buffer, indices_Of_Control_Points);
    viewMatrix.setLookAt(0, 0, -10, 0, 0, 0, 0, 1, 0); // We are looking at 100 units in negative Z direction.

    projectionMatrix.setOrtho(ortho_left, ortho_right, ortho_bottom, ortho_top, 0.1, 1000); // using orhtographic projection
    viewProjectionMatrix = new Matrix4();
    viewProjectionMatrix.setIdentity();
    viewProjectionMatrix = viewProjectionMatrix.multiply(viewMatrix, projectionMatrix); //Our viewprojection is product of view and projection matrices.

    gl.uniformMatrix4fv(view_Matrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(projection_Matrix, false, projectionMatrix.elements);
    gl.enable(gl.DEPTH_TEST); // Enable Depth test.
    gl.enable(gl.CULL_FACE); //Culling front face.

    // Front facing polygon with counter clockwise winding.
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    // Set black as background color
    gl.clearColor(0, 0, 0, 1);

    // Clear depth and color buffer bits
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    // Draw the curve
    Draw(modelMatrix, u_ModelMatrix, vertexBuffer, 202);
    // Draw the tangent.
    Draw(modelMatrix, u_ModelMatrix, buffer_for_tangent, 3);
    // Now draw the control points.
    Draw_Control_Points(modelMatrix, u_ModelMatrix, controlPointsBufferForP0, control_points_index_Buffer);
    Draw_Control_Points(modelMatrix, u_ModelMatrix, controlPointsBufferForP1, control_points_index_Buffer);
    Draw_Control_Points(modelMatrix, u_ModelMatrix, controlPointsBufferForP2, control_points_index_Buffer);
    Draw_Control_Points(modelMatrix, u_ModelMatrix, controlPointsBufferForP3, control_points_index_Buffer);
    Draw_Control_Points(modelMatrix, u_ModelMatrix, controlPointsBufferForP4, control_points_index_Buffer);
    Draw_Control_Points(modelMatrix, u_ModelMatrix, controlPointsBufferForP5, control_points_index_Buffer);
    Draw_Control_Points(modelMatrix, u_ModelMatrix, controlPointsBufferForP6, control_points_index_Buffer);

    //Mouse released call myUp function
    canvas.onmouseup = myUp;

    // Handle Key press event
    document.onkeydown = function(ev) {
        keydown(ev);
    }

    canvas.onmousedown = function(ev) { // Mouse is pressed
        Point_Clicked = compute_New_Control_Point(ev, viewProjectionMatrix); //compute our 2-d analagous control point
        Check_If_ControlPointClicked(Point_Clicked); // check if it falls in specified range
     }
    updateUI(); //Update angles in HTML page
}
var tag;

function myMove(e, tag) { //fires every time user drags the control.
    if (dragok) {
        var x = e.pageX;
        var y = e.pageY;
        Point_Clicked = compute_New_Control_Point(e, viewProjectionMatrix); // returns new point/
        var newPoint = new Array(3);
        newPoint = Point_Clicked.elements; //copying them

        if (tag == 0) {
            // Update new position
            P0 = [];
            P0[0] = newPoint[0];
            P0[1] = newPoint[1];
            P0[2] = 0.2;
            drawEverything();
        }
        if (tag == 1) {
            // Update new position
            P1 = [];
            P1[0] = newPoint[0];
            P1[1] = newPoint[1];
            P1[2] = 0.2;
            drawEverything();
        }
        if (tag == 2) {
            // Enforce tangent continuity with P2 and P3
            P2 = [];
            P2[0] = newPoint[0];
            P2[1] = newPoint[1];
            P2[2] = 0.2;
            //setting P3 to be the mid point.
            P3[0] = (P2[0] + P4[0]) / 2;
            P3[1] = (P2[1] + P4[1]) / 2;
            P3[2] = (P2[2] + P4[2]) / 2;
            drawEverything();

        }
        if (tag == 3) {
            // Enforce tangent continuity with P3 and P4
            P3 = [];
            P3[0] = newPoint[0];
            P3[1] = newPoint[1];
            P3[2] = 1;
            //P3 is midpoint
            P4[0] = 2 * P3[0] - P2[0];
            P4[1] = 2 * P3[1] - P2[1];
            P4[2] = 2 * P3[2] - P2[2];
            drawEverything();
        }
        if (tag == 4) {
            // Enforce tangent continuity with P3 and P4
            P4 = [];
            P4[0] = newPoint[0];
            P4[1] = newPoint[1];
            P4[2] = 1;
            //set P3 to be the mid-point.
            P3[0] = (P2[0] + P4[0]) / 2;
            P3[1] = (P2[1] + P4[1]) / 2;
            P3[2] = (P2[2] + P4[2]) / 2;
            //console.log(P0);
            drawEverything();
        }
        if (tag == 5) {
            // Update new position
            P5 = [];
            P5[0] = newPoint[0];
            P5[1] = newPoint[1];
            P5[2] = 1; // Our View projection 100 units in -Z direction.
            //console.log(P0);
            drawEverything();
        }
        if (tag == 6) {
            // Update new position
            P6 = [];
            P6[0] = newPoint[0];
            P6[1] = newPoint[1];
            P6[2] = 1; // Our View projection 100 units in -Z direction.
            //console.log(P0);
            drawEverything();
        }
    }
}

//Handle key board events.
function keydown(ev) {
    switch (ev.keyCode) {

        case 39:
            angle_x += 0.005;
            xRotationMatrix.setRotate(angle_x, 1, 0, 0);
            modelMatrix.multiply(xRotationMatrix, modelMatrix);

            break; // Right arrrow key is pressed.

        case 37:
            angle_x -= 0.005;
            xRotationMatrix.setRotate(-angle_x, 1, 0, 0);
            modelMatrix.multiply(xRotationMatrix, modelMatrix);
            break; // The left arrow key was pressed
        case 38:
            angle_y += 0.005;
            yRotationMatrix.setRotate(angle_y, 0, 1, 0);
            modelMatrix.multiply(yRotationMatrix, modelMatrix);
            break; // The up arrow key was pressed
        case 40:
            angle_y -= 0.005;
            yRotationMatrix.setRotate(-angle_y, 0, 1, 0);
            modelMatrix.multiply(yRotationMatrix, modelMatrix);
            break; // The down arrow key was pressed
        case 88:
            ortho_left += 0.05;
            ortho_right -= 0.05;
            ortho_top -= 0.05;
            ortho_bottom += 0.05;
            break; //x key is pressed
        case 65:
            ortho_left -= 0.05;
            ortho_right += 0.05;
            ortho_top += 0.05;
            ortho_bottom -= 0.05;
            break; //a key is pressed
        case 90:
            angle_z += 0.005;
            zRotationMatrix.setRotate(angle_z, 0, 0, 1);
            modelMatrix.multiply(zRotationMatrix, modelMatrix);
            break; //z key is pressed
        case 67:
            angle_z -= 0.005;
            zRotationMatrix.setRotate(-angle_z, 0, 0, 1);
            modelMatrix.multiply(zRotationMatrix, modelMatrix);
            break; //c key is pressed
        default:
            return; // Prevent the unnecessary drawing
    }
    drawEverything();
}

//sets zoom to default
function defaultzoom() {

    ortho_left = -1;
    ortho_right = 1;
    ortho_bottom = -1;
    ortho_top = 1;
    drawEverything();
}

//computes vertices of Bezier points 
function Bezier_points() {
    var t;
    // First empty them since they may have previous values.
    vertices = [];
    sphere_vertices_of_P0 = [];
    sphere_vertices_of_P1 = [];
    sphere_vertices_of_P2 = [];
    sphere_vertices_of_P3 = [];
    sphere_vertices_of_P4 = [];
    sphere_vertices_of_P5 = [];
    sphere_vertices_of_P6 = [];

    //Step 1: Drawing the first Bezier curve
    for (t = 0; t < 1.01; t += 0.01) {
        var Bezier_Curve_Points = new Array(3);

        Bezier_Curve_Points = Bezier_Curve(P0, P1, P2, P3, t);
        vertices.push(Bezier_Curve_Points[0]);
        vertices.push(Bezier_Curve_Points[1]);
        vertices.push(Bezier_Curve_Points[2]);
        vertices.push(r); // Color r
        vertices.push(g); // Color g
        vertices.push(b); // Color b
    }

    // Second bezier curve with control points P4,P5,P6,P7

    for (t = 0; t < 1.01; t += 0.01) {
        var Bezier_Curve_Points = new Array(3);

        Bezier_Curve_Points = Bezier_Curve(P3, P4, P5, P6, t);
        vertices.push(Bezier_Curve_Points[0]);
        vertices.push(Bezier_Curve_Points[1]);
        vertices.push(Bezier_Curve_Points[2]);
        vertices.push(r1); // Color r
        vertices.push(g1); // Color g
        vertices.push(b1); // Color b
    }
}



// Taken from Matsuda and Lea Example and modified according to the program.
// I take no credit whatsoever.
// Register the event handler

function compute_New_Control_Point(ev, viewProjectionMatrix) {
    var x = ev.clientX,
        y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    var normalized_coordinates_x;
    var normalized_coordinates_y;
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        // If Clicked position is inside the <canvas>, update the selected surface
        // Converting from Screen coordinates to canvas coordinates as discussed in the class.
        var canvas_x = (x - rect.left) / canvas.width * (rect.right - rect.left);
        var canvas_y = (y - rect.top) / canvas.height * (rect.bottom - rect.top);

        normalized_coordinates_x = 2.0 * (canvas_x / canvas.width) - 1;
        normalized_coordinates_y = 1 - 2.0 * (canvas_y / canvas.height);
        //  alert('x:'+ normalized_coordinates_x +'y' + normalized_coordinates_y); 

        viewProjectionMatrix.setInverseOf(viewProjectionMatrix);
        Point_3D = [normalized_coordinates_x, normalized_coordinates_y, 0.1, 1];
        Point_Clicked = new Vector4(Point_3D); 
        Point_Clicked = viewProjectionMatrix.multiplyVector4(Point_Clicked);
 

    }
    return Point_Clicked;

}


function myUp() {
    dragok = false;
    canvas.onmousemove = null;
}

function Check_If_ControlPointClicked(Point_Clicked) {
    var Point3D = new Array(4);
    Point3D = Point_Clicked.elements;
    dragok = true;
    if (lies_between(Point3D[0], P0[0]) && lies_between(Point3D[1], P0[1])) {
        //override the mousemove event
        canvas.onmousemove = function(ev) {
            myMove(ev, "0"); //update P0 to new position.
        }

    }

    if (lies_between(Point3D[0], P1[0]) && lies_between(Point3D[1], P1[1])) {
        //override the mousemove event
        canvas.onmousemove = function(ev) {
            myMove(ev, "1"); //update P1 to new position.
        }
    }

    if (lies_between(Point3D[0], P2[0]) && lies_between(Point3D[1], P2[1])) {
        //override the mousemove event
        canvas.onmousemove = function(ev) {
            myMove(ev, "2"); //update P2to new position.
        }
    }

    if (lies_between(Point3D[0], P3[0]) && lies_between(Point3D[1], P3[1])) {
        //override the mousemove event
        canvas.onmousemove = function(ev) {
            myMove(ev, "3"); //update P3 to new position.
        }
    }

    if (lies_between(Point3D[0], P4[0]) && lies_between(Point3D[1], P4[1])) {
        //override the mousemove event
        canvas.onmousemove = function(ev) {
            myMove(ev, "4"); //update P4 to new position.
        }
    }

    if (lies_between(Point3D[0], P5[0]) && lies_between(Point3D[1], P5[1])) {
        //override the mousemove event
        canvas.onmousemove = function(ev) {
            myMove(ev, "5"); //update P5 to new position.
        }
    }

    if (lies_between(Point3D[0], P6[0]) && lies_between(Point3D[1], P6[1])) {
        //override the mousemove event
        canvas.onmousemove = function(ev) {
            myMove(ev, "6"); //update P6 to new position.
        }
    }

    return false;

}

// Determine if the point x lies in range of y
function lies_between(x, y) {

    var min, max;

    min = y - 0.05;
    max = y + 0.05;

    if (x >= min && x < max)
        return true;

    return false;
}



/********Bezier curve function**************************/

function Bezier_Curve(P0, P1, P2, P3, t) {
    var point = new Array(3);
    var i;
    for (i = 0; i < 3; i++)
        point[i] = Math.pow((1 - t), 3) * P0[i] + 3 * Math.pow((1 - t), 2) * t * P1[i] + 3 * (1 - t) * Math.pow(t, 2) * P2[i] + Math.pow(t, 3) * P3[i]; // Bezier curve formulae

    return point; // return the generated point.
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



/*************Draw Function **********************************************/

function Draw(ModelMatrix, u_ModelMatrix, vertexBuffer, n) {

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
    gl.vertexAttribPointer(vertColor, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT); // offset is 3 since first 3 are vertex coordinates and last 3 are color(r,g,b)
    gl.enableVertexAttribArray(vertColor);
    gl.uniformMatrix4fv(u_ModelMatrix, false, ModelMatrix.elements);
    gl.drawArrays(gl.LINE_STRIP, 0, n);
}

// Compute the vertices of the points 

var Lattitudes = 7;
var Longitudes = 7;
var latIndex = 0,
    longIndex;

function compute_Vertices_Of_Control_Points(radius, P, sphere_vertices_of_P, tag) {
    var theta, sinTheta, cosTheta, sinPhi, cosPhi, x, y, z, phi;

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
            sphere_vertices_of_P.push(radius * x + P[0]);
            sphere_vertices_of_P.push(radius * y + P[1]);
            sphere_vertices_of_P.push(radius * z + P[2]);
            if (tag == 'P0') { // Red for P0
                sphere_vertices_of_P.push(1);
                sphere_vertices_of_P.push(0);
                sphere_vertices_of_P.push(0);
            }
            if (tag == "P1") { // Green for P1
                sphere_vertices_of_P.push(0);
                sphere_vertices_of_P.push(1);
                sphere_vertices_of_P.push(0);
            }
            if (tag == "P2") { // Blue for P2
                sphere_vertices_of_P.push(0);
                sphere_vertices_of_P.push(0);
                sphere_vertices_of_P.push(1);
            }
            if (tag == "P3") { // Yellow for P3
                sphere_vertices_of_P.push(1);
                sphere_vertices_of_P.push(1);
                sphere_vertices_of_P.push(0);
            }
            if (tag == "P4") { // Purple for P4
                sphere_vertices_of_P.push(1);
                sphere_vertices_of_P.push(0);
                sphere_vertices_of_P.push(1);
            }
            if (tag == "P5") { // Cyan for P5
                sphere_vertices_of_P.push(0);
                sphere_vertices_of_P.push(1);
                sphere_vertices_of_P.push(1);
            }
            if (tag == "P6") { // White for P6
                sphere_vertices_of_P.push(1);
                sphere_vertices_of_P.push(1);
                sphere_vertices_of_P.push(1);
            }
        }
    }
}
// Since Trignometric functions in Javascript take arguments in terms of Radians
function toRadians(angle) {
    return angle * (Math.PI / 180);
}

//Indices of the spheres (control points).
function compute_indices_Of_Control_Points() {
    var first, second;
    for (latIndex = 0; latIndex < Lattitudes; latIndex++) {
        for (longIndex = 0; longIndex < Longitudes; longIndex++) {
            first = (latIndex * (Longitudes + 1)) + longIndex;
            second = first + Longitudes + 1;
            indices_Of_Control_Points.push(first);
            indices_Of_Control_Points.push(second);
            indices_Of_Control_Points.push(first + 1);
            indices_Of_Control_Points.push(second);
            indices_Of_Control_Points.push(second + 1);
            indices_Of_Control_Points.push(first + 1);
        }
    }
}


function Draw_Control_Points(ModelMatrix, u_ModelMatrix, vertexBuffer, indexBuffer) {


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
    gl.drawElements(gl.TRIANGLES, (indices_Of_Control_Points.length), gl.UNSIGNED_SHORT, 0);

}

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
//gets random values:used by colors.
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

// sets control points to default.
function reset() {

    P0 = [0.65, -0.1, 0.2];
    P1 = [0.5, 0.4, 0.2];
    P2 = [0, 0.8, 0.2];
    P3 = [0, 0, 0.2];
    P4 = [0, -0.5, 0.2];
    P5 = [-0.2, -0.2, 0.2];
    P6 = [-0.8, 0.5, 0.2];
    modelMatrix.setIdentity();
    drawEverything();
}

// Tangent passes through 3 points P2,P3 & P4
function compute_vertices_of_tangent() {
    vertices_of_tangent.push(P2[0]);
    vertices_of_tangent.push(P2[1]);
    vertices_of_tangent.push(P2[2]);
    vertices_of_tangent.push(1);
    vertices_of_tangent.push(1);
    vertices_of_tangent.push(1);
    vertices_of_tangent.push(P3[0]);
    vertices_of_tangent.push(P3[1]);
    vertices_of_tangent.push(P3[2]);
    vertices_of_tangent.push(1);
    vertices_of_tangent.push(1);
    vertices_of_tangent.push(1);
    vertices_of_tangent.push(P4[0]);
    vertices_of_tangent.push(P4[1]);
    vertices_of_tangent.push(P4[2]);
    vertices_of_tangent.push(1);
    vertices_of_tangent.push(1);
    vertices_of_tangent.push(1);
}

// change color
function change() {

    r = getRandomArbitrary(0, 1);
    g = getRandomArbitrary(0, 1);
    b = getRandomArbitrary(0, 1);
    r1 = getRandomArbitrary(0, 1);
    g1 = getRandomArbitrary(0, 1);
    b1 = getRandomArbitrary(0, 1);
    drawEverything();

}

// Update HTML file
function updateUI() {
    document.getElementById("angle_x").innerHTML = toDegrees(angle_x);
    document.getElementById("angle_y").innerHTML = toDegrees(angle_y);
    document.getElementById("angle_z").innerHTML = toDegrees(angle_z);
}
// For display
function toDegrees(angle) {
    return angle * (360 / Math.PI);
}