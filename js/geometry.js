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

  vertices  = new Float32Array(3*nvertices_);
  indices   = new Uint16Array(nindices_);
  normals   = new Float32Array(3*nvertices_);

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
   * An enum listing sides of an object.
   */
  GeometryEngine.Sides  = {
                            TOP            : {value: "top"},
                            BOTTOM         : {value: "bottom"},
                            LEFT           : {value: "left"},
                            RIGHT          : {value: "right"}
                          };

  /**
   * An enum cataloging the known shapes.
   * SPHERE
   * RECTANGLE, which may be folded into a cube eventually,
   * and CYLINDER.
   */
  GeometryEngine.Shapes = {
                            SPHERE         : {value: "sphere"},
                            SQUARE         : {value: "square"},
                            CYLINDER       : {value: "cylinder"}
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
   * Rebuild this as a cube with the first four indices forming a unit square
   * centered at the origin.
   */
  GeometryEngine.square          = function()
  {
    var bottom;
    /**
     * Vertices that define the edges of the area of the plane shown to
     * the user the plane itself is infinite,
     */
    var boundingBox;
    var left;
    var normal;
    var right;
    var shape;
    var top;

    shape       = GeometryEngine.Shapes.SQUARE;
    top         =  0.5;
    bottom      = -0.5;
    left        = -0.5;
    right       =  0.5;
    boundingBox = new Array(left,  top,    0,  // x1, y1, z1
                            right, top,    0,  // x2, y2, z2
                            right, bottom, 0,  // x3, y3, z3
                            left,  bottom, 0); // x4, y4, z4
    // The normal is a unit vector in the z direction.
    normal      = new Array(0,0,1);

    this.getNindices = function()
    {
      // TODO: Magic number!
      return 6;
    }

    /**
     * Fill in the vertices, normals and indices for a unit square
     * about the origin.
     */
    this.computeGeometry  = function(surfaceGeometry, boundingBox)
    {
      var indices;
      var normals;
      var vertices;

      vertices = surfaceGeometry.getVertices();
      normals  = surfaceGeometry.getNormals();
      indices  = surfaceGeometry.getIndices();

      for(var i=0; i<12; i++)
      {
        vertices[i] = boundingBox[i];
        normals[i]   = normal[i%3];
      }
      indices[0] = 0;
      indices[1] = 3;
      indices[2] = 1;
      indices[3] = 3;
      indices[4] = 2;
      indices[5] = 1;

      surfaceGeometry.setNvertices(12);
      surfaceGeometry.setNindices(6);
      
    }
    /**
     * Retrieve vertex buffers from the registry if the already exist,
     * otherwise build and register them.
     */
    this.getVertexBuffers    = function(gl, vertexRegistry)
    {
      var geometry;
      var vertices;

      if (vertexRegistry.hasVertices(shape.value))
      {
        vertices = vertexRegistry.retrieveVertices(shape.value);
      }
      else
      {
        // TODO look for more effecient ways to allocate the storage
        // possibly generating each array then the vbo individually.
        // Three coordinates for each of four vertices that define a square.
        geometry  = new surfaceGeometry(4, 6);
        vertices = {};
        this.computeGeometry(geometry, boundingBox);
        vertices.vertices = createBuffer(gl, geometry.getVertices());
        vertices.normals  = createBuffer(gl, geometry.getNormals());
        vertices.indices  = createIndexBuffer(gl, geometry.getIndices());
        vertexRegistry.registerVertices(shape.value, vertices);
      }
      return vertices;
    }
  }

  /**
   * A unit cylinder centered about the origin, and oriented along the z-axis.
   */
  GeometryEngine.cylinder          = function()
  {
    var baseHeight;
    var baseRadius;
    var bottom;
    var nslices;
    var shape;
    var top;

    baseHeight  = 1.0;
    baseRadius  = 1.0;
    bottom      = -baseHeight/2;
    nslices     = 30;
    shape       = GeometryEngine.Shapes.CYLINDER;
    top         = baseHeight/2;

    this.getBaseHeight = function()
    {
      return baseHeight;
    }

    this.getBaseRadius = function()
    {
      return baseRadius;
    }

    this.getShape  = function()
    {
      return shape;;
    }

    this.getNindices = function()
    {
      return 4*nslices+6;
    }

    /**
     * Generate vertices, normals and indices for the end caps and wall of the
     * cylinder.
     *
     * @param {surfaceGeometry} surfaceGeometry Holder for the vertices, normals,
     *        and indices for the surface. Expected to have 4*nslices entries for
     *        each of these.
     */
    this.computeGeometry  = function(surfaceGeometry)
    {
      /** The index for populating the vertex array for the bottom cap. */
      var bottomIndex;
      var dtheta;
      var i;
      var indices;
      var normals;
      var sideIndex;
      var theta;
      /** The vertex array index for the top cap */
      var topIndex;
      var vertices;

      vertices = surfaceGeometry.getVertices();
      normals  = surfaceGeometry.getNormals();
      indices  = surfaceGeometry.getIndices();

      // The center of the top cap
      vertices[0]           = 0;
      normals[0]            = 0;
      vertices[1]           = 0;
      normals[1]            = 0;
      vertices[2]           = top;
      normals[2]            = 1;
      indices[0]            = 0;
      // the center of the bottom cap
      bottomIndex            = 3*nslices+4;
      indices[bottomIndex]   = bottomIndex;
      bottomIndex           *= 3;
      vertices[bottomIndex]  = 0;
      normals[bottomIndex++] = 0;
      vertices[bottomIndex]  = 0;
      normals[bottomIndex++] = 0;
      vertices[bottomIndex]  = bottom;
      normals[bottomIndex]   = -1;

      // Triangle fans use ntraingles+2 points
      // Build the top cap
      for(i=1; i<=nslices+1; i++)
      {
        theta                  = (i-1)*2*Math.PI/nslices;
        indices[i]             = i;
        topIndex               = 3*i;
        vertices[topIndex]     = baseRadius*Math.cos(theta);
        normals[topIndex++]    = 0;
        vertices[topIndex]     = baseRadius*Math.sin(theta);
        normals[topIndex++]    = 0;
        vertices[topIndex]     = top;
        normals[topIndex]      = 1;

      }

      // Copy top cap to the bottom cap.
      for (i=1; i<=nslices+1; i++)
      {
        topIndex               = 3*i;
        bottomIndex            = i + 3*nslices+4;
        indices[bottomIndex]   = bottomIndex;
        bottomIndex           *= 3;
        vertices[bottomIndex]  = vertices[topIndex++]
        normals[bottomIndex++] = 0;
        vertices[bottomIndex]  = vertices[topIndex]
        normals[bottomIndex++] = 0;
        vertices[bottomIndex]  = bottom;
        normals[bottomIndex]   = -1;
      }

      // Build the side from the top and bottom cap vertices
      topIndex    = 3;
      bottomIndex = 9*nslices+15;
      sideIndex   = 3*nslices+6;
      for (i=0; i<=nslices; i++)
      {
        // Copy a point from the top cap
        indices[sideIndex/3] = sideIndex/3;
        vertices[sideIndex]  = vertices[topIndex];
        normals[sideIndex++] = vertices[topIndex++]/baseRadius;
        vertices[sideIndex]  = vertices[topIndex];
        normals[sideIndex++] = vertices[topIndex++]/baseRadius;
        vertices[sideIndex]  = vertices[topIndex];
        normals[sideIndex++] = vertices[topIndex++]/baseRadius;
        // And the next one from the bottom cap
        indices[sideIndex/3] = sideIndex/3;
        vertices[sideIndex]  = vertices[bottomIndex];
        normals[sideIndex++] = vertices[bottomIndex++]/baseRadius;
        vertices[sideIndex]  = vertices[bottomIndex];
        normals[sideIndex++] = vertices[bottomIndex++]/baseRadius;
        vertices[sideIndex]  = vertices[bottomIndex];
        normals[sideIndex++] = vertices[bottomIndex++]/baseRadius;
      }
      surfaceGeometry.setNvertices(3*(4*nslices+6));
      surfaceGeometry.setNindices(4*nslices+6);
    }

    /**
     * Retrieve vertex buffers from the registry if they already exist,
     * otherwise build and register them.
     */
    this.getVertexBuffers    = function(gl, vertexRegistry)
    {
      var geometry;
      var vertices;

      if (vertexRegistry.hasVertices(shape.value))
      {
        vertices = vertexRegistry.retrieveVertices(shape.value);
      }
      else
      {
        // TODO look for more effecient ways to allocate the storage
        // possibly generating each array then the vbo individually.
        geometry  = new surfaceGeometry(4*nslices+6, 4*nslices+6);
        vertices = {};
        this.computeGeometry(geometry);
        vertices.vertices  = createBuffer(gl, geometry.getVertices());
        vertices.normals   = createBuffer(gl, geometry.getNormals());
        vertices.indices   = createIndexBuffer(gl, geometry.getIndices());
        vertexRegistry.registerVertices(shape.value, vertices);
      }
      return vertices;
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
     * Compute the vertices, normal and indices for a spherical surface of
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
      var vertices;

      if (vertexRegistry.hasVertices(shape.value))
      {
        vertices = vertexRegistry.retrieveVertices(shape.value);
      }
      else
      {
        // TODO look for more effecient ways to allocate the storage
        // possibly generating each array then the vbo individually.
        geometry  = new surfaceGeometry((nlongitude+1)*(nlatitude+1), 6*nlongitude*nlatitude);
        vertices = {};
        this.computeGeometry(geometry, intrinsicRadius, nlongitude, nlatitude);
        vertices.vertices = createBuffer(gl, geometry.getVertices());
        vertices.normals   = createBuffer(gl, geometry.getNormals());
        vertices.indices   = createIndexBuffer(gl, geometry.getIndices());
        vertexRegistry.registerVertices(shape.value, vertices);
      }
      return vertices;
    }
  }



