/*
 * Represent a Gaussian sphere. This is a Gaussian surface, it will be drawn but will
 * have no effect on the field. The sphere or radius r is sentered at (x, y, z).
 */
function gaussianSphere(x_, y_, z_, r_)
{
  var modelViewMatrix;
  var radius;
  var vertexRegistry;
  var x0;
  var y0;
  var z0;

  radius = r_;
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

  this.render      = function(gl, surfaceProgram)
  {
    var intrinsicRadius;
    var vertices;

    intrinsicRadius = this.getIntrinsicRadius();
    vertices        = this.getVertexBuffers(gl, vertexRegistry);

    loadUniformMatrix4fv(gl, surfaceProgram, "modelViewMatrix", this.getModelView(radius/intrinsicRadius));

    gl.cullFace(gl.FRONT);
    this.drawFullSurface(gl,                surfaceProgram,    vertices.vertices, vertices.normals,
                         vertices.indices, this.getNindices());

    gl.cullFace(gl.BACK);
    this.drawFullSurface(gl,                surfaceProgram,    vertices.vertices, vertices.normals,
                         vertices.indices, this.getNindices());
  }
}

/**
 * gaussianSphere extends the GeometryEngine.sphere class.
 */
gaussianSphere.prototype = new GeometryEngine.sphere();


