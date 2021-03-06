/**
 * A charged plane with charge density sigma, field line density rho,
 * and bounding box {(x1, y1, z1), (x2, y2, z2), (x3, y3, z3), (x4, y4, z4)}.
 * The plane is actually infinite, however, for practical reasone we are
 * only concerned with displaying the section of the plane within the
 * bounding box.
 */
function chargedPlane(sigma_, rho_,
                      x1, y1, z1,
                      x2, y2, z2,
                      x3, y3, z3,
                      x4, y4, z4)
{
  /**
   * a: angle about the y axis
   * b: angle about the x axis
   * g: angle about the z axis
   */
  var a, b, g;
  /**
   * Vertices that define the edges of the area of the plane shown to
   * the user the plane itself is infinite,
   */
  var boundingBox;
  /**
   * Ca: Cos[a]
   * Cb: Cos[b]
   * Cg: Cos[g]
   */
  var ca, cb, cg;
  /** Transforms the unit square into the provided rectangle for this instance. */
  var modelView;
  /** Unit normal to the plane */
  var normal;
  /** The density of field lines - lines per unit charge. */
  var rho;
  /**
   * Sa: Sin[a]
   * Sb: Sin[b]
   * Sg: Sin[g]
   */
  var sa, sb, sg;
  /** The charge density for the plane */
  var sigma;
  /**
   * Scale factors to transfor the now flat rectangle into a unit rectangle.
   * sx: scale in the x direction
   * sy: scale in the y direction
   */
  var sx, sy;
  /**
   * Translation of the rectangle from the origin.
   * tx: Translation in the x direction
   * ty: Translation in the y direction
   * tz: Translation in the z direction
   */
  var tx, ty, tz;
  var twoPi;
  var vertexRegistry;
  var workingBoundingBox;
  var xside;

  this.setVertexRegistry   = function(registry)
  {
    vertexRegistry = registry;
  }

  this.getVertexRegistry   = function()
  {
    return vertexRegistry;
  }

  /**
   * Calculate a normal to the plane. Takeing the unit vector k and
   * transforming it by the model view matrix should also yield a unit
   * vector.
   */
  this.calculateNormal  = function(boundingBox)
  {
    var n, n2, normal;

    normal    = new Array(3);
    normal[0] = (boundingBox[4]-boundingBox[1])*(boundingBox[11]-boundingBox[2])
               -(boundingBox[5]-boundingBox[2])*(boundingBox[10]-boundingBox[1]);
    normal[1] = (boundingBox[5]-boundingBox[2])*(boundingBox[9]-boundingBox[0])
               -(boundingBox[3]-boundingBox[0])*(boundingBox[11]-boundingBox[2]);
    normal[2] = (boundingBox[3]-boundingBox[0])*(boundingBox[10]-boundingBox[1])
               -(boundingBox[4]-boundingBox[1])*(boundingBox[9]-boundingBox[0]);

    n2        = normal[0]*normal[0] + normal[1]*normal[1] + normal[2]*normal[2];
    n         = Math.sqrt(n2);

    normal[0] /= n;
    normal[1] /= n;
    normal[2] /= n;

    return normal;
  }

  /**
   * Apply the MV matrix to each start point for a field line
   * to map them onto the actual rectangle.
   */
  this.adjustStartPoints  = function(startPoints)
  {
    var npoints;
    var point;
    var x;
    var y;
    var z;

    npoints = startPoints.length;

    for(var i=0; i<npoints; i++)
    {
      point = startPoints[i];
      x        = point[0];
      y        = point[1];
      z        = point[2];

      point[0] = tx + cg*(sx*x*ca + z*sa) + sg*(-sy*y*cb+sb*(-sx*x*sa + z*ca));
      point[1] = ty + cg*(sy*y*cb + sb*(sx*x*sa - z*ca)) + sg*(sx*x*ca + z*sa);
      point[2] = tz + sy*y*sb + cb*(-sx*x*sa + z*ca);
    }
    return startPoints;
  }

  /**
   *
   */
  this.getStartPoints     = function()
  {
    var a, ax, ay;
    var bottom;
    // The field line density in line per cm**2
    var d;
    var done;
    var left;
    var right;
    var sgn;
    var startPoints;
    var top;
    var xpoint, ypoint;

    d           = Math.abs(sigma*rho);
    startPoints = new Array();

    if (d>0)
    {
      a           = Math.sqrt(1/d);
      // Now scale it to the unit square
      ax          = a/Math.abs(sx);
      ay          = a/Math.abs(sy);
      done        = false;
      sgn         = sigma > 0 ? 1 : -1;
      top         =  0.5;
      bottom      = -0.5;
      left        = -0.5;
      right       =  0.5;
      xpoint      = Math.min(left   + ax/2, (right-left)/2);
      ypoint      = Math.min(bottom + ay/2, (top-bottom)/2);

      while (!done)
      {
        startPoints.push(new Array(xpoint, ypoint,  .4, sgn));
        startPoints.push(new Array(xpoint, ypoint, -.4, sgn));

        ypoint += ay;
        if (ypoint > top)
        {
          ypoint  = top - (ypoint - top);
          xpoint += ax;
          ay      = -ay;
        }
        else if  (ypoint < bottom)
        {
          ypoint  = bottom - (ypoint - bottom);
          xpoint += ax;
          ay      = -ay;
        }
        done = xpoint > right;
      }
    }
    return this.adjustStartPoints(startPoints);
  }

  /**
   * Compute the electric field at any point (x,y,z) due to this
   * charge distribution.
   */
  this.getField           = function(x, y, z)
  {
     var d, E, EField;

     EField = new Array(3);

     // Dot product of the unit normal with the vector from point 1 in the
     // bounding box to the given point. If positive, E is in the direction
     // of the normal. If negative E is in the opposite direction.
     d =  (x-boundingBox[0])*normal[0]
        + (y-boundingBox[1])*normal[1]
        + (z-boundingBox[2])*normal[2]

     E = twoPi*sigma;
     if (d == 0)
     {
        EField[0] = 0;
        EField[1] = 0;
        EField[2] = 0;
     }
     if (d > 0)
     {
        EField[0] = E*normal[0];
        EField[1] = E*normal[1];
        EField[2] = E*normal[2];
     }
     else
     {
        EField[0] = -E*normal[0];
        EField[1] = -E*normal[1];
        EField[2] = -E*normal[2];
     }
     return EField;
  }

  /**
   * Translates a rectangle to be centered at the origin.
   */
  this.translateBoundingBox = function(boundingBox)
  {
    tx = (x1 + x3) / 2;
    ty = (y1 + y3) / 2;
    tz = (z1 + z3) / 2;
  
    boundingBox[0]  -= tx;
    boundingBox[1]  -= ty;
    boundingBox[2]  -= tz;
    boundingBox[3]  -= tx;
    boundingBox[4]  -= ty;
    boundingBox[5]  -= tz;
    boundingBox[6]  -= tx;
    boundingBox[7]  -= ty;
    boundingBox[8]  -= tz;
    boundingBox[9]  -= tx;
    boundingBox[10] -= ty;
    boundingBox[11] -= tz;

    return boundingBox;
  }

  this.zAxisRotation        = function(boundingBox)
  {
    var dx1, dx2;
    /** Slope of two adjacent sides, the smaller of which is parallel to the x axis */
    var s1, s2;
    var tmpx, tmpy;

    // x1-x4
    dx1 = boundingBox[3] - boundingBox[0];
    // x2-x1
    dx2 = boundingBox[0] - boundingBox[9];

    if (dx1 == 0 || dx2 == 0)
    {
      // If either side is already parallel to the X axis
      // suppress rotation about the z axis.
      g     = 0;

      if (dx1 == 0 && dx2 == 0)
      {
        // Both dx1 and dx2 are zero - rectangle is in the Y-Z plane.
        // If side 1 is not along the y axis
        if (boundingBox[4] - boundingBox[1] == 0)
        {
          // It will be rotated onto the x axis later.
          xside = 1;
        }
        else
        {
          xside = 2;
        }
      }
      else if (dx1 == 0)
      {
        // Side 1 is already parallel to the x-axis.
        xside = 1;
      }
      else
      {
        // Side 2 must be parallel to the x-axis.
        xside = 2;
      }
    }
    else
    {
      s1 = (y2-y1)/dx1;
      s2 = (y3-y2)/dx2;

      if (Math.abs(s1) < Math.abs(s2))
      {
        g     = Math.atan(s1);
        xside = 1;
      }
      else
      {
        g     = Math.atan(s2);
        xside = 2;
      }
    }
  
    cg = Math.cos(g);
    sg = Math.sin(g);

    // Compute new x and y positions for each bounding box point
    for(var point=0; point<4; point++)
    {
      // x' = xCos[g]−ySin[g]
      tmpx = cg*boundingBox[3*point] - sg*boundingBox[3*point+1];
      // y' = xSin[g]+yCos[g]
      tmpy = sg*boundingBox[3*point] + cg*boundingBox[3*point+1];

      boundingBox[3*point]   = tmpx;
      boundingBox[3*point+1] = tmpy;
    }

    return boundingBox;
  }

  /**
   * For rotation about the x-axis, rotate by -atan(delta-z/delta-y) along the 
   * side oriented along the y-axis.
   *
   * @param {Array} boundingBox An array of four sets of x,y,z coordinates (points),
   *                            each set is a corner of a rectangle.
   * @param {int}   xside       Which side is parallel to the x-axis. 1 => p(0)-p(1)
   *                            is parallel to the x-axis. Otherwise it is p(4)-p(0)
   *
   * @returns {Array} boundingBox The original bounding box rotated around the x axis
   *                              by b radians.
   */
  this.xAxisRotation           = function(boundingBox, xside)
  {
    var deltay, deltaz;
    var tmpy,   tmpz;

    if (xside == 1)
    {
      deltay = boundingBox[1] - boundingBox[10];
      deltaz = boundingBox[2] - boundingBox[11];
    }
    else
    {
      deltay = boundingBox[4] - boundingBox[1];
      deltaz = boundingBox[5] - boundingBox[2];
    }

    b  = 0;
    sb = 0;
    cb = 1;

    if (deltaz != 0 && deltay!= 0)
    {
      b = Math.atan(deltaz/deltay)

      sb = Math.sin(b);
      cb = Math.cos(b);
    
      // Compute new x and y positions for each bounding box point
      for(var point=0; point<4; point++)
      {
        // y' = yCos[b]-zSin[b]
        tmpy = cb*boundingBox[3*point+1] - sb*boundingBox[3*point+2];
        // z' = ySin[b]+zCos[b]
        tmpz = sb*boundingBox[3*point+1] + cb*boundingBox[3*point+2];

        boundingBox[3*point+1] = tmpy;
        boundingBox[3*point+2] = tmpz;
      }
    }
    return boundingBox;
  }

  /**
   * For rotation about the y-axis, rotate by -atan(delta-z/delta-x) along the 
   * side oriented along the x-axis.
   *
   * @param {Array} boundingBox An array of four sets of x,y,z coordinates (points),
   *                            each set is a corner of a rectangle.
   * @param {int}   xside       Which side is parallel to the x-axis. 1 => p(0)-p(1)
   *                            is parallel to the x-axis. Otherwise it is p(4)-p(0)
   *
   * @returns {Array} boundingBox The original bounding box rotated around the y axis
   *                              by a radians.
   */
  this.yAxisRotation           = function(boundingBox, xside)
  {
    var deltax, deltaz;
    var tmpx,   tmpz;

    if (xside == 1)
    {
      deltax = boundingBox[0] - boundingBox[9];
      deltaz = boundingBox[2] - boundingBox[11];
    }
    else
    {
      deltax = boundingBox[3] - boundingBox[0];
      deltaz = boundingBox[5] - boundingBox[2];
    }

    a  = 0;
    sa = 0;
    ca = 1;

    if (deltaz != 0)
    {
      if (deltax != 0)
      {
        a  = Math.atan(deltaz/deltax)
        sa =  Math.sin(a);
        ca =  Math.cos(a);
      }
      else
      {
        // Pi/2
        a  = 1.57079632679489662;
        sa = 1;
        ca = 0;
      }
    
      // Compute new x and z positions for each bounding box point
      for(var point=0; point<4; point++)
      {
        // x' = xCos[a]+zSin[a]
        tmpx =  ca*boundingBox[3*point] + sa*boundingBox[3*point+2];
        // z' = -xSin[a]+zCos[a]
        tmpz = -sa*boundingBox[3*point] + ca*boundingBox[3*point+2];

        boundingBox[3*point]   = tmpx;
        boundingBox[3*point+2] = tmpz;
      }
    }

    return boundingBox;
  }

  /**
   * Scale the rectangle to a unit square.
   *
   * @param {Array} boundingBox An array of four sets of x,y,z coordinates (points),
   *                            each set is a corner of a rectangle.
   * @param {int}   xside       Which side is parallel to the x-axis. 1 => p(0)-p(1)
   *                            is parallel to the x-axis. Otherwise it is p(4)-p(0)
   *
   * @returns {Array} boundingBox The original bounding box scaled to a unit square.
   */
  this.scaleBoundingbox           = function(boundingBox, xside)
  {
    if (xside == 1)
    {
      sx = boundingBox[0] - boundingBox[9];
      sy = boundingBox[4] - boundingBox[1];
    }
    else
    {
      sx = boundingBox[3] - boundingBox[0];
      sy = boundingBox[1] - boundingBox[10];
    }

    // Compute new x and y positions for each bounding box point
    for(var point=0; point<4; point++)
    {
      if (sx != 0)
      {
        boundingBox[3*point] /= sx;
      }

      if (sy != 0)
      {
        boundingBox[3*point+1] /= sy;
      }
    }
    return boundingBox;
  }

  this.getModelView       = function()
  {
    return modelView;
  }

  this.drawFullSurface      = function(gl,                  surfaceProgram,       surfaceGeometryBuffer,
                                       surfaceNormalBuffer, surfaceIndicesBuffer, nindices)
  {
    bindBuffer(gl, surfaceGeometryBuffer, 'position', surfaceProgram, 3, gl.FLOAT, 0, 0);
    bindBuffer(gl, surfaceNormalBuffer,   'normal',   surfaceProgram, 3, gl.FLOAT, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surfaceIndicesBuffer);

    gl.drawElements(gl.TRIANGLES, nindices, gl.UNSIGNED_SHORT, 0);
  }

  this.render                = function(gl, surfaceProgram)
  {
    var vertices;
    var nindices;

    vertices       = this.getVertexBuffers(gl, vertexRegistry);

    // RGBA positive (blue) or negative (red) charge
    if (sigma > 0)
    {
      loadUniform4f(gl, surfaceProgram, "surfaceColor",      0.05, 0.05, 0.8, 0.40);
    }
    else if (sigma < 0)
    {
      loadUniform4f(gl, surfaceProgram, "surfaceColor",      0.8, 0.05, 0.05, 0.40);
    }
    else
    {
      loadUniform4f(gl, surfaceProgram, "surfaceColor",      0.5, 0.5, 0.5, 0.2);
    }

    nindices = this.getNindices();
    loadUniformMatrix4fv(gl, surfaceProgram, "modelViewMatrix", this.getModelView());

    gl.disable(gl.CULL_FACE);
    this.drawFullSurface(gl,               surfaceProgram,   vertices.vertices,
                         vertices.normals, vertices.indices, nindices);
    gl.enable(gl.CULL_FACE);
  }

  twoPi       = 6.28318530717958648;
  sigma       = sigma_;
  rho         = rho_;
  boundingBox = new Array(x1, y1, z1,
                          x2, y2, z2,
                          x3, y3, z3,
                          x4, y4, z4);

  workingBoundingBox = boundingBox.slice(0);

  // Calculate the normal to the rectangle.
  normal             = this.calculateNormal(boundingBox);

  workingBoundingBox = this.translateBoundingBox(workingBoundingBox);
  workingBoundingBox = this.zAxisRotation(workingBoundingBox);
  workingBoundingBox = this.xAxisRotation(workingBoundingBox, xside);
  workingBoundingBox = this.yAxisRotation(workingBoundingBox, xside);
  workingBoundingBox = this.scaleBoundingbox(workingBoundingBox, xside);
  

  // The modelView matrix is T[Tx, Ty, Tz].Rz[g].Rx[b].Ry[a].S[Sx,Sy,Sz]
  modelView     = new Float32Array(16);

  ca = Math.cos(-a);
  cb = Math.cos(-b);
  cg = Math.cos(-g);
  sa = Math.sin(-a);
  sb = Math.sin(-b);
  sg = Math.sin(-g);

  //  Column 1:
  modelView[0]  =  sx*(ca*cg - sa*sb*sg);
  modelView[1]  =  sx*(ca*sg + cg*sa*sb);
  modelView[2]  = -sx*cb*sa
  modelView[3]  =  0

  // column 2:
  modelView[4]  = -sy*cb*sg
  modelView[5]  =  sy*cb*cg
  modelView[6]  =  sy*sb
  modelView[7]  =  0

  // column 3:
  modelView[8]  =  (sb*sg*ca + sa*cg)
  modelView[9]  = -(sb*ca*cg - sa*sg)
  modelView[10] =  ca*cb
  modelView[11] =  0

  // column 4:
  modelView[12] = tx;
  modelView[13] = ty;
  modelView[14] = tz;
  modelView[15] = 1;

}

/**
 * chargedPlane extends the GeometryEngine.square class.
 */
chargedPlane.prototype = new GeometryEngine.square();