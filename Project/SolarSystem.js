var canvas;
var gl;

// Number of subdivides for recursively creating sphere
var medLowComplexity = 2;
var medHighComplexity = 3;
var highComplexity = 4;
var index = 0;
var currIndex = 0;
// Indices within the vertex and normal buffers to locate which parts of those buffers
// refer to which object
var sunEndIndex;
var p1EndIndex;
var p2EndIndex;
var p3EndIndex;
var p4EndIndex;

var pointsArray = [];
var normalsArray = [];

var vColor;
var vColorLoc;

// Types of shading for sphere generating function
var FLAT = 0;
var SMOOTH = 1;

// Types of shading for sphere rendering function
var GOURAUD = 1;
var PHONG = 2;

// Tetrahedron vertices for recursively creating sphere
var va = vec4(0.0, 0.0, -1.0, 1.0);
var vb = vec4(0.0, 0.942809, 0.333333, 1.0);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1.0);
var vd = vec4(0.816497, -0.471405, 0.333333, 1.0);

/* Information for sun and planets */
var sunX = 0.0;
var sunY = 0.0;
var sunZ = 10.0;
var sunLoc = vec3(sunX, sunY, sunZ);
var sunDiam = 20;
var sunSpinSpeed = 2;
var sunSpinTheta = 0;

var moonOrbitRadius = 10;
var p1OrbitRadius = 35;
var p2OrbitRadius = 55;
var p3OrbitRadius = 77;
var p4OrbitRadius = 100;

var moonDiam = 2.0;
var p1Diam = 3.5;
var p2Diam = 4.5;
var p3Diam = 6.1;
var p4Diam = 5.9;

// Speed of rotation about the sun
var moonSpeed = 3.5;
var p1Speed = 1.59;
var p2Speed = 1.15;
var p3Speed = 0.81;
var p4Speed = 0.47;

// Current angle about the sun
var moonOrbitTheta = 0;
var p1OrbitTheta = 0;
var p2OrbitTheta = 180;
var p3OrbitTheta = 40;
var p4OrbitTheta = 230;

// Light information for all solar system objects
var lightPosition = vec4(sunX, sunY, sunZ, 1.0);
var lightAmbient = vec4(0.0, 0.1, 0.25, 1.0);
var lightDiffuse = vec4(1.0, 0.75, 0.1, 1.0);
var lightSpecular = vec4(1.0, 0.8, 0.1, 1.0);

var p1Ambient = vec4(1.0, 1.0, 1.0, 1.0);
var p1Diffuse = vec4(1.0, 1.0, 1.0, 1.0);
var p1Specular = vec4(1.0, 1.0, 1.0, 1.0);
var p1Shininess = 10.0;

var p2Ambient = vec4(0.0, 1.0, 0.0, 1.0);
var p2Diffuse = vec4(0.0, 1.0, 0.5, 1.0);
var p2Specular = vec4(0.5, 0.5, 0.5, 1.0);
var p2Shininess = 12.0;

var p3Ambient = vec4(0.0, 0.7, 1.0, 1.0);
var p3Diffuse = vec4(0.0, 0.3, 1.0, 1.0);
var p3Specular = vec4(0.0, 0.7, 1.0, 1.0);
var p3Shininess = 8.0;

var p4Ambient = vec4(0.6, 0.3, 0.0, 1.0);
var p4Diffuse = vec4(0.65, 0.3, 0.0, 1.0);
var p4Specular = vec4(0.0, 0.0, 0.0, 0.0);
var p4Shininess = 0.0;

// Moon colors
var moonAmbient = vec4(0.5, 0.0, 0.3, 1.0);
var moonDiffuse = vec4(0.7, 0.0, 0.5, 1.0);
var moonSpecular = vec4(0.7, 0.0, 1.0, 1.0);
var moonShininess = 20.0;

// Toggle attach/detach to green (2nd) planet
var toggleAttach = false;

var isSun = false;
var isSunLoc;
var shadingType;
var shadingTypeLoc;
var ambientProduct, diffuseProduct, specularProduct;
var ambientProductLoc, diffuseProductLoc, specularProductLoc;
var lightPositionLoc;
var shininessLoc;

// Perspective projection information
var maxFovy = 120.0
var aspect = 960/540;
var fovy = 45.0;
var near = 0.3;
var far = 2000.0;

// Initial "camera location" to be able to view all cubes
var initCamX = 0.0;
var initCamY = -60.0;
var initCamZ = -180.0;

// Amount to translate and rotate camera on user input
var translateAmt = 1;
var rotateAmt = 1;
var currRotation = 0;

