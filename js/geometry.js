"use strict";
/**
 * A holder for data used to draw a surface. Provide nverticies and nindices as the
 * size of vertex, normal, and index arrays.
 * Possibly, eventually, maybe. Reuse this object with each surface, so make n large
 * enough to hold the largest surface.
 */
function surfaceGeometry(nvertices_, nindices_)
{
  var indices;
  var nMax;
  var nindices;
  var normals;
  var nvertices;
  var vertices;

  nindices  = nindices_;
  nvertices = nvertices_;

  vertices  = new Float32Array(nvertices_);
  indices   = new Uint16Array(nindices_);
  normals   = new Float32Array(nvertices_);

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
  function GeometryEngine()
  {
  }

  /**
   * An enum cataloging the known shapes.
   */
  GeometryEngine.Shapes = {
                           SPHERE : {value: 0}
                          };



  /**
   * A Registry for vertex buffer objects - the general goal is to have
   * one set of vertices per geometry type, and then to scale it to objects
   * of different sizes. This structure is analogous to Java's static method.
   * Type is expected to be an instance of GeometryEngine.Shapes
   */
  GeometryEngine.VertexRegistry  = function()
  {
    var registry;

    registry = {};

    /**
     * Register a set of vertex buffers for a given shape.
     */
    this.registerVertices = function(type, vertices)
    {
      if (registry.hasOwnProperty(type))
      {
        throw "Vertex buffers already registered for " + type + ".";
      }
      registry[type] = vertices;
    }

    this.hasVertices = function(type)
    {
      return registry.hasOwnProperty(type);
    }

    this.retrieveVertices = function(type)
    {
      return registry[type];
    }
  }

  /**
   * A fixed radius sphere. Use the model view matrix to position and scale it.
   */
  GeometryEngine.sphere  = function()
  {
    var nlatitude;
    var nlongitude;
    var intrinsicRadius;
    var shape;

    nlatitude       = 30;
    nlongitude      = 30;
    intrinsicRadius = 30;
    shape           = GeometryEngine.Shapes.SPHERE;

    this.getIntrinsicRadius = function()
    {
      return intrinsicRadius;
    }

    this.getShape  = function()
    {
      return shape;;
    }

    this.getNindices = function()
    {
      return 6*nlatitude*nlongitude;
    }
    
    /**
     * Compute the verticies, normal and indices for a spherical surface of
     * radius r, divided into nlatitude and nlongitude pieces.
     */
    this.computeGeometry  = function(surfaceGeometry, r, nlatitude, nlongitude)
    {
      var cosPhi;
      var cosTheta;
      var first;
      var indices;
      var latNumber;
      var longNumber;
      var nindices;
      var normals;
      var nvertices;
      var offset;
      var phi;
      var second;
      var sinPhi;
      var sinTheta;
      var theta;
      var vertices;
      var x;
      var y;
      var z;

      vertices  = surfaceGeometry.getVertices(); //new Float32Array(3*(nlatitude+1)*(nlongitude+1));
      nindices  = 0
      nvertices = 0;
      normals   = surfaceGeometry.getNormals();  //new Float32Array(3*(nlatitude+1)*(nlongitude+1));

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
  
          x      = sinPhi * sinTheta;
          y      = cosTheta;
          z      = cosPhi * sinTheta;

          normals[nvertices]    = x;
          vertices[nvertices++] = r * x;

          normals[nvertices]    = y;
          vertices[nvertices++] = r * y;

          normals[nvertices]    = z;
          vertices[nvertices++] = r * z;
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

    /**
     * Retrieve vertex buffers from the registry if the already exist,
     * otherwise build and register them.
     */
    this.getVertexBuffers    = function(gl, vertexRegistry)
    {
      var geometry;
      var verticies;

      if (vertexRegistry.hasVertices(shape))
      {
        verticies = vertexRegistry.retrieveVertices(shape);
      }
      else
      {
        // TODO look for more effecient ways to allocate the storage
        // possibly generating each array then the vbo individually.
        geometry  = new surfaceGeometry(3*(nlongitude+1)*(nlatitude+1), 6*nlongitude*nlatitude);
        verticies = {};
        this.computeGeometry(geometry, intrinsicRadius, nlongitude, nlatitude);
        verticies.verticies = createBuffer(gl, geometry.getVertices());
        verticies.normals   = createBuffer(gl, geometry.getNormals());
        verticies.indices   = createIndexBuffer(gl, geometry.getIndices());
        vertexRegistry.registerVertices(shape, verticies);
      }
      return verticies;
    }
  }



