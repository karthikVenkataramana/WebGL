/************************************************************************************************************************
       Author:  Karthik Venkataramana Pemmaraju 
         Date:  11/02/2016 - 11/07/2016
 Description:   This program displays graph of the following bivariate function over domain [0,1] x [0,1]
                z= f(x,y) = .5*exp[-.04*sqrt((80x-40)^2 + (90y-45)^2)] *
                       cos[0.15*sqrt((80x-40)^2 + (90y-45)^2)]
                The program uses orthographic projection. Also, used is depth buffer for hidden surface removal.
                Directional and ambient lighting is used to lit the scenes and the program also employs Gouraud shading. 
************************************************************************************************************************/
"use strict";

/************ Vertex shader Text************************/

/* Assigns the vertex color to the fragments.
 * Updates the position of vertex by multiplying current position 
 * with the transformation Matrix.
 */

var VSHADER_SOURCE = [
    'attribute vec4 a_Position;',
    'attribute vec4 a_Color;',
    'attribute vec4 a_Normal;',
    'uniform mat4 u_MvpMatrix;',
    'uniform mat4 u_ModelMatrix;', // Model matrix
    'uniform mat4 u_NormalMatrix;', // Transformation matrix of the normal
    'uniform vec3 u_LightColor;', // Light color
    'uniform vec3 u_LightPosition;', // Position of the light source (in the world coordinate system)
    'uniform vec3 u_AmbientLight;', // Ambient light color
    'varying vec4 v_Color;',
    'void main() {',
    'gl_PointSize= 3.0;',
    '  gl_Position = u_MvpMatrix * a_Position;',
    // Recalculate the normal based on the model matrix and make its length 1.
    '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));',
    // Calculate world coordinate of vertex
    '  vec4 vertexPosition = u_ModelMatrix * a_Position;',
    // Calculate the light direction and make it 1.0 in length
    '  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));',
    // The dot product of the light direction and the normal
    '  float nDotL = max(dot(lightDirection, normal), 0.0);',
    // Calculate the color due to diffuse reflection
    '  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;',
    // Calculate the color due to ambient reflection
    '  vec3 ambient = u_AmbientLight * a_Color.rgb;',
    //  Add the surface colors due to diffuse reflection and ambient reflection
    '  v_Color = vec4(diffuse + ambient, a_Color.a);',
    '}'
].join('\n');

// Fragment shader program
var FSHADER_SOURCE = [
    '#ifdef GL_ES',
    'precision mediump float;',
    '#endif',
    'varying vec4 v_Color;',
    'void main() {',
    '  gl_FragColor = v_Color;',
    '}'
].join('\n');


/**********************Global variables ***************************/
var k = 100;
var nv = 3 * Math.pow(k + 1, 2);
var nt = 2 * 3 * Math.pow(k, 2);
var h;
var vertices = [];
var colors = [];
var normals = [];
var indices = [];
var temp;
var eyeX = 0;
var eyeY = 0;
var eyeZ = -15;
var angle_x = 0;
var angle_y = 0;
var angle_z = 0;
var ortho_left = -2.5;
var ortho_right = 2;
var ortho_top = 2;
var ortho_bottom = -2;
var n, gl;
var xRotationMatrix = new Matrix4();
var yRotationMatrix = new Matrix4();
var zRotationMatrix = new Matrix4();
var u_MvpMatrix, u_ModelMatrix, u_NormalMatrix;
var modelMatrix = new Matrix4(); // Model matrix
var mvpMatrix = new Matrix4(); // Model view projection matrix
var normalMatrix = new Matrix4(); // Transformation matrix for normals
var vpMatrix = new Matrix4();

/******************* Main Function *********************************/

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');
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

    // Set the vertex coordinates, the color and the normal
    n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    if (!u_LightColor || !u_LightPosition || !u_AmbientLight) {
        console.log('Failed to get the storage location');
        return;
    }
    // View projection matrix
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightPosition, 5.3, 4.0, 3.5);
    // Set the ambient light
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
    gl.clearColor(0, 0, 0, 1);

    // Get the location of mvp and normal matrices.
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

    // Handle Key press event
    document.onkeydown = function(ev) {
        keydown(ev, n, gl, modelMatrix, vpMatrix, mvpMatrix, normalMatrix);
    }

    draw(n, gl, modelMatrix, vpMatrix, mvpMatrix, normalMatrix);

}