// Axes
var xAxis = vec3(1, 0, 0);
var yAxis = vec3(0, 1, 0);
var zAxis = vec3(0, 0, 1);

// Matrices
var viewMatrixLoc, modelViewMatrixLoc, projectionMatrixLoc;
var transMatrix;
var viewMatrix;
var modelViewMatrix;
var projectionMatrix;

// Functions to create a sphere
function addTriangleToBuffers(a, b, c, shading)
{
	// Points
	pointsArray.push(a);
	pointsArray.push(b);
	pointsArray.push(c);
	
	// Normals
	if (shading == FLAT)
	{
		var v1 = subtract(b, a);
		var v2 = subtract(c, a);
		var normal = normalize(cross(v2, v1));
		
		for (var i = 0; i < 3; i++)
			normalsArray.push(normal[0], normal[1], normal[2], 0.0);
	}
	else
	{
		normalsArray.push(a[0], a[1], a[2], 0.0);
		normalsArray.push(b[0], b[1], b[2], 0.0);
		normalsArray.push(c[0], c[1], c[2], 0.0);
	}
	
	index += 3;
}

function divideTriangle(a, b, c, n, shading)
{
    if (n > 0)
	{  
		var ab = mix(a, b, 0.5);
		var ac = mix(a, c, 0.5);
		var bc = mix(b, c, 0.5);

		ab = normalize(ab, true);
		ac = normalize(ac, true);
		bc = normalize(bc, true);

		divideTriangle(a, ab, ac, n - 1, shading);
		divideTriangle(ab, b, bc, n - 1, shading);
		divideTriangle(bc, c, ac, n - 1, shading);
		divideTriangle(ab, bc, ac, n - 1, shading);
    }
    else
	{ 
		addTriangleToBuffers(a, b, c, shading);
    }	
}

function generateSphere(a, b, c, d, numSubdivides, shading)
{
    divideTriangle(a, b, c, numSubdivides, shading);
    divideTriangle(d, c, b, numSubdivides, shading);
    divideTriangle(a, d, b, numSubdivides, shading);
    divideTriangle(a, c, d, numSubdivides, shading);
}

window.onload = function init()
{
	canvas = document.getElementById("gl-canvas");
	
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { alert("WebGL isn't available"); }
	
	// Set WebGL viewport
	gl.viewport(0, 0, canvas.width, canvas.height);
	// Set color to clear to to be black
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	
	// Enable z-buffer
	gl.enable(gl.DEPTH_TEST);
	
	// Initialize shaders
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	// Set initial view position
	viewMatrix = mult(rotate(30, xAxis), translate(initCamX, initCamY, initCamZ));

	/*  Determine and store sphere vertices and normals 
		for sun and planets in corresponding buffers 	*/
	// Sun
	generateSphere(va, vb, vc, vd, medHighComplexity, PHONG);
	sunEndIndex = index;
	// Planet 1
	generateSphere(va, vb, vc, vd, medLowComplexity, FLAT);
	p1EndIndex = index;
	// Planet 2
	generateSphere(va, vb, vc, vd, medHighComplexity, GOURAUD);
	p2EndIndex = index;
	// Planet 3
	generateSphere(va, vb, vc, vd, highComplexity, PHONG);
	p3EndIndex = index;
	// Planet 4
	generateSphere(va, vb, vc, vd, medHighComplexity, GOURAUD);
	p4EndIndex = index;
	
	// Initialize normal buffer
	var nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
	
	var vNormal = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);
	
	// Initialize vertex buffer
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	// Get locations of uniform variables in shader.
	vColorLoc = gl.getUniformLocation(program, "vColor");
	viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	ambientProductLoc = gl.getUniformLocation(program, "ambientProduct");
	diffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
	specularProductLoc = gl.getUniformLocation(program, "specularProduct");
	shininessLoc = gl.getUniformLocation(program, "shininess");
	lightPositionLoc = gl.getUniformLocation(program, "lightPosition");
	isSunLoc = gl.getUniformLocation(program, "isSun");
	shadingTypeLoc = gl.getUniformLocation(program, "shadingType");
	
	// Get user input
	window.onkeydown = function(event)
	{
		var key = String.fromCharCode(event.keyCode);
		switch (key)
		{
			// Move left
			case 'A':
				viewMatrix = mult(translate(translateAmt, 0, 0), viewMatrix);
				break;
			// Move right
			case 'D':
				viewMatrix = mult(translate(-translateAmt, 0, 0), viewMatrix);
				break;
			// Move forwards
			case 'W':
				viewMatrix = mult(translate(0, 0, translateAmt), viewMatrix);
				break;
			// Move backwards
			case 'S':
				viewMatrix = mult(translate(0, 0, -translateAmt), viewMatrix);
				break;
			// Reset view to starting position
			case 'R':
				viewMatrix = mult(rotate(30, xAxis), translate(initCamX, initCamY, initCamZ));
				fovy = 45.0;
				currRotation = 0;
				toggleAttach = false;
				break;
			// Make horizontal FOV narrower
			case 'Q':
				fovy -= 1;
				if (fovy <= 10)
					fovy = 10;
				break;
			// Make horizontal FOV wider
			case 'E':
				fovy += 1;
				if (fovy > maxFovy)
					fovy = maxFovy;
				break;
			// Attach/detach to the green (2nd) planet
			case 'F':
				if (toggleAttach)
				{
					toggleAttach = false;
					viewMatrix = mult(rotate(30, xAxis), 
									  translate(initCamX, initCamY, initCamZ));
					currRotation = 0;
					fovy = 45.0;
				}
				else
				{
					toggleAttach = true;
					currRotation = 180;
				}
				break;
		}
		switch (event.keyCode)
		{
			// Move up
			case 38: // UP_ARROW
				viewMatrix = mult(translate(0, -translateAmt, 0), viewMatrix);
				break;
			// Move down
			case 40: // DOWN_ARROW
				viewMatrix = mult(translate(0, translateAmt, 0), viewMatrix);
				break;
			// Heading (azimuth) left
			case 37: // LEFT_ARROW
				viewMatrix = mult(rotate(-rotateAmt, yAxis), viewMatrix);
				currRotation = (currRotation - rotateAmt) % 360;
				break;
			// Heading (azimuth) right
			case 39: // RIGHT_ARROW
				viewMatrix = mult(rotate(rotateAmt, yAxis), viewMatrix);
				currRotation = (currRotation + rotateAmt) % 360;
				break;
		}
	};	
	
	render();
}

