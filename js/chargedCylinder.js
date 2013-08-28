/**
 * A segment of an infinite charged cylinder. Represented as a line from
 * (x0, y0, z0) to (x1, y1, z1) with volume charge density rhoq.
 *
 * @param x0_     {Double} The x coordinate one end cap of the cylinder.
 * @param y0_     {Double} The y coordinate one end cap of the cylinder.
 * @param z0_     {Double} The z coordinate one end cap of the cylinder.
 * @param x1_     {Double} The x coordinate for the other end cap of the cylinder.
 * @param y1_     {Double} The y coordinate for the other end cap of the cylinder.
 * @param z1_     {Double} The z coordinate for the other end cap of the cylinder.
 * @param r0_     {Double} The inner radios of the cylinder, 0 for a solid cylinder.
 * @param r1_     {Double} The outer radius of the cylinder.
 * @param rhoq_   {Double} The volume charge density within the cylinder. Related to linear charge density by lambda = Pi (r1*r1-r0*r0)*rho
 * @param rhof_   {Double} The ratio of field lines to charge.
 *
 * @constructor
 */
"use strict";
function chargedCylinder(x0_, y0_, z0_, x1_, y1_, z1_, r0_, r1_, rhoq_, rhof_)
{
  var color;
  var height;
  /** Transforms the base cylinder to the r=r1 cylinder. */
  var modelViewMatrix;
  /** Rotation angles around the z and y axes */
  var phi, theta;
  /** The charge density and density of field lines per unit charge. */
  var rhoq, rhof;
  /** The inner and outer radius of the cylinder. */
  var r0, r1;
  /**
   * Translation of the rectangle from the origin.
   * tx: Translation in the x direction
   * ty: Translation in the y direction
   * tz: Translation in the z direction
   */
  var tx, ty, tz;
  /** The coordinates of an end cap of the cylinder. */
  var x0, y0, z0;
  /** The coordinates of the other end cap of the cylinder. */
  var x1, y1, z1;
  /** (x1,y1,z1) - (x0, y0, z0) used in distance calculations */
  var x10, y10, z10;
  /** |(x1,y1,z1) - (x0, y0, z0)| used in distance calculations */
  var mag10;


  this.setHeight           = function(height_)
  {
    height = height_;
  }

  this.getHeight           = function()
  {
    return height;
  }

  this.setTx               = function(t)
  {
    tx = t;
    return this;
  }

  this.getTx               = function()
  {
    return tx;
  }

  this.setTy               = function(t)
  {
    ty = t;
    return this;
  }

  this.getTy               = function()
  {
    return ty;
  }

  this.setTz               = function(t)
  {
    tz = t;
    return this;
  }

  this.getTz               = function()
  {
    return tz;
  }

  this.setX0               = function(x_)
  {
    x0 = x_;
    return this;
  }

  this.getX0               = function()
  {
    return x0;
  }

  this.setY0               = function(y_)
  {
    y0 = y_;
    return this;
  }

  this.getY0               = function()
  {
    return y0;
  }

  this.setZ0               = function(z_)
  {
    z0 = z_;
    return this;
  }

  this.getZ0               = function()
  {
    return z0;
  }

  this.setX1               = function(x_)
  {
    x1 = x_;
    return this;
  }

  this.getX1               = function()
  {
    return x1;
  }

  this.setY1               = function(y_)
  {
    y1 = y_;
    return this;
  }

  this.getY1               = function()
  {
    return y1;
  }

  this.setZ1               = function(z_)
  {
    z1 = z_;
    return this;
  }

  this.getZ1               = function()
  {
    return z1;
  }

  this.setR0               = function(r_)
  {
    r0 = r_;
    return this;
  }

  this.getR0               = function()
  {
    return r0;
  }

  this.setR1               = function(r_)
  {
    r1 = r_;
    return this;
  }

  this.getR1               = function()
  {
    return r1;
  }

  this.setPhi              = function(phi_)
  {
    phi = phi_;
    return this;
  }

  this.getPhi              = function()
  {
    return phi;
  }

  this.setTheta            = function(theta_)
  {
    theta = theta_;
    return this;
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

      point[0] = modelViewMatrix[0]*x + modelViewMatrix[4]*y + modelViewMatrix[8]*z  + modelViewMatrix[12];
      point[1] = modelViewMatrix[1]*x + modelViewMatrix[5]*y + modelViewMatrix[9]*z  + modelViewMatrix[13];
      point[2] = modelViewMatrix[2]*x + modelViewMatrix[6]*y + modelViewMatrix[10]*z + modelViewMatrix[14];
    }

    return startPoints;
  }

  /**
   * Create a set of start points along the base line charge, then transform them
   * with the model view to get the tru location in the scene.
   */
  this.getStartPoints     = function()
  {
    /** The separation between sets of field lines. */
    var ds;
    var npoints;
    var r0p1;
    var r0spi4;
    var s;
    var sgn;
    /** sin(Pi/4) */
    var sinpi4;
    var startPoints;

    sinpi4      = 0.707106781;
    startPoints = new Array();

    if (rhof != 0)
    {
      sgn         = this.sign(rhoq);

      npoints     = Math.max(2, Math.round(Math.abs(rhoq*Math.PI*(r1*r1-r0*r0)*rhof*height)));
      // Used in field lines at multiples of Pi/2 around the cylinder.
      r0p1        = (r0+1)/r1;
      // Used in field lines at multiples of Pi/4 around the cylinder.
      r0spi4      = (r0+1)*sinpi4/r1;
      s           = -0.5;
      ds          = 1/(npoints-1);

      for (var i=0; i<npoints; i++)
      {
        startPoints.push(new Array(   r0p1,     0.0, s, sgn));
        startPoints.push(new Array(  -r0p1,     0.0, s, sgn));
        startPoints.push(new Array(    0.0,    r0p1, s, sgn));
        startPoints.push(new Array(    0.0,   -r0p1, s, sgn));
        startPoints.push(new Array( r0spi4,  r0spi4, s, sgn));
        startPoints.push(new Array( r0spi4, -r0spi4, s, sgn));
        startPoints.push(new Array(-r0spi4, -r0spi4, s, sgn));
        startPoints.push(new Array(-r0spi4,  r0spi4, s, sgn));
        s += ds;
      }
    }

    return this.adjustStartPoints(startPoints);
  }

  /**
   * Get a normal to P0P1 through P2; Effeciency is important as this
   * computes the field repeatedly, for example at every point along
   * a field line.
   */
  this.getNormal          = function(x2, y2, z2)
  {
    // The normal from the line to P2
    var n;
    // u = (P0-P2) dot (P1-P0)/ |P1-P0|**2 From P3 = P0 + u(P1 - P0),
    // and P2P3 is a line perpendicular to P0P1 through P2.
    var u;
    // Point on P0P1 nearest to P2.
    var x3, y3, z3;
    // Components in the (x0, y0, z0) - (x2, y2, z2) vector
    var x02, y02, z02;

    n = {};

    x02 = x0 - x2;
    y02 = y0 - y2;
    z02 = z0 - z2;

    u = -(x02*x10 + y02*y10 + z02*z10)/(mag10*mag10);
    x3  = x0 + u*(x10);
    y3  = y0 + u*(y10);
    z3  = z0 + u*(z10);

    n.x = x2 - x3;
    n.y = y2 - y3;
    n.z = z2 - z3;

    return n;
  }

  this.getField            = function(x, y, z)
  {
    var f, fmag;
    var lambda;
    var n, nmag;
    
    f    = new Array(3);

    n    = this.getNormal(x,y,z);
    nmag = Math.sqrt(n.x*n.x + n.y*n.y + n.z*n.z);

    // Inside the inner diameter, no field.
    if (nmag<r0)
    {
      lambda = 0;
    }
    else if (nmag<r1)
    {
      lambda = Math.PI*(nmag*nmag-r0*r0)*rhoq;
    }
    else
    {
      lambda = Math.PI*(r1*r1-r0*r0)*rhoq;
    }
    
    fmag = 2*lambda/nmag;

    f[0] = fmag * n.x/nmag;
    f[1] = fmag * n.y/nmag;
    f[2] = fmag * n.z/nmag;

    return f;
  }

  this.render                 = function(gl, surfaceProgram)
  {
      this.fullRender(gl, surfaceProgram, modelViewMatrix, tx, ty, tz, height, r0, r1, phi, theta, rhoq);
  }

  // Stock radius for a charged line.
  r0     = r0_;
  r1     = r1_;
  rhoq   = rhoq_;
  rhof   = rhof_;
  x0     = x0_;
  y0     = y0_;
  z0     = z0_;
  x1     = x1_;
  y1     = y1_;
  z1     = z1_;

  if (rhoq > 0)
  {
    color = new Color(0.05, 0.05, 0.8, 0.30);
  }
  else if (rhoq < 0)
  {
    color = new Color(0.8, 0.05, 0.05, 0.30);
  }
  else
  {
    // Neutral surfaces are grey
    color = new Color(0.5, 0.5, 0.5, 0.30);
  }

  this.setColor(color);
  this.translateBounds(this, x0, y0, z0, x1, y1, z1);
  this.zAxisRotation(this, x0, y0, x1, y1);
  this.yAxisRotation(this, x0, y0, z0, x1, y1, z1);
  this.scale(this, z0, z1);

  // Restore these after the transformation is done.
  // TODO: contain the transformation within the prototype
  x0     = x0_;
  y0     = y0_;
  z0     = z0_;
  x1     = x1_;
  y1     = y1_;
  z1     = z1_;

  modelViewMatrix = this.getCylinderModelView(tx, ty, tz, height, r1, phi, theta);
  x10             = x1-x0;
  y10             = y1-y0;
  z10             = z1-z0;
  mag10           = Math.sqrt(x10*x10 + y10*y10 + z10*z10);
}

/**
 * chargedCylinder extends cylinder.
 */
chargedCylinder.prototype = new cylinder();