/****************************Draw Function ******************************/

function draw(n, gl, modelMatrix, vpMatrix, mvpMatrix, normalMatrix) {


    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements); //set model matrix elements.
    vpMatrix.setOrtho(ortho_left, ortho_right, ortho_bottom, ortho_top, 1, 100);
    vpMatrix.lookAt(eyeX, eyeY, eyeZ, 0, 0, 0, 0, 1, 0);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);
    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Draw the graph
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
    updateUI(); // update HTML lables
}


function initArrayBuffer(gl, attribute, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    return true;
}


function initVertexBuffers(gl) {
    computeValuesForGraph();
    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', new Float32Array(vertices), 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', new Float32Array(colors), 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(normals), 3, gl.FLOAT)) return -1;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return indices.length;
}


/******** Function that computes the values of vertices, indices, normals and colors ******************/

function computeValuesForGraph() {

    h = 1.0 / k;
    var indv, indt, i, j, h, z;
    var x, y, i;

    /****Initialize arrays with zero ******/
    for (i = 0; i < nv; i++) {
        vertices.push(0);
        normals.push(0);
        colors.push(1);
    }

    for (i = 0; i < nt; i++) {
        indices.push(0);
    }


    /*************** Step 1: Store Vertices *************************/

    indv = 0;
    var temp = 0.0;
    for (j = 0; j <= k; j++) {
        y = j * h;
        for (i = 0; i <= k; i++) {
            x = i * h;
            temp = Math.sqrt(Math.pow((80 * x - 40), 2) + Math.pow((90 * y - 45), 2));
            z = 0.5 * Math.exp(-0.04 * temp) * (Math.cos(0.15 * temp));
            // temp = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
            // z = (1- (temp*temp)) * Math.exp (-0.5 * (temp*temp));
            vertices[indv + 0] = x;
            vertices[indv + 1] = y;
            vertices[indv + 2] = z;
            if (z > 0) {
                colors[indv] = 1;
                colors[indv + 1] = 0;
                colors[indv + 2] = 0;
            } else {
                colors[indv] = 0;
                colors[indv + 1] = 1;
                colors[indv + 2] = 0;

            }


            indv = indv + 3;

        }
    }

    /*************** Step 2: Compute Indices of the vertices *************************/
    indt = 0;
    for (j = 1; j <= k; j++) {
        for (i = 1; i <= k; i++) {
            indv = j * (k + 1) + i;
            // indv indexes the upper right corner of a cell.

            indices[indt] = indv - k - 2;
            indices[indt + 1] = indv - k - 1;
            indices[indt + 2] = indv;
            indices[indt + 3] = indv - k - 2;
            indices[indt + 4] = indv;
            indices[indt + 5] = indv - 1;
            indt = indt + 6;
        }
    }

    /*************** Step 3a: Intialize normals to zero *************************/

    for (indv = 0; indv < nv; indv += 3) {
        normals[indv] = 0;
        normals[indv + 1] = 0;
        normals[indv + 2] = 0;
    }

    /**** Step 3b: Find normal vectors of adjacent triangles, take average and add to the vertex normal. ******/
    var a = 0,
        b = 0,
        c = 0;
    var div;
    var i1, i2, i3, x1, y1, z1, x2, y2, z2, x3, y3, z3;
    for (indt = 0; indt < (indices.length) / 3; indt++) {
        i1 = indices[3 * indt];
        i2 = indices[3 * indt + 1];
        i3 = indices[3 * indt + 2];
        x1 = vertices[3 * i1];
        y1 = vertices[3 * i1 + 1];
        z1 = vertices[3 * i1 + 2];
        x2 = vertices[3 * i2];
        y2 = vertices[3 * i2 + 1];
        z2 = vertices[3 * i2 + 2];
        x3 = vertices[3 * i3];
        y3 = vertices[3 * i3 + 1];
        z3 = vertices[3 * i3 + 2];

        a = (y2 - y1) * (z3 - z1) - (z2 - z1) * (y3 - y1);
        b = (z2 - z1) * (x3 - x1) - (x2 - x1) * (z3 - z1);
        c = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
        div = Math.sqrt(Math.pow(a, 2), Math.pow(b, 2), Math.pow(c, 2));

        if (div == 0) {
            a = 0;
            b = 0;
            c = 0;
        } else {
            div = 1 / div;
            a = a * div;
            b = b * div;
            c = c * div;
        }

        normals[3 * i1 + 0] += a;
        normals[3 * i1 + 1] += b;
        normals[3 * i1 + 2] += c;
        normals[3 * i2 + 0] += a;
        normals[3 * i2 + 1] += b;
        normals[3 * i2 + 2] += c;
        normals[3 * i3 + 0] += a;
        normals[3 * i3 + 1] += b;
        normals[3 * i3 + 2] += c;
    }

    /****************Step 3c:  Normalize the vertex normals to unit vectors. ************************/
    for (indv = 0; indv < (vertices.length) / 3; indv++) {
        a = normals[3 * indv + 0];
        b = normals[3 * indv + 1];
        c = normals[3 * indv + 2];

        div = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2) + Math.pow(c, 2));

        //console.log(normals[indv][0]);        
        if (div == 0) {
            a = b = c = 0;
        } else {
            div = 1 / div;
            a = a * div;
            b = b * div;
            c = c * div;
        }
        normals[3 * indv + 0] = a;
        normals[3 * indv + 1] = b;
        normals[3 * indv + 2] = c;

    }
}

