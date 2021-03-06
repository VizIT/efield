/**
 * A segment of an infinite charged line. Represented as a line from
 * (x0, y0, z0) to (x1, y1, z1) with linear charge density lambda.
 *
 * @param x0_     {Double} The x coordinate one end cap of the cylinder.
 * @param y0_     {Double} The y coordinate one end cap of the cylinder.
 * @param z0_     {Double} The z coordinate one end cap of the cylinder.
 * @param x1_     {Double} The x coordinate for the other end cap of the cylinder.
 * @param y1_     {Double} The y coordinate for the other end cap of the cylinder.
 * @param z1_     {Double} The z coordinate for the other end cap of the cylinder.
 * @param lambda_ {Double} The linear charge density on the line.
 *
 * @constructor
 */
function chargedLine(x0_, y0_, z0_, x1_, y1_, z1_, lambda_, rho_)
{
  /** Container for r,g,b,a color values. */
  var color;
  var height;
  var lambda;
  /** Transforms the base cylinder to the r=r1 cylinder. */
  var modelViewMatrix;
  /** Rotation angles around the y and z axes */
  var phi, theta;
  /** The density of field line per unit charge. */
  var rho;
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
   * Create a set of start points along the base line charge, then transform them
   * with the model view to get the true location in the scene.
   */
  this.getStartPoints     = function()
  {
    /** The separation between sets of field lines. */
    var ds;
    var npoints;
    var s;
    var sgn;
    /** sin(Pi/4) */
    var sinpi4;
    var startPoints;

    sinpi4      = 0.707106781;
    startPoints = new Array();

    if (rho != 0)
    {
      sgn         = this.sign(lambda);

      npoints     = Math.max(2, Math.round(Math.abs(lambda*rho*height)));
      s           = -0.5;
      ds          = 1/(npoints-1);

      for (var i=0; i<npoints; i++)
      {
        startPoints.push(new Array(    1.0,     0.0, s, sgn));
        startPoints.push(new Array(   -1.0,     0.0, s, sgn));
        startPoints.push(new Array(    0.0,     1.0, s, sgn));
        startPoints.push(new Array(    0.0,    -1.0, s, sgn));
        startPoints.push(new Array( sinpi4,  sinpi4, s, sgn));
        startPoints.push(new Array( sinpi4, -sinpi4, s, sgn));
        startPoints.push(new Array(-sinpi4, -sinpi4, s, sgn));
        startPoints.push(new Array(-sinpi4,  sinpi4, s, sgn));
        s += ds;
      }
    }

    return this.transformPoints(modelViewMatrix,             height/this.getBaseHeight(),
                                (r0+1)/this.getBaseRadius(), startPoints);
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
    var n, nmag;
    
    n    = this.getNormal(x,y,z);
    nmag = Math.sqrt(n.x*n.x + n.y*n.y + n.z*n.z);

    f    = new Array(3);
    fmag = 2*lambda/nmag;

    f[0] = fmag * n.x/nmag;
    f[1] = fmag * n.y/nmag;
    f[2] = fmag * n.z/nmag;

    return f;
  }

  this.render                 = function(gl, surfaceProgram)
  {
    this.fullRender(gl, surfaceProgram, modelViewMatrix, height, r0, r1, false);
  }

  lambda = lambda_;
  if (lambda > 0)
  {
    color = new Color(0.05, 0.05, 0.8, 0.80);
  }
  else if (lambda < 0)
  {
    color = new Color(0.8, 0.05, 0.05, 0.80);
  }
  else
  {
    // Neutral surfaces are grey
    color = new Color(0.5, 0.5, 0.5, 0.80);
  }

  this.setColor(color);

  // Stock radius for a charged line.
  r0     = 0;
  r1     = 3;
  rho    = rho_;
  x0     = x0_;
  y0     = y0_;
  z0     = z0_;
  x1     = x1_;
  y1     = y1_;
  z1     = z1_;

  this.translateBounds(this, x0, y0, z0, x1, y1, z1);
  this.zAxisRotation(this, x0, y0, x1, y1);
  this.yAxisRotation(this, x0, y0, z0, x1, y1, z1);
  this.scale(this, z0, z1);

  // Restore these after the transformation is done.
  x0     = x0_;
  y0     = y0_;
  z0     = z0_;
  x1     = x1_;
  y1     = y1_;
  z1     = z1_;

  modelViewMatrix = this.getCylinderModelView(tx, ty, tz, this.getBaseHeight(), this.getBaseRadius(), phi, theta);
  x10             = x1-x0;
  y10             = y1-y0;
  z10             = z1-z0;
  mag10           = Math.sqrt(x10*x10 + y10*y10 + z10*z10);
}

/**
 * chargedLine extends cylinder.
 */
chargedLine.prototype = new cylinder();