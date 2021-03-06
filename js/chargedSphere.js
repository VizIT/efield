"use strict";
/**
 * A potentially hollow Charged sphere centered at (x,y,z) with
 * inner radius a and outer radius b. a may be zero indicating
 * a solid sphere.
 *
 * @constructor	
 * @param {number} Q_   The total charge contained in this distribution.
 * @param {number} rho_ The density of field lines in lines per unit charge.
 * @param {number} x_   The x coordinate of the center of the sphere.
 * @param {number} y_   The y coordinate of the center of the sphere.
 * @param {number} z_   The z coordinate of the center of the sphere.
 * @param {number} a_   The inner radius of the distribution. 0 for a solid sphere.
 * @param {number} b_   The outer radius of the distribution.
 */
function chargedSphere(Q_, rho_, x_, y_, z_, a_, b_)
{
  var a;
  var a2;
  var a3;
  var b;
  var b3;
  var modelViewMatrix;
  var nindices;
  var pi;
  var Q;
  var rho;
  var vertexRegistry;
  var x0;
  var y0;
  var z0;

  nindices  = 0;
  pi        = 3.14159265359;

  a      = a_;
  a2     = a*a;
  a3     = a2*a;
  b      = b_;
  b3     = b*b*b;
  Q      = Q_;
  rho    = rho_;
  x0     = x_;
  y0     = y_;
  z0     = z_;

  this.setA               = function(a_)
  {
    a      = a_;
    a2     = a*a;
    a3     = a2*a;
  }

  this.getA               = function()
  {
    return a;
  }

  this.setB               = function(b_)
  {
    b      = b_;
    b3     = b*b*b;
  }

  this.getB               = function()
  {
    return b;
  }

  this.setNindices        = function(n)
  {
    nindices = n;
  }

  this.setVertexRegistry   = function(registry)
  {
    vertexRegistry = registry;
  }

  this.getVertexRegistry   = function()
  {
    return vertexRegistry;
  }

  /**
   * Compute the start points for field lines due to the presence of this charge.
   * 
   * TODO: make the start point distribution vary with r as the charge.
   * TODO: use a better distribution - this spiral is not so good to illustrate physics.
   */
  this.getStartPoints = function()
  {
    var nlines;
    var phi;
    var r;
    var s;
    var seedPoints;
    var sgn;
    var y;

    sgn        = Q > 0 ? 1 : Q < 0 ? -1 : 0;
    nlines     = Math.round(rho * Q * sgn);
    s          = 4*a / Math.sqrt(nlines);
    phi        = 0; // Or inject variablility with: Math.random() * Math.PI / 2;
    seedPoints = new Array();

    for (var i=0; i<nlines; i++)
    {
      y   = (-1 + 2 * i / (nlines-1)) * a;
      r   = Math.sqrt(a*a - y*y) + .2*(b-a);
      phi = phi + s / r;
      seedPoints.push(new Array(Math.cos(phi)*r + x0,
                                y               + y0,
                                Math.sin(phi)*r + z0,
                                sgn));
    }

    return seedPoints;
  }

  /**
   * Compute the electric field at any point (x,y,x) due to this
   * charge distribution.
   */
  this.getField           = function(x, y, z)
  {
      var deltaX;
      var deltaY;
      var deltaZ;

      // Magnitude of the field vector
      var f;
      // The field vector
      var field   = new Array(0, 0, 0);
      var r;
      var r2;

      deltaX      = x - x0;
      deltaY      = y - y0;
      deltaZ      = z - z0;

      r2          = deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ;
      if (r2 <= a2)
      {
        return field;
      }
      r           = Math.sqrt(r2);
      if (r >=a && r<b)
      {
        // We are in the interior of the charge distribution.
        f         = Q * (r-(a3/r2))/(b3-a3); // = (4*pi/3)*(r-(a3/r2)) * rho;
      }
      else
      {
        // Outside the charge distribution the field is as a point charge
        f         = Q/r2; // = (4*pi/3)*(b3-a3) * rho /r2;
      }

      // Similar triangles allows easy distribution of the field into vector components.
      field[0]    = f * deltaX / r;
      field[1]    = f * deltaY / r;
      field[2]    = f * deltaZ / r;

      return field;
  }

  this.getModelView       = function(scale)
  {
    if (typeof scale === "undefined")
    {
      scale = 1.0;
    }
    if (modelViewMatrix == null)
    {
      modelViewMatrix     = new Float32Array(16);
      modelViewMatrix[0]  = scale;
      modelViewMatrix[1]  = 0.0;
      modelViewMatrix[2]  = 0.0;
      modelViewMatrix[3]  = 0.0;
      modelViewMatrix[4]  = 0.0;
      modelViewMatrix[5]  = scale;
      modelViewMatrix[6]  = 0.0;
      modelViewMatrix[7]  = 0.0;
      modelViewMatrix[8]  = 0.0;
      modelViewMatrix[9]  = 0.0;
      modelViewMatrix[10] = scale;
      modelViewMatrix[11] = 0.0;
      modelViewMatrix[12] = x0;
      modelViewMatrix[13] = y0;
      modelViewMatrix[14] = z0;
      modelViewMatrix[15] = 1.0;
    }
    else
    {
      modelViewMatrix[0]  = scale;
      modelViewMatrix[5]  = scale;
      modelViewMatrix[10] = scale;
    }
    return modelViewMatrix;
  }

  this.drawFullSurface      = function(gl,                  surfaceProgram,       surfaceGeometryBuffer,
                                       surfaceNormalBuffer, surfaceIndicesBuffer, nindices)
  {
    bindBuffer(gl, surfaceGeometryBuffer, 'position', surfaceProgram, 3, gl.FLOAT, 0, 0);
    bindBuffer(gl, surfaceNormalBuffer,   'normal',   surfaceProgram, 3, gl.FLOAT, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surfaceIndicesBuffer);

    gl.drawElements(gl.TRIANGLES, nindices, gl.UNSIGNED_SHORT, 0);
  }

  this.render             = function(gl, surfaceProgram)
  {
    var intrinsicRadius;
    var r;
    var scale;
    var vertices;

    // This is the actual sized used in the default spherical geometry.
    intrinsicRadius = this.getIntrinsicRadius();
    vertices        = this.getVertexBuffers(gl, vertexRegistry);

    // RGBA positive (blue) or negative (red) charge
    if (Q > 0)
    {
      loadUniform4f(gl, surfaceProgram, "surfaceColor",      0.05, 0.05, 0.8, 0.20);
    }
    else if (Q < 0)
    {
      loadUniform4f(gl, surfaceProgram, "surfaceColor",      0.8, 0.05, 0.05, 0.20);
    }
    else
    {
      loadUniform4f(gl, surfaceProgram, "surfaceColor",      0.5, 0.5, 0.5, 0.2);
    }

    nindices = this.getNindices();

    gl.cullFace(gl.FRONT);
    for (r=b; r>=a; r--)
    {
      scale =r/intrinsicRadius;
      loadUniformMatrix4fv(gl, surfaceProgram, "modelViewMatrix", this.getModelView(scale));
      this.drawFullSurface(gl,               surfaceProgram,   vertices.vertices,
                           vertices.normals, vertices.indices, nindices);
    }
    
    gl.cullFace(gl.BACK);
    for(r=a; r<=b; r++)
    {
      scale =r/intrinsicRadius;
      this.drawFullSurface(gl,                surfaceProgram,   vertices.vertices,
                            vertices.normals, vertices.indices, nindices);
      loadUniformMatrix4fv(gl, surfaceProgram, "modelViewMatrix", this.getModelView(scale));
    }
    
  }
}

/**
 * chargedSphere extends the GeometryEngine.sphere class.
 */
chargedSphere.prototype = new GeometryEngine.sphere();