function render()
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// If we are attached to the green (2nd) planet, update view accordingly
	if (toggleAttach)
	{		
		viewMatrix = translate(0, 0, -sunZ);
		viewMatrix = mult(rotate(-p2OrbitTheta + 190, yAxis), viewMatrix);
		viewMatrix = mult(translate(0, -2, p2OrbitRadius), viewMatrix);
		viewMatrix = mult(rotate(currRotation, yAxis), viewMatrix);
	}
	
	// Obtain appropriate matrices
	// The model view matrix is initialized and altered (by user input) above.
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
	projectionMatrix = perspective(fovy, aspect, near, far);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));	
	
	currIndex = 0;
	// Render sun
	isSun = true; // Flag to tell shaders not to include lighting effects.
	gl.uniform1i(isSunLoc, isSun);
	vColor = lightSpecular; // Set color of sun to the same color as the specular lighting
	gl.uniform4fv(vColorLoc, vColor);
	// Have the sun spin to give it a more interesting, non-static look
	sunSpinTheta = (sunSpinTheta + sunSpinSpeed) % 360;
	// Scale the sun to be the largest body in the solar system
	transMatrix = mult(rotate(sunSpinTheta, vec3(0.2, 1, 0.1)), scaleM(sunDiam/2, sunDiam/2, sunDiam/2));
	// Translate it to its location (not the origin)
	transMatrix = mult(translate(sunLoc), transMatrix);
	modelViewMatrix = mult(viewMatrix, transMatrix);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	for (currIndex; currIndex < sunEndIndex; currIndex += 3)
		gl.drawArrays(gl.TRIANGLES, currIndex, 3);
	
	// Render planets
	isSun = false;
	gl.uniform1i(isSunLoc, isSun);
	
	renderPlanet(p1Ambient, p1Diffuse, p1Specular, p1Shininess, 
				 p1Speed, p1OrbitRadius, p1Diam, p1EndIndex );

	renderPlanet(p2Ambient, p2Diffuse, p2Specular, p2Shininess, 
				 p2Speed, p2OrbitRadius, p2Diam, p2EndIndex );
				 
	renderPlanet(p3Ambient, p3Diffuse, p3Specular, p3Shininess, 
				 p3Speed, p3OrbitRadius, p3Diam, p3EndIndex );

	renderPlanet(p4Ambient, p4Diffuse, p4Specular, p4Shininess, 
				 p4Speed, p4OrbitRadius, p4Diam, index );
				 
	// Render moon
	// Get lighting matrix products
	ambientProduct = mult(lightAmbient, moonAmbient);
	diffuseProduct = mult(lightDiffuse, moonDiffuse);
	specularProduct = mult(lightSpecular, moonSpecular);
	gl.uniform4fv(ambientProductLoc, flatten(ambientProduct));
	gl.uniform4fv(diffuseProductLoc, flatten(diffuseProduct));
	gl.uniform4fv(specularProductLoc, flatten(specularProduct));
	gl.uniform4fv(lightPositionLoc, flatten(lightPosition));
	gl.uniform1f(shininessLoc, moonShininess);
	// Have the moon spin about its axis for fun
	moonOrbitTheta = (moonOrbitTheta + moonSpeed) % 360;
	transMatrix = mult(rotate(moonOrbitTheta, yAxis), scaleM(moonDiam/2, moonDiam/2, moonDiam/2));
	// Translate the moon to its "moon coordinates"
	transMatrix = mult(translate(0, 0, moonOrbitRadius), transMatrix);
	// Rotate the moon about its planet
	transMatrix = mult(rotate(moonOrbitTheta, yAxis), transMatrix);
	// Translate the moon to its host planet's coordinates
	transMatrix = mult(translate(0, 0, p4OrbitRadius), transMatrix);
	// Take into account to host planet's orbit around the sun
	transMatrix = mult(rotate(p4OrbitTheta, yAxis), transMatrix);
	// Take into account the sun's position
	transMatrix = mult(translate(sunX, sunY, sunZ), transMatrix);
	modelViewMatrix = mult(viewMatrix, transMatrix);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	for (currIndex = p3EndIndex; currIndex < p4EndIndex; currIndex += 3)
		gl.drawArrays(gl.TRIANGLES, currIndex, 3);	

	window.requestAnimFrame(render);
}

