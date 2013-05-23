"use strict";
/**
 * JavaScript object for rendering charges and their associated field
 * lines.
 *
 * @param {HTMLCanvasElement} drawingSurface_ An HTML canvas into which we will render the model.
 * @param {string}            [home_ = .]     A string giving the path to the efield home directory if not the directory the page is loaded from.
 *
 * @constructor
 */
function fieldRenderer(drawingSurface_, home_)
{
  /** Global variables within this field renderer. */

  // Hold points describing lines for the electic field as drawn along the field lines.
  var arrowBuffers;
  // Vertex array buffer for charges and positions.
  var chargeBuffer;
  // A list of charge distributions.
  var chargeDistributions;
  // This program draws the representation of the not quite point charges.
  var chargeImageProgram;
  // A generic container capable of containing an arbitrary number of charges.
  var charges;
  // A Float32Array with the charges and their position, good to feed to a
  // vertex array buffer for a sharde.
  var charges32Array;
  var drawingSurface;
  // Vertex buffer for flux directional arrows
  var fluxDirectionBuffers;
  // The flux lines as loaded into the graphics card as a vertex array buffer.
  var fluxLineBuffers;
  // This program draws the flux lines starting on the charges.
  var fluxLineProgram;
  // The WebGL context.
  var gl;
  // Gaussian surfces - closed 3D surfaces.
  var gaussianSurfaces;
  // Do not rerender in response to an event until after efield is initialized.  
  var initialized;
  // Wait for the setup to finish before rendering the first frame.
  var latch;
  // Model-View matrix for use in all programs.
  var modelViewMatrix;
  var normalMatrix;
  var eventHandler;
  var home;
  var negativeChargeIndex;
  // Texture (image) used to represent a negative charge.
  var negativeChargeTexture;
  // Texture index for the positive charge image.
  var positiveChargeIndex;
  // Texture (image) used to represent a posative charge.
  var positiveChargeTexture;
  var projectionMatrix;
  // Scale sets the bounds used in the projection matrix.
  var scale;
  // Start points for tracing field lines
  var startPoints;
  // Program for drawing surfaces - Gaussian for now, eventually charged surfaces.
  var surfaceProgram;
  var vertexRegistry;

  chargeDistributions    = new Array();
  charges                = new Charges();
  drawingSurface         = drawingSurface_;
  gaussianSurfaces       = new Array();
  // Use ./ if home_ is undefined
  home                   = typeof home_ == 'undefined' ? "./" : home_;
  initialized            = false;
  startPoints            = new Array();
  vertexRegistry         = new GeometryEngine.VertexRegistry();

  this.addGaussianSurface    = function(surface)
  {
    surface.setVertexRegistry(vertexRegistry);
    gaussianSurfaces.push(surface);
    return this;
  }

  this.addChargeDistribution = function(distribution)
  {
    distribution.setVertexRegistry(vertexRegistry);
    chargeDistributions.push(distribution);
    return this;
  }

  this.addStartPoint         = function(x_, y_, z_, sgn_)
  {
    startPoints.push(new Array(x_, y_, z_, sgn_));
    return this;
  }

  this.addCharge             = function(charge_)
  {
    charges.addCharge(charge_);
    return this;
  }

  this.getContext            = function()
  {
    return gl;
  }

  this.createSurfaceProgram  = function(gl)
  {
    var fragmentShader;
    var fragmentShaderSource;
    var surfaceProgram;
    var vertexShader;
    var vertexShaderSource;

    // This vertex shader has a lot of inputs.
    // normal,  an attribute giving the outward pointing normal to the surface
    // position an attribute giving the position of this vertex.
    // ambientLighting universal non-directional lighting
    // directionalLighting a vector indicating the direction for directional lighting.
    //                     Directional lighting helps bring out the shape of surfaces
    // directionalColor the color for the directional lighting
    vertexShaderSource = "attribute vec3 normal;"
                       + "attribute vec3 position;"
                       + ""
                       + "uniform   vec3 ambientLighting;"
                       + "uniform   vec3 directionalLighting;"
                       + "uniform   vec3 directionalColor;"
                       + "uniform   mat4 modelViewMatrix;"
                       + "uniform   mat4 globalModelViewMatrix;"
                       + "uniform   mat3 normalMatrix;"
                       + "uniform   mat4 projectionMatrix;"
                       + ""
                       + "varying   vec3 lighting;"
                       + ""
                       + "void main(void)"
                       + "{"
                       + "  gl_Position = projectionMatrix * globalModelViewMatrix * modelViewMatrix * vec4(position, 1.0);"
                       + ""
                       + "  vec3  transformedNormal         = normalMatrix * normal;"
                       + "  float directionalLightWeighting = max(dot(transformedNormal, directionalLighting), 0.0);"
                       + "  lighting                        = ambientLighting + directionalColor * directionalLightWeighting;"
                       + "}";


    fragmentShaderSource = "precision mediump float;"
                         + ""
                         + "uniform vec4 surfaceColor;"
                         + "varying vec3 lighting;"
                         + ""
                         + "void main(void)"
                         + "{"
                         + "  gl_FragColor = vec4(surfaceColor.rgb * lighting, surfaceColor.a);"
                         + "}";

    // Here we create and compile the vertex shader. This will compile to code for your specific
    // graphics card.
    var vertexShader    = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);

    // And then compile the fragment shader too.
    var fragmentShader  = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    // As you might expect, we are going to run some code, so we need a program.
    surfaceProgram      = createProgram(gl, vertexShader, fragmentShader);

    return surfaceProgram;
  }

  this.createFluxLineProgram = function(gl)
  {
    var fluxLineProgram;
    var vertexShaderSource   = "attribute vec3 position;"
                               + "uniform   mat4 modelViewMatrix;"
                               + "uniform   mat4 projectionMatrix;"
                               + ""
                               + "void main()"
                               + "{"
                               + "    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);"
                               + "}";

    // For now use a constant color for the field lines. Later consider color derived from field strength.
    var fragmentShaderSource = "precision mediump float;"
                               + ""
                               + "void main()"
                               + "{"
                               + "    gl_FragColor = vec4(0.8,0.3,0.3,1);"
                               + "}";

    // Here we create and compile the vertex shader. This will compile to code for your specific
    // graphics card.
    var vertexShader    = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);

    // And then compile the fragment shader too.
    var fragmentShader  = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
            
    // As you might expect, we are going to run some code, so we need a program.
    fluxLineProgram     = createProgram(gl, vertexShader, fragmentShader);

    return fluxLineProgram;
  }

  this.createChargeProgram = function(gl)
  {
    var chargeProgram;
    // gl_PointSize causes each point to be rendered as an nxn texture.
    var vertexShaderSource   = "precision highp float;"
                               + "attribute vec3  position;"
                               + "attribute float charge;"
                               + "varying   float vCharge;"
                               + "uniform   mat4  modelViewMatrix;"
                               + "uniform   mat4  projectionMatrix;"
                               + ""
                               + "void main()"
                               + "{"
                               + "    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1);"
                               + "    gl_PointSize = 16.0;"
                               + "    vCharge      = charge;"
                               + "}";
 
    // Note the use of gl_PointCoord for the texture coordinate.
    var fragmentShaderSource =   "precision lowp float;"
                               + "varying float     vCharge;"
                               + "uniform sampler2D positiveChargeSampler;"
                               + "uniform sampler2D negativeChargeSampler;"
                               + ""
                               + "vec4   textureColor;"
                               + ""
                               + " void main()"
                               + " {"
                               + "   if (vCharge > 0.0)"
                               + "   {"
                               + "       textureColor = texture2D(positiveChargeSampler, gl_PointCoord);"
                               + "   }"
                               + "   else"
                               + "   {"
                               + "       textureColor = texture2D(negativeChargeSampler, gl_PointCoord);"
                               + "   }"
                               + ""
                               + "   if (textureColor.a > 0.5)"
                               + "   {"
                               + "       gl_FragColor = textureColor;"
                               + "   }"
                               + "   else"
                               + "   {"
                               + "       discard;"
                               + "   }"
                              + " }";

    // Here we create and compile the vertex shader. This will compile to code for your specific
    // graphics card.
    var vertexShader    = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);

    // And then compile the fragment shader too.
    var fragmentShader  = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
            
    // As you might expect, we are going to run some code, so we need a program.
    chargeProgram     = createProgram(gl, vertexShader, fragmentShader);

    return chargeProgram;
  }

  /**
   * Create a 4N element Float32Array, where N is the number of charges. There are three elements
   * for the position of the charge, and one for the magnitude.
   */
  this.makeChargesArray = function(charges)
  {
    var charge;
    var chargesArray;
    var ncharges;
    var offset;
    var position;
    var stride;
    var theCharges;
     
    ncharges     = charges.getCount();
    chargesArray = new Float32Array(4*ncharges);
    theCharges   = charges.getCharges();
    stride       = 4;

    for(var i=0; i<ncharges; i++)
    {
      charge                 = theCharges[i];
      position               = charge.getPosition();
      offset                 = 4*i;
      chargesArray[offset]   = position[0];
      chargesArray[offset+1] = position[1];
      chargesArray[offset+2] = position[2];
      chargesArray[offset+3] = charge.getCharge();
    }
    return chargesArray;
  }

  this.drawCharges = function(gl,                    chargeImageProgram,    modelViewMatrix,
                              projectionMatrix,      chargeBuffer,          ncharges,
                              positiveChargeTexture, positiveChargeIndex,   negativeChargeTexture,
                              negativeChargeIndex)
  {
    // Start with drawing the charges.
    gl.useProgram(chargeImageProgram);

    loadUniformMatrix4fv(gl, chargeImageProgram, "modelViewMatrix",  modelViewMatrix);
    loadUniformMatrix4fv(gl, chargeImageProgram, "projectionMatrix", projectionMatrix);

    // Charge buffer positions to the position attribute
    // Stride of 16 because there is an extra float for the charge
    bindBuffer(gl, chargeBuffer, 'position', chargeImageProgram, 3, gl.FLOAT, 16, 0);
    // First Q is after first position, 12 bytes into the array.
    bindBuffer(gl, chargeBuffer, 'charge'  , chargeImageProgram, 1, gl.FLOAT, 16, 12);

    bindTexture(gl,                  chargeImageProgram,      positiveChargeTexture,
                positiveChargeIndex, "positiveChargeSampler");
    bindTexture(gl,                  chargeImageProgram,      negativeChargeTexture,
                negativeChargeIndex, "negativeChargeSampler");

    gl.drawArrays(gl.POINTS, 0, ncharges);
  }
            
  this.drawFluxlines = function(gl,               fluxLineProgram, projectionMatrix,
                                modelViewMatrix,  charges,         startPoints,
                                fluxLineBuffers,  directionBuffers)
  {
    var nlines;
    var startPoint;

    // Make this the currently active program - note that when we draw charges we will
    // need multiple programs. Possibly another one for arrows as well.
    gl.useProgram(fluxLineProgram);
    gl.lineWidth(1);
                 
    loadUniformMatrix4fv(gl, fluxLineProgram, "modelViewMatrix",  modelViewMatrix);
    loadUniformMatrix4fv(gl, fluxLineProgram, "projectionMatrix", projectionMatrix);
                 
    nlines = fluxLineBuffers.length;
                 
    for(var i=0; i<nlines; i++)
    {
      startPoint = startPoints[i];
      // Bind the buffer to the positon attribute
      bindBuffer(gl, fluxLineBuffers[i], 'position', fluxLineProgram, 3, gl.FLOAT, 12, 0);
      gl.drawArrays(gl.LINE_STRIP, 0, startPoint[4]);
      bindBuffer(gl, directionBuffers[i], 'position', fluxLineProgram, 3, gl.FLOAT, 12, 0);
      gl.drawArrays(gl.LINES, 0, startPoint[5]);
    }
  }

  this.drawChargeDistributions = function(gl,                     surfaceProgram,         projectionMatrix,
                                          globalModelViewMatrix,  normalMatrix,           distributions)
  {
    console.assert(surfaceProgram != null);
    var ndistributions;

    // Make this the currently active program
    gl.useProgram(surfaceProgram);

    loadUniformMatrix4fv(gl, surfaceProgram, "globalModelViewMatrix",  globalModelViewMatrix);
    loadUniformMatrix3fv(gl, surfaceProgram, "normalMatrix",           normalMatrix);
    loadUniformMatrix4fv(gl, surfaceProgram, "projectionMatrix",       projectionMatrix);

    loadUniform3f(gl, surfaceProgram, "ambientLighting",     0.3, 0.3, 0.3);
    loadUniform3f(gl, surfaceProgram, "directionalLighting", 1.0, 1.0, 1.0);
    loadUniform3f(gl, surfaceProgram, "directionalColor",    0.4, 0.4, 0.4);

    ndistributions = distributions.length;
    
    for (var i=0; i<ndistributions; i++)
    {
      distributions[i].render(gl, surfaceProgram)
    }
  }

  this.drawGaussianSurfaces = function(gl,                     surfaceProgram,         projectionMatrix,
                                       globalModelViewMatrix,  normalMatrix,           surfaces)
  {
    console.assert(surfaceProgram != null);
    var nsurfaces;

    // Make this the currently active program
    gl.useProgram(surfaceProgram);

    loadUniformMatrix4fv(gl, surfaceProgram, "globalModelViewMatrix",  globalModelViewMatrix);
    loadUniformMatrix3fv(gl, surfaceProgram, "normalMatrix",           normalMatrix);
    loadUniformMatrix4fv(gl, surfaceProgram, "projectionMatrix",       projectionMatrix);

    // RGBA for an off white translucent surface.
    loadUniform4f(gl, surfaceProgram, "surfaceColor",        0.5, 0.5, 0.5, 0.5);
    loadUniform3f(gl, surfaceProgram, "ambientLighting",     0.3, 0.3, 0.3);
    loadUniform3f(gl, surfaceProgram, "directionalLighting", 1.0, 1.0, 1.0);
    loadUniform3f(gl, surfaceProgram, "directionalColor",    0.4, 0.4, 0.4);

    nsurfaces = surfaces.length;
    
    for (var i=0; i<nsurfaces; i++)
    {
      surfaces[i].render(gl, surfaceProgram)
    }
  }

  this.setModelViewMatrix = function(modelViewMatrix_)
  {
    modelViewMatrix = modelViewMatrix_;
    // This straight copy of the modelView matrix into the normalMatrix
    // is only valid when we are restricted to translations and rotations.
    // Scale can be handled by renormalizing - the introduction of shearing
    // or non-uniform scaling would require the use of (M^-1)^T.
    // See gl-matrix's mat3.normalFromMat4
    normalMatrix    = extractRotationPart(modelViewMatrix, normalMatrix);
  }

  this.getModelViewMatrix = function()
  {
    return modelViewMatrix;
  }

  this.render = function()
  {
    // If setup isn't finished, just return - we can't possibly render a frame.
    if (!initialized)
    {
      return;
    }
    // Clear previous color and depth values - do this just before the first set of elements are drawn
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    this.drawCharges(gl,                    chargeImageProgram,    modelViewMatrix,
                     projectionMatrix,      chargeBuffer,          charges.getCount(),
                     positiveChargeTexture, positiveChargeIndex,   negativeChargeTexture,
                     negativeChargeIndex);

    this.drawFluxlines(gl,                  fluxLineProgram,      projectionMatrix,
                       modelViewMatrix,     charges,              startPoints,
                       fluxLineBuffers,     fluxDirectionBuffers);

    if (gaussianSurfaces.length > 0 || chargeDistributions.length > 0)
    {
      gl.enable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      if (chargeDistributions.length > 0)
      {
        this.drawChargeDistributions(gl,              surfaceProgram, projectionMatrix,
                                     modelViewMatrix, normalMatrix,   chargeDistributions);
      }

      gl.disable(gl.DEPTH_TEST);
      if (gaussianSurfaces.length > 0)
      {
	  this.drawGaussianSurfaces(gl,              surfaceProgram, projectionMatrix,
                                  modelViewMatrix, normalMatrix,   gaussianSurfaces);
      }
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
    }
  }

  this.zoomBy = function(delta)
  {
    scale += delta;
    if (scale < 15)
    {
      scale = 15;
    }
    // We project a scale x scale x scale cube into normalized device space.
    projectionMatrix     = generateOrthographicMatrix(scale, scale, -scale, scale);
    this.render();
  }

  this.allocateStorage = function()
  {
    var bytes = 1024*1024*1024*2;
    window.webkitStorageInfo.requestQuota(PERSISTENT, bytes, function(grantedBytes)
                                                             {
                                                               console.log('Got storage', grantedBytes);
                                                               window.webkitRequestFileSystem(PERSISTENT, grantedBytes, function (fs)
                                                                                                                        {
                                                                                                                          window.fs = fs;
                                                                                                                          console.log("Got filesystem");
                                                                                                                        });
                                                             }, function(e)
                                                                {
                                                                  console.log('Storage error', e);
                                                                });
  }

