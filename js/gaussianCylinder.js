/*
 * Represent a Gaussian sphere. This is a Gaussian surface, it will be drawn but will
 * have no effect on the field. The cylinder of radius r and height h icentered at
 * (x, y, z) and rotated by psi about the y axis, then by theta about the x axis, and
 * finally by phi about the z axis. 
 */
"use strict";
function gaussianCylinder(x_, y_, z_, h_, r_, psi_, theta_, phi_)
{
  var height;
  var modelViewMatrix;
  var phi;
  var psi;
  var radius;
  var theta;
  var vertexRegistry;
  var x0;
  var y0;
  var z0;

  height = h_;
  phi    = phi_;
  psi    = psi_;
  radius = r_;
  theta  = theta_;
  x0     = x_;
  y0     = y_;
  z0     = z_;

  this.setVertexRegistry   = function(registry)
  {
    vertexRegistry = registry;
  }

  this.getVertexRegistry   = function()
  {
    return vertexRegistry;
  }

  this.setX               = function(x_)
  {
    x0 = x_;
    return this;
  }
  this.getX               = function()
  {
    return x0;
  }

  this.setY               = function(y_)
  {
    y0 = y_;
    return this;
  }

  this.getY               = function()
  {
    return y0;
  }

  this.setZ               = function(z_)
  {
    z0 = z_;
    return this;
  }
  this.getZ               = function()
  {
    return z0;
  }

  this.setRadius          = function(r_)
  {
    radius = r_;
    return this;
  }
  this.getRadius          = function()
  {
    return radius;
  }

  this.setHeight          = function(h_)
  {
    height = h_;
    return this;
  }

  this.getHeight          = function()
  {
    return height;
  }

  this.setTheta           = function(t_)
  {
    theta = t_;
    return this;
  }

  this.getheta            = function()
  {
    return theta;
  }

  this.setPhi             = function(p_)
  {
    phi = p_;
    return this;
  }

  this.getPhi             = function()
  {
    return phi;
  }

  this.getModelView       = function()
  {
    var cphi;
    var cpsi;
    var ctheta;
    var sphi;
    var spsi;
    var stheta;

    if (modelViewMatrix == null)
    {
      stheta              = Math.sin(theta);
      ctheta              = Math.cos(theta);
      sphi                = Math.sin(phi);
      cphi                = Math.cos(phi);
      spsi                = Math.sin(psi);
      cpsi                = Math.cos(psi);

      modelViewMatrix     = new Float32Array(16);
      // Column 1:
      modelViewMatrix[0]  = radius*(cphi*cpsi - sphi*spsi*stheta);
      modelViewMatrix[1]  = radius*(cphi*spsi*stheta + cpsi*sphi);
      modelViewMatrix[2]  = -radius*ctheta*spsi;
      modelViewMatrix[3]  = 0.0;
      // Column 2:
      modelViewMatrix[4]  = -radius*ctheta*sphi;
      modelViewMatrix[5]  = radius*cphi*ctheta;
      modelViewMatrix[6]  = radius*stheta;
      modelViewMatrix[7]  = 0.0;
      // Column 3:
      modelViewMatrix[8]  = height*(cphi*spsi + cpsi*sphi*stheta);
      modelViewMatrix[9]  = height*(sphi*spsi - cphi*cpsi*stheta);
      modelViewMatrix[10] = height*cpsi*ctheta;
      modelViewMatrix[11] = 0.0;
      // Column 4:
      modelViewMatrix[12] = x0;
      modelViewMatrix[13] = y0;
      modelViewMatrix[14] = z0;
      modelViewMatrix[15] = 1.0;
    }
    return modelViewMatrix;
  }

  this.setupBuffers               = function(gl,                  surfaceProgram,       surfaceGeometryBuffer,
		                             surfaceNormalBuffer, surfaceIndicesBuffer)
  {
    bindBuffer(gl, surfaceGeometryBuffer, 'position', surfaceProgram, 3, gl.FLOAT, 0, 0);
    bindBuffer(gl, surfaceNormalBuffer,   'normal',   surfaceProgram, 3, gl.FLOAT, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surfaceIndicesBuffer);
  }

  this.drawCap               = function(gl, nindices, offset)
  {
    gl.drawElements(gl.TRIANGLE_FAN, nindices, gl.UNSIGNED_SHORT, offset*2);
  }

  this.drawSide              = function(gl, nindices, offset)
  {
    gl.drawElements(gl.TRIANGLE_STRIP, nindices, gl.UNSIGNED_SHORT, offset*2);

  }

  this.render                = function(gl, surfaceProgram)
  {
    var nindices;
    var nsegments;
    var vertices;

    gl.disable(gl.CULL_FACE);
    vertices  = this.getVertexBuffers(gl, vertexRegistry);
    //loadUniform4f(gl, surfaceProgram, "surfaceColor",      0.5, 0.5, 0.5, 0.2);
    loadUniformMatrix4fv(gl, surfaceProgram, "modelViewMatrix", this.getModelView());
    // For an n segmented cylinder, nindices=4n+6
    nindices  = this.getNindices();
    nsegments = (nindices-6)/4;

    this.setupBuffers(gl,               surfaceProgram,   vertices.vertices,
                      vertices.normals, vertices.indices);

    // This should draw the top cap
    this.drawCap(gl, nsegments+2, 0);

    // This should draw the side, connecting the caps
    this.drawSide(gl, 2*nsegments+2, nsegments+2);

    // This should draw the bottom cap
    this.drawCap(gl, nsegments+2, 3*nsegments+4);

    gl.enable(gl.CULL_FACE);
  }
}

/**
 * gaussianCylinder extends the GeometryEngine.cylinder class.
 */
gaussianCylinder.prototype = new GeometryEngine.cylinder();