function reset() {
    location.reload();
}

function toDegrees(angle) {
    return angle * (360 / Math.PI);
}


function keydown(ev, n, gl, modelMatrix, vpMatrix, mvpMatrix, normalMatrix) {
    switch (ev.keyCode) {
        case 39:
            eyeX += 0.5;
            break; // The right arrow key was pressed
        case 37:
            eyeX -= 0.5;
            break; // The left arrow key was pressed
        case 38:
            eyeY += 0.5;
            break; // The up arrow key was pressed
        case 40:
            eyeY -= 0.5;
            break; // The down arrow key was pressed
        case 191:
            eyeZ += 0.5;
            break; // The up arrow key was pressed
        case 220:
            eyeZ -= 0.5;
            break; // The down arrow key was pressed
        case 88:
            angle_x += 0.005;
            xRotationMatrix.setRotate(angle_x, 1, 0, 0);
            modelMatrix.multiply(xRotationMatrix, modelMatrix);
            break; //x key is pressed
        case 65:
            angle_x -= 0.005;
            xRotationMatrix.setRotate(-angle_x, 1, 0, 0);
            modelMatrix.multiply(xRotationMatrix, modelMatrix);
            break; //a key is pressed
        case 89:
            angle_y += 0.005;
            yRotationMatrix.setRotate(angle_y, 0, 1, 0);
            modelMatrix.multiply(yRotationMatrix, modelMatrix);
            break; //y key is pressed
        case 66:
            angle_y -= 0.005;
            yRotationMatrix.setRotate(-angle_y, 0, 1, 0);
            modelMatrix.multiply(yRotationMatrix, modelMatrix);
            break; //b key is pressed
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
        case 18:
 			ortho_left -= 0.05;
            ortho_right += 0.05;
            ortho_top += 0.05;
            ortho_bottom -= 0.05;
            break;
            // Alt key is pressed
        case 16:
            ortho_left += 0.05;
            ortho_right -= 0.05;
            ortho_top -= 0.05;
            ortho_bottom += 0.05;
            break;
            //shift key is pressed
        default:
            return; // Prevent the unnecessary drawing
    }
    draw(n, gl, modelMatrix, vpMatrix, mvpMatrix, normalMatrix);

}

function updateUI() {
    document.getElementById("angle_x").innerHTML = toDegrees(angle_x);
    document.getElementById("angle_y").innerHTML = toDegrees(angle_y);
    document.getElementById("angle_z").innerHTML = toDegrees(angle_z);
    document.getElementById("look_at_x").innerHTML = eyeX;
    document.getElementById("look_at_y").innerHTML = eyeY;
    document.getElementById("look_at_z").innerHTML = eyeZ;
}