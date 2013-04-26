/**
 * A holder for data used to draw a surface. Provide n as the max size of arrays.
 * Reuse this object with each surface, so make n large enough to hold the largest
 * surface.
 */
function surfaceGeometry(n)
{
  var indices;
  var nMax;
  var nindices;
  var normals;
  var nvertices;
  var vertices;

  nindices  = 0;
  nvertices = 0;

  nMax      = n;
  
  vertices  = new Float32Array(n/2);
  indices   = new Uint16Array(n);
  normals   = new Float32Array(n/2);

  this.getNmax            = function()
  {
    return nMax;
  }

  this.setNindices        = function(n)
  {
    nindices = n;
  }

  this.getNindices        = function()
  {
    return nindices;
  }

  this.setNvertices       = function(n)
  {
    nvertices = n;
  }

  this.getNvertices       = function()
  {
    return nvertices;
  }

  this.setVerticies = function(geometry)
  {
    vertices = geometry;
  }

  this.getVertices = function()
  {
    return vertices;
  }

  this.setIndices  = function(indices)
  {
    indices = indices;
  }

  this.getIndices = function()
  {
    return indices;
  }

  this.setNormals = function(normals)
  {
   normals = normals;
  }

  this.getNormals = function()
  {
    return normals;
  }
}

/*
 * Represent a Gaussian sphere. This is a Gaussian surface, it will be drawn but will
 * have no effect on the field. The sphere or radius r is sentered at (x, y, z).
 */
function gaussianSphere(x_, y_, z_, r_)
{
  var nindices;
  var nlatitude;
  var nlongitude;
  var nvertices;
  var radius;
  var x0;
  var y0;
  var z0;

  nindices  = 0;
  nvertices = 0;

  radius = r_;
  x0     = x_;
  y0     = y_;
  z0     = z_;

  nlatitude  = 30;
  nlongitude = 30;

  this.setNindices        = function(n)
  {
    nindices = n;
  }

  this.getNindices        = function()
  {
    return nindices;
  }

  this.setNvertices       = function(n)
  {
    nvertices = n;
  }

  this.getNvertices       = function()
  {
    return nvertices;
  }

  this.computeSurface = function(surfaceGeometry)
  {
    var cosPhi;
    var cosTheta;
    var first;
    var indices;
    var latNumber;
    var longNumber;
    var normals;
    var offset;
    var phi;
    var second;
    var sinPhi;
    var sinTheta;
    var theta;
    var u;
    var v;
    var vertices;
    var x;
    var y;
    var z;

    vertices = surfaceGeometry.getVertices(); //new Float32Array(3*(nlatitude+1)*(nlongitude+1));
    normals  = surfaceGeometry.getNormals();  //new Float32Array(3*(nlatitude+1)*(nlongitude+1));

    for (latNumber=0; latNumber <= nlatitude; latNumber++)
    {
      theta    = latNumber * Math.PI / nlatitude;
      sinTheta = Math.sin(theta);
      cosTheta = Math.cos(theta);

      for (longNumber=0; longNumber <= nlongitude; longNumber++)
      {
        phi    = longNumber * 2 * Math.PI / nlongitude;
        sinPhi = Math.sin(phi);
        cosPhi = Math.cos(phi);

        x      = cosPhi * sinTheta;
        y      = cosTheta;
        z      = sinPhi * sinTheta;

        normals[nvertices]    = x;
        vertices[nvertices++] = radius * x + x0;

        normals[nvertices]    = y;
        vertices[nvertices++] = radius * y + y0;

        normals[nvertices]    = z;
        vertices[nvertices++] = radius * z + z0;
      }
    }
    surfaceGeometry.setNvertices(--nvertices);

    indices = surfaceGeometry.getIndices(); //new Uint16Array(6*nlatitude*nlongitude);

    for (latNumber=0; latNumber < nlatitude; latNumber++)
    {
      for (longNumber=0; longNumber < nlongitude; longNumber++)
      {
        first  = (latNumber * (nlongitude + 1)) + longNumber;
        second = first + nlongitude + 1;
        offset = 6*(latNumber*nlongitude + longNumber);

        indices[nindices++] = first;
        indices[nindices++] = second;
        indices[nindices++] = first + 1;

        indices[nindices++] = second;
        indices[nindices++] = second + 1;
        indices[nindices++] = first + 1;
      }
    }
    surfaceGeometry.setNindices(--nindices);
  }
}

