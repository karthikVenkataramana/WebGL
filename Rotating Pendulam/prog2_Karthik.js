 /***************************************************************************************************
      Author: Karthik Venkataramana Pemmaraju 
        Date: 09/23/2016
 Description: This script creates a pendulum which is free to rotate through 360 degrees. The buttons
              can increase or decrease the Angular velocity of the rotating pendulam by a
              factor of 10 degrees. The "UI-Slider" can set Angular velocity to any arbitrary value.
              Use "Reset" button to set angular velocity to 45 degrees and "Stop" to set it to 0.
              Setting Angular velocity to a negative value causes the bob to rotate in reverse direction.

 ****************************************************************************************************/
 "use strict";


 /************ Vertex shader Text************************/

 /* Assigns the vertex color to the fragments.
  * Updates the position of vertex by multiplying current position 
  * with the transformation Matrix.
  * Sets point size to 5 pixels.
  */
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

 /* Takes the input color from Vertex Shader and sets it to the Fragment color.*/

 var FSHADER_SOURCE = [
     'precision mediump float;',
     'varying vec3 fragColor;',
     'void main() {',
     '  gl_FragColor = vec4(fragColor, 1.0);',
     '}'
 ].join('\n');




 /************Global Variables*********************************/

 // Rotation angle (degrees/second)
 var ANGLE_STEP = 45.0;

 // Radius of the Bob (Hexagon)
 var radius = 0.1;

 // Vertices of the Bob taken in anti-clockwise direction.
 var Zero = [],
     One = [],
     Two = [],
     Three = [],
     Four = [],
     Five = [],
     Six = [],
     Seven = [];



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

     // Compute the vertices of the blue hexagon.
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
     // Set the Current rotation angle to be 0
     var currentAngle = 0.0;

     // Model matrix for Rigid wire
     var modelMatrixForLine = new Matrix4();

     // Model matrix for the green Square
     var modelMatrixForSquare = new Matrix4();

     // Model matrix for the bob.
     var modelMatrixForBob = new Matrix4();

     // Start drawing
     var tick = function() {
         currentAngle = animate(currentAngle); // Update the rotation angle
         // Call the draw function to render objects to the screen 

         draw(gl, u_ModelMatrix, modelMatrixForSquare, 0, currentAngle); //outputs the square
         draw(gl, u_ModelMatrix, modelMatrixForLine, 1, currentAngle); // For Rigid wire
         draw(gl, u_ModelMatrix, modelMatrixForBob, 2, currentAngle); // For Pendulum Bob
         requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
     };


     tick();
 }


 /************Compute Hexagon vertices************************************/

 function computeVerticesOfBob() {

     var x = 0;
     var y = -0.8;

     // Center of the Hexagon 
     Zero = [0, -0.8];
     // To compute each vertex rotate the point by 60 degrees each time.
     One = [(x + (radius * (Math.cos(toRadians(0))))), (y + radius * (Math.sin(toRadians(0))))];
     Two = [(x + (radius * (Math.cos(toRadians(60))))), (y + radius * (Math.sin(toRadians(60))))];
     Three = [(x + (radius * (Math.cos(toRadians(120))))), (y + radius * (Math.sin(toRadians(120))))];
     Four = [(x + (radius * (Math.cos(toRadians(180))))), (y + radius * (Math.sin(toRadians(180))))];
     Five = [(x + (radius * (Math.cos(toRadians(240))))), (y + radius * (Math.sin(toRadians(240))))];
     Six = [(x + (radius * (Math.cos(toRadians(300))))), (y + radius * (Math.sin(toRadians(300))))];
     Seven = One;
 }


 /************Draw function************************************/
 function draw(gl, u_ModelMatrix, modelMatrix, i, currentAngle) {

     // Sets values for a 4x4 floating point vector matrix into a uniform location as a matrix or a matrix array.
     gl.uniformMatrix4fv(
         u_ModelMatrix, //storage location of the matrix.
         false, //Transpose.
         modelMatrix.elements //Pass on Array of values.
     );

     // Draw the  Green Square using 2 triangles (6 vertices). 
     if (i == 0) {
         modelMatrix.setIdentity();
         gl.drawArrays(gl.TRIANGLES, 0, 6);
     }

     // Rotate the rigid wire with current Angle and render it to the screen.
     if (i == 1) {
         modelMatrix.setRotate(currentAngle, 0, 0, 1);
         modelMatrix.translate(0, 0, 0);
         gl.drawArrays(
             gl.LINES,
             6, //Skip First 6 vertices
             2 // Draw a Line with 2 points
         );

     }

     // Draw the bob using Triangle_Fan with 6 Triangles (18 vertices).
     if (i == 2) {

         modelMatrix.setRotate(currentAngle, 0, 0, 1);
         modelMatrix.translate(0, 0, 0);
         gl.drawArrays(gl.TRIANGLE_FAN, 8, 18);

         // return;
     }
 }


 /************Intialize the vertex buffers************************************/

 function initVertexBuffers(gl) {
     var vertices = [

         // (x,y,r,g,b) values for the square 
         0.05, -0.05, 0, 1, 0, 0.05, 0.05, 0, 1, 0, -0.05, 0.05, 0, 1, 0, -0.05, 0.05, 0, 1, 0, -0.05, -0.05, 0, 1, 0, 0.05, -0.05, 0, 1, 0,

         // (x,y,r,g,b) values for the Line
         0, 0, 1, 0, 0,
         0, -0.8, 1, 0, 0,

         // (x,y,r,g,b) values for the Hexagon 
         Zero[0], Zero[1], 0, 0, 1, One[0], One[1], 0, 0, 1, Two[0], Two[1], 0, 0, 1,
         Zero[0], Zero[1], 0, 0, 1, Two[0], Two[1], 0, 0, 1, Three[0], Three[1], 0, 0, 1,
         Zero[0], Zero[1], 0, 0, 1, Three[0], Three[1], 0, 0, 1, Four[0], Four[1], 0, 0, 1,
         Zero[0], Zero[1], 0, 0, 1, Four[0], Four[1], 0, 0, 1, Five[0], Five[1], 0, 0, 1,
         Zero[0], Zero[1], 0, 0, 1, Five[0], Five[1], 0, 0, 1, Six[0], Six[1], 0, 0, 1,
         Zero[0], Zero[1], 0, 0, 1, Six[0], Six[1], 0, 0, 1, Seven[0], Seven[1], 0, 0, 1

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
     // Calculate the elapsed time
     var now = Date.now();
     var elapsed = now - g_last;
     g_last = now;
     // Update the current rotation angle (adjusted by the elapsed time)
     var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
     return newAngle %= 360;
 }

 /***** Triggers when the user clicks the UP button *********/
 function up() {
     ANGLE_STEP += 10;
     updateSlider();
 }

 /***** Triggers when the user clicks the DOWN button *********/

 function down() {
     ANGLE_STEP -= 10;
     updateSlider();
 }

 /************JQuery function to display slider************************/

 $(function() {
     $("#slider-vertical").slider({
         orientation: "vertical",
         range: "min",
         min: -2200,
         max: 2200,
         slide: function(event, ui) {

             ANGLE_STEP = ui.value;
             $("#amount").val(ui.value + "\xB0");
         }
     });
 });
console.log(ANGLE_STEP);
 function reset() {
     ANGLE_STEP = 45;
     updateSlider();
 }

 function stop() {
     ANGLE_STEP = 0;
     updateSlider();

 }

 function updateSlider() {
     var value = $("#slider-vertical").slider("option", "value");
     $("#amount").val(ANGLE_STEP + "\xB0");
     $("#slider-vertical").slider("option", "value", ANGLE_STEP);
 }

 // Since Trignometric functions in Javascript take arguments in terms of Radians
 function toRadians(angle) {
     return angle * (Math.PI / 180);
 }