this.capture    = function(canvas)
{
  var name = Math.random(); // File name doesn't matter
  var image = canvas.toDataURL('image/png').slice(22);
  window.fs.root.getFile(name, {create: true}, function (entry)
                                               {
                                                 entry.createWriter(function (writer)
                                                 {
                                                   // Convert base64 to binary without UTF-8 mangling.
                                                   var data = atob(image);
                                                   var buf = new Uint8Array(data.length);
                                                   for (var i = 0; i < data.length; ++i)
                                                   {
                                                     buf[i] = data.charCodeAt(i);
                                                    }

                                                   // Write data
                                                   var blob = new Blob([buf], {});
                                                   writer.seek(0);
                                                   writer.write(blob);
  
                                                   console.log('Writing file', frames, blob.size);

                                                 });
                                               }, function () { console.log('File error', arguments); });
 }

 this.pausecomp = function(millis)
 {
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}

  this.initialRender = function()
  {
    var arrows;
    var line;
    var maxPoints;
    var nfluxLines;
    var points;
    var startPoint;

    maxPoints            = 5000;
    scale                = 150;
    // We project a scale x scale x scale cube into normalized device space.
    projectionMatrix     = generateOrthographicMatrix(scale, scale, -scale, scale);
            
    chargeImageProgram   = this.createChargeProgram(gl);
 
    charges32Array       = this.makeChargesArray(charges);
    chargeBuffer         = createBuffer(gl, charges32Array);

    fluxLineProgram      = this.createFluxLineProgram(gl);

    fluxLineBuffers      = new Array();
    fluxDirectionBuffers = new Array();

    // WebGL reads vertices directly from a Float32Array
    points               = new Float32Array(3*maxPoints);
    nfluxLines           = startPoints.length;
                
    line                 = new fluxLine(charges, chargeDistributions);
    line.setMaxPoints(5000);
    line.setDs(.3);
    line.setArrowSpacing(50);
    line.setArrowSize(3);
           
    for (var i=0; i<nfluxLines; i++)
    {
      startPoint         = startPoints[i];
      line.setStartX(startPoint[0]);
      line.setStartY(startPoint[1]);
      line.setStartZ(startPoint[2]);
      line.setSign(startPoint[3]);
                        
      line.trace();

      fluxLineBuffers[i]      = createBuffer(gl, line.getPoints());
      startPoint[4]           = line.getNpoints();
      fluxDirectionBuffers[i] = createBuffer(gl, line.getArrows());
      startPoint[5]           = line.getNarrows();
    }


    if (gaussianSurfaces.length > 0 || chargeDistributions.length > 0)
    {
      surfaceProgram = this.createSurfaceProgram(gl);
    }

    initialized = true;

    this.render();
    /*
    this.allocateStorage();
    this.capture(drawingSurface);
    */
    //this.pausecomp(2000);
    //var data = drawingSurface.toDataURL("image/png").replace("image/png", "image/octet-stream");
    //window.location.href = data;
    /*    var name = Math.random();
    drawingSurface.toDataURL();toBlob(function(blob) {
      saveAs(blob, "efield" + name);
      });*/
  }

  this.start = function()
  {
    latch.countDown();
  }


            
  // Allows initialRenderer to be invoked in the context of this.
  // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
  latch = new countdownLatch(3, this.initialRender.bind(this));

  gl                       = getGLContext(drawingSurface);

  if (gl)
  {
    negativeChargeIndex      = 0;
    negativeChargeTexture    = loadTexture(gl, home + "images/negativeCharge.png", negativeChargeIndex, latch.countDown);
    positiveChargeIndex      = 1;
    positiveChargeTexture    = loadTexture(gl, home + "images/positiveCharge.png", positiveChargeIndex, latch.countDown);
            
    // Initially an identity matrix, modified by movementEventHandler.
    modelViewMatrix = new Float32Array([1, 0, 0, 0,
                                        0, 1, 0, 0,
                                        0, 0, 1, 0,
                                        0, 0, 0, 1]);

    normalMatrix    = new Float32Array([1, 0, 0,
                                        0, 1, 0,
                                        0, 0, 1]);

    eventHandler             = new motionEventHandler(this);
    drawingSurface.addEventListener("mousewheel", eventHandler.handleMouseWheel.bind(eventHandler), false);
    drawingSurface.addEventListener("mousedown",  eventHandler.handleMouseDown.bind(eventHandler),  false);
    document.addEventListener("mouseup",          eventHandler.handleMouseUp.bind(eventHandler),    false);
    document.addEventListener("mousemove",        eventHandler.handleMouseMove.bind(eventHandler),  false);
    drawingSurface.addEventListener("touchstart", eventHandler.handleTouchStart.bind(eventHandler), false);
    drawingSurface.addEventListener("touchmove",  eventHandler.handleTouchMove.bind(eventHandler),  false);
    drawingSurface.addEventListener("touchend",   eventHandler.handleTouchEnd.bind(eventHandler),   false);
  }
}