function renderPlanet(	pAmbient, pDiffuse, pSpecular, pShininess, 
						pSpeed, pOrbitRadius, pDiam, endIndex )
{
	// Get lighting matrix products
	ambientProduct = mult(lightAmbient, pAmbient);
	diffuseProduct = mult(lightDiffuse, pDiffuse);
	specularProduct = mult(lightSpecular, pSpecular);
	gl.uniform4fv(ambientProductLoc, flatten(ambientProduct));
	gl.uniform4fv(diffuseProductLoc, flatten(diffuseProduct));
	gl.uniform4fv(specularProductLoc, flatten(specularProduct));	
	gl.uniform4fv(lightPositionLoc, flatten(lightPosition));
	gl.uniform1f(shininessLoc, pShininess);
	// Matrices
	var pOrbitTheta;
	if (endIndex == p1EndIndex)
	{
		shadingType = FLAT;
		// Update planet's angle about the sun
		p1OrbitTheta = (p1OrbitTheta + pSpeed) % 360;
		pOrbitTheta = p1OrbitTheta;
		// Have the planet spin about its own access for fun
		transMatrix = mult(rotate(pOrbitTheta, yAxis), scaleM(pDiam/2, pDiam/2, pDiam/2));
	}
	else if (endIndex == p2EndIndex)
	{
		shadingType = GOURAUD;
		p2OrbitTheta = (p2OrbitTheta + pSpeed) % 360;
		pOrbitTheta = p2OrbitTheta;
		transMatrix = mult(rotate(pOrbitTheta, yAxis), scaleM(pDiam/2, pDiam/2, pDiam/2));
	}
	else if (endIndex == p3EndIndex)
	{
		shadingType = PHONG;
		p3OrbitTheta = (p3OrbitTheta + pSpeed) % 360;
		pOrbitTheta = p3OrbitTheta;
		transMatrix = mult(rotate(pOrbitTheta*5, yAxis), scaleM(pDiam/2, pDiam/2, pDiam/2));
	}
	else if (endIndex == p4EndIndex)
	{
		shadingType = GOURAUD;
		p4OrbitTheta = (p4OrbitTheta + pSpeed) % 360;
		pOrbitTheta = p4OrbitTheta;
		transMatrix = mult(rotate(pOrbitTheta*5, yAxis), scaleM(pDiam/2, pDiam/2, pDiam/2));
	}
	
	// Translate the planet to its radius
	transMatrix = mult(translate(0, 0, pOrbitRadius), transMatrix);
	// Update the planet's orbit
	transMatrix = mult(rotate(pOrbitTheta, yAxis), transMatrix);
	// Translate so that the sun is at the center of the orbit
	transMatrix = mult(translate(sunX, sunY, sunZ), transMatrix);
	modelViewMatrix = mult(viewMatrix, transMatrix);
	gl.uniform1i(shadingTypeLoc, shadingType);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	for (currIndex; currIndex < endIndex; currIndex += 3)
		gl.drawArrays(gl.TRIANGLES, currIndex, 3);
}

