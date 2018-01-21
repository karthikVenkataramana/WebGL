 // Vertex shader program
var VSHADER_SOURCE =
  'precision mediump float;\n'+             //set to medium precision
  'attribute vec2 a_Position;\n' +          // x,y position attribute
  'attribute vec3 vertColor;\n'+            // Color attribute
  'varying vec3 fragColor;\n'+              // Output the color to Fragment Shader
  'void main() {\n' +
  'fragColor= vertColor;\n'+
  '  gl_Position = vec4(a_Position,0,1);\n' + 
  '  gl_PointSize = 1.0;\n' +               // Set Point Size to 1
  '}\n'; 

// Fragment shader program
var FSHADER_SOURCE = 
  'precision mediump float;\n'+
  'varying vec3 fragColor;\n'+                //Takes the color from Vertex Shader and inputs to Fragment shader
  'void main() {\n' +
  '  gl_FragColor = vec4(fragColor, 1.0);\n' +
  '}\n';
var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');  

  }
var vertices=
[
-1,-1,                   // v1 (x,y) coordinates
0, 1.0, 0.0,             //v1 (R,G,B) 
0,1,                    // v2 (x,y) coordinates
1, 0, 0.0,             //v2 (R,G,B)
1,-1,                   //v3 (x,y) coordinates
0.0, 0.0, 1,           //v3 (R,G,B)
];
 
function main() {
 
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) 
  {
    console.log('Failed to intialize shaders.');
    return;
  }
var i,vRandom;
var p0= [0,0];                 //Initial point P0
var p=p0; 
var n=40000;                  // Loop through n times
for (i = 0; i < n-1; i++) 

{ 
var j= Math.floor(Math.random()*3+0);
 if(j==0) vRandom=[-1,-1,0, 1.0, 0.0];            // Assign Vrandom to Vertex1(v1) (x,y,R,G,B)
 if(j==1) vRandom=[0,1,1, 0, 0.0];              // Assign to v2
 if(j==2) vRandom=[1,-1,  0.0, 0.0, 1];;
 p[0]=(vRandom[0]+p[0])/2;                      //mid point of x coordinate
 p[1]=(vRandom[1]+p[1])/2;                       //mid point of y coordinate

// push the newly added vertex to the list of vertices
  vertices.push(p[0]);                          //x
  vertices.push(p[1]);                          //y
  vertices.push(vRandom[2]);                    //r
  vertices.push(vRandom[3]);                    //g
  vertices.push(vRandom[4]);                    //b
 }
var vertexId=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,vertexId);                   //Bind the buffer.
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),gl.STATIC_DRAW);        // Convert to 32-bit because Javascript uses 64-bit whereas GPU uses 32- bit

  // Get the storage location of a_Position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  // Get the storage location of vertColor
  var vertColor = gl.getAttribLocation(gl.program, 'vertColor');
  if (vertColor < 0) {
    console.log('Failed to get the storage location of vertColor');
    return;
  }
  gl.vertexAttribPointer(a_Position,2,gl.FLOAT,false, 5*Float32Array.BYTES_PER_ELEMENT,0);
  gl.vertexAttribPointer(vertColor,
  	3, //3 attributes for color
  	gl.FLOAT,
  	false,
  	5*Float32Array.BYTES_PER_ELEMENT, // Total elements per vertex
  	2*Float32Array.BYTES_PER_ELEMENT) // Off set;
  
  gl.enableVertexAttribArray(a_Position);
  gl.enableVertexAttribArray(vertColor);
render(); 
}

function render()
{

  // Specify the color for clearing <canvas>
  gl.clearColor(0,0,0,1);
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
      // Draw Array with the available vertices
  gl.drawArrays(gl.POINTS, 0, vertices.length/5); 
}