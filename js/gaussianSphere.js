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

  this.nindices  = 0;
  this.nvertices = 0;

  this.nMax      = n;
  
  this.vertices  = new Float32Array(n/2);
  this.indices   = new Uint16Array(n);
  this.normals   = new Float32Array(n/2);

  this.getNmax            = function()
  {
    return this.nMax;
  }

  this.setNindices        = function(n)
  {
    this.nindices = n;
  }

  this.getNindices        = function()
  {
    return this.nindices;
  }

  this.setNvertices       = function(n)
  {
    this.nvertices = n;
  }

  this.getNvertices       = function()
  {
    return this.nvertices;
  }

  this.setVerticies = function(geometry)
  {
    this.vertices = geometry;
  }

  this.getVertices = function()
  {
    return this.vertices;
  }

  this.setIndices  = function(indices)
  {
    this.indices = indices;
  }

  this.getIndices = function()
  {
    return this.indices;
  }

  this.setNormals = function(normals)
  {
    this.normals = normals;
  }

  this.getNormals = function()
  {
    return this.normals;
  }
}

/*
 * Represent a Gaussian sphere. This is a Gaussian surface, it will be drawn but will
 * have no effect on the field. The sphere or radius r is sentered at (x, y, z).
 */
function gaussianSphere(x, y, z, r)
{
  var latitudeBands;
  var longitudeBands;
  var nindices;
  var nvertices;

  this.nindices  = 0;
  this.nvertices = 0;

  this.radius = r;
  this.x      = x;
  this.y      = y;
  this.z      = z;

  this.latitudeBands  = 30;
  this.longitudeBands = 30;

  this.setNindices        = function(n)
  {
    this.nindices = n;
  }

  this.getNindices        = function()
  {
    return this.nindices;
  }

  this.setNvertices       = function(n)
  {
    this.nvertices = n;
  }

  this.getNvertices       = function()
  {
    return this.nvertices;
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

    vertices = surfaceGeometry.getVertices(); //new Float32Array(3*(this.latitudeBands+1)*(this.longitudeBands+1));
    normals  = surfaceGeometry.getNormals();  //new Float32Array(3*(this.latitudeBands+1)*(this.longitudeBands+1));

    for (latNumber=0; latNumber <= this.latitudeBands; latNumber++)
    {
      theta    = latNumber * Math.PI / this.latitudeBands;
      sinTheta = Math.sin(theta);
      cosTheta = Math.cos(theta);

      for (longNumber=0; longNumber <= this.longitudeBands; longNumber++)
      {
        phi    = longNumber * 2 * Math.PI / this.longitudeBands;
        sinPhi = Math.sin(phi);
        cosPhi = Math.cos(phi);

        x      = cosPhi * sinTheta;
        y      = cosTheta;
        z      = sinPhi * sinTheta;

        normals[this.nvertices]    = x;
        vertices[this.nvertices++] = this.radius * x;

        normals[this.nvertices]    = y;
        vertices[this.nvertices++] = this.radius * y;

        normals[this.nvertices]    = z;
        vertices[this.nvertices++] = this.radius * z;
      }
    }
    surfaceGeometry.setNvertices(--this.nvertices);

    indices = surfaceGeometry.getIndices(); //new Uint16Array(6*latitudeBands*longitudeBands);

    for (latNumber=0; latNumber < this.latitudeBands; latNumber++)
    {
      for (longNumber=0; longNumber < this.longitudeBands; longNumber++)
      {
        first  = (latNumber * (this.longitudeBands + 1)) + longNumber;
        second = first + this.longitudeBands + 1;
        offset = 6*(latNumber*this.longitudeBands + longNumber);

        indices[this.nindices++]   = first;
        indices[this.nindices++] = second;
        indices[this.nindices++] = first + 1;

        indices[this.nindices++] = second;
        indices[this.nindices++] = second + 1;
        indices[this.nindices++] = first + 1;
      }
    }
    surfaceGeometry.setNindices(--this.nindices);
  }
}

