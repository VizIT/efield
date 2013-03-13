"use strict";
// Represents a single charge in a set of charges
// A charge has position and a charge in nano-Columbs.
function Charge(Q_, x_, y_, z_)
{
    var Q        = Q_;
    var position = new Array(x_, y_, z_);

    this.getCharge = function()
    {
      return Q;
    }

    this.setPosition = function(position)
    {
      this.position = position;
    }

    this.getPosition = function()
    {
      return position;
    }

    this.getField    = function(x, y, z)
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

      deltaX      = x - position[0];
      deltaY      = y - position[1];
      deltaZ      = z - position[2];

      r2          = deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ;
      if (r2 < 0)
      {
        return field;
      }
      r           = Math.sqrt(r2);
      f           = Q/r2;
      // Similar triangles allows easy distribution of the field into vector components.
      field[0]    = f * deltaX / r;
      field[1]    = f * deltaY / r;
      field[2]    = f * deltaZ / r;

      return field;
    }
}


function Charges()
{
    // Add a charge to the configuration of charges represented by
    // this object. Defined here so we can use it in the constructor.
    this.addCharge = function(charge)
    {
        n = charges.push(charge);
        return n;
    }

    var n       = 0;
    var charges = new Array();

    // If any charges are passed into the constructor, add them immediatly
    // to the set.
    for (var i=0; i<arguments.length; i++)
    {
        n = this.addCharge(arguments[i]);
    }

    this.getCount = function()
    {
        return n;
    }

    this.getCharges = function()
    {
        return charges;
    }

    /*
     * Comnpute the field at x, y, z resulting from our charge
     * configuration.
     */
    this.getField = function(x, y, z)
    {
      var charge;
      // Field from the current charge
      var currentField;
      // The field vector
      var field          = new Array(0, 0, 0);

      for(var i=0; i<n; i++)
      {
        charge         = charges[i];

        currentField   = charge.getField(x, y, z);
        field[0]      += currentField[0];
        field[1]      += currentField[1];
        field[2]      += currentField[2];
      }
      return field;
    }
    
    /*
     * Trace a field line starting at the given x, y, z coordinates.
     * Each step of length ds has components (Ex/E*ds, Ey/E*ds, Ez/E*ds).
     * Steps is usually a Float32Array of size 3*maxPoints + 1. The 0th
     * element of steps will be populated with the number of steps taken
     * tracing the field line.
     */
    this.traceFluxLine = function(x, y, z, sign, ds, points, maxPoints)
    {
        var f;
        var field;
        var i;
        // Offset into points arraw where we are writing the curent point.
        // Advances by 3 for every point.
        var offset;

        for(i=0; i<maxPoints; i++)
        {
            offset           = 3*i + 1;
            points[offset]   = x;
            points[offset+1] = y;
            points[offset+2] = z;
            field            = this.getField(x, y, z);
            f                = Math.sqrt(field[0] * field[0] + field[1] * field[1] + field[2] * field[2]);

            if (f == 0)
            {
                // No field here - no possible flux line
                break;
            }
            x += sign * field[0]/f * ds;
            y += sign * field[1]/f * ds;
            z += sign * field[2]/f * ds;
        }

        // The number of points populating this array.
        points[0] = i;

        return points;
    }
}


function fluxLine(charges_)
{
    // Lines that make up the arrow are drawn with this length.
    var arrowSize;
    // The sum of ds along the path increments by this much between arrows.
    var arrowSpacing;
    // A Float32Array containing two lines (four points) for each arrow.
    var arrows;
    // Each point represents a distance ds along the field line.
    var ds;
    // The charge configuration we are drawing the field lines for.
    var charges   = charges_
    // The maximum number of points along the line to trace.
    var maxPoints = 0;
    // The number of points along the line actually computed.
    var npoints;
    // The number of arrows drawn along the flux line. There are twice this number of lines.
    var narrows;
    // The Float32Array containg the points along the line.
    var points;
    // Whether to trace the line along or in opposition to the electric field.
    var sign;
    // The starting location for the field line.
    var startX;
    var startY;
    var startZ;

    this.getArrows    = function()
    {
        return arrows;
    }

    this.setMaxPoints = function(maxPoints_)
    {
        if (maxPoints_ != maxPoints)
        {
            maxPoints = maxPoints_;
            points    = new Float32Array(3*maxPoints);
            arrows    = new Float32Array(maxPoints);
        }
        return this;
    }

    this.getMaxPoints = function()
    {
      return maxPoints;
    }

    this.setArrowSize    = function(size)
    {
      arrowSize = size;
      return this;
    }

    this.getArrowSize    = function()
    {
      return arrowSize;
    }

    this.setArrowSpacing = function(spacing)
    {
      arrowSpacing = spacing;
      return this;
    }

    this.getArrowSpacing = function()
    {
      return arrowSpacing;
    }

    this.getNarrows   = function()
    {
      return narrows;
    }

    this.getNpoints      = function()
    {
        return npoints;
    }

    this.getPoints       = function()
    {
        return points;
    }

    this.setDs           = function(ds_)
    {
        ds = ds_;
        return this;
    }

    this.getDs           = function()
    {
        return ds;
    }

    this.setSign         = function(sign_)
    {
        sign   = sign_;
        return this;
    }

    this.getSign         = function()
    {
        return sign;
    }

    this.setStartX       = function(startX_)
    {
        startX   = startX_;
        return this;
    }

    this.getStartX       = function()
    {
        return startX;
    }    

    this.setStartY       = function(startY_)
    {
        startY   = startY_;
        return this;
    }

    this.getStartY       = function()
    {
        return startY;
    }

    this.setStartZ       = function(startZ_)
    {
        startZ   = startZ_;
        return this;
    }

    this.getStartZ       = function()
    {
        return startZ;
    }

    /*
     * Generate two lines as an arrow head along the field line indicating the
     * direction of the electric field.
     */
    this.drawArrowOld          = function(x0, y0, z0, sign, field, f, arrowSize, narrows)
    {
        var exnorm;
        var eynorm;
        var eznorm;
        var offset;
        var x1;
        var y1;
        var z1;
        var x2;
        var y2;
        var z2;

        exnorm = field[0]/f;
        eynorm = field[1]/f;
        eznorm = field[2]/f;

        asx    = sign*arrowSize*exnorm;
        asy    = sign*arrowSize*eynorm;
        asz    = sign*arrowSize*eznorm;

        x1     = x0 - asx - 0.5*asy;
        y1     = y0 - asy + 0.5*asx;
        z1     = z0 - asz;

        x2     = x0 - asx + 0.5*asy;
        y2     = y0 - asy - 0.5*asx;
        z2     = z0 - asz;

        offset            = narrows*12;

        arrows[offset]    = x1;
        arrows[offset+1]  = y1;
        arrows[offset+2]  = z1;
        arrows[offset+3]  = x0;
        arrows[offset+4]  = y0;
        arrows[offset+5]  = z0;
        arrows[offset+6]  = x0;
        arrows[offset+7]  = y0;
        arrows[offset+8]  = z0;
        arrows[offset+9]  = x2;
        arrows[offset+10] = y2;
        arrows[offset+11] = z2;
    }

    /*
     * Generate two lines as an arrow head along the field line indicating the
     * direction of the electric field.
     */
    this.drawArrow          = function(x0, y0, z0, sign, field, f, arrowSize, narrows)
    {
        var asx;
        var asy;
        var asz;
        var exnorm;
        var eynorm;
        var eznorm;
        // A vector normal to the Electric field.
        var nx;
        var ny;
        var nz;
        var offset;
        var resize;
        var x1;
        var y1;
        var z1;
        var x2;
        var y2;
        var z2;

        exnorm = field[0]/f;
        eynorm = field[1]/f;
        eznorm = field[2]/f;

        if (eznorm != 0)
        {
            // Start with nx, ny = 1, then E dot n = 0 gives
            nx     = 1;
            ny     = 1;
            nz     = -(field[0]+field[1])/field[2];
        }
        else if (eynorm != 0)
        {
            // Start with nx, nz = 1, then E dot n = 0 gives
            nx     = 1;
            ny     = -(field[0]+field[2])/field[1];
            nz     = 1;
        }
        else
        {
            // Start with ny, nz = 1, then E dot n = 0 gives
            nx     = -(field[1]+field[2])/field[0];
            ny     = 1;
            nz     = 1;
        }

        // Normalize and multipley by the arrow size
        resize = arrowSize/Math.sqrt(nx*nx + ny*ny + nz*nz);

        nx     = nx*resize;
        ny     = ny*resize;
        nz     = nz*resize;

        asx    = sign*arrowSize*exnorm;
        asy    = sign*arrowSize*eynorm;
        asz    = sign*arrowSize*eznorm;

        x1     = x0 - asx + nx;
        y1     = y0 - asy + ny;
        z1     = z0 - asz + nz;

        x2     = x0 - asx - nx;
        y2     = y0 - asy - ny;
        z2     = z0 - asz - nz;

        offset            = narrows*12;

        arrows[offset]    = x1;
        arrows[offset+1]  = y1;
        arrows[offset+2]  = z1;
        arrows[offset+3]  = x0;
        arrows[offset+4]  = y0;
        arrows[offset+5]  = z0;
        arrows[offset+6]  = x0;
        arrows[offset+7]  = y0;
        arrows[offset+8]  = z0;
        arrows[offset+9]  = x2;
        arrows[offset+10] = y2;
        arrows[offset+11] = z2;

    }

    /*
     * Trace a field line starting at the given x, y, z coordinates.
     * Each step of length ds has components (Ex/E*ds, Ey/E*ds, Ez/E*ds).
     * Steps is usually a Float32Array of size 3*maxPoints + 1. The 0th
     * element of steps will be populated with the number of steps taken
     * tracing the field line.
     */
    this.trace = function()
    {
        // The distance traversed along the field line since the last arrow was drawn.
        var deltaS;
        var f;
        var field;
        var i;
        // Offset into points arraw where we are writing the curent point.
        // Advances by 3 for every point.
        var offset;
        var x;
        var y;
        var z;

        deltaS  = 0;
        narrows = 0;
        x       = startX;
        y       = startY;
        z       = startZ;

        for(i=0; i<maxPoints; i++)
        {
            offset           = 3*i;
            points[offset]   = x;
            points[offset+1] = y;
            points[offset+2] = z;
            field            = charges.getField(x, y, z);
            f                = Math.sqrt(field[0] * field[0] + field[1] * field[1] + field[2] * field[2]);

            if (f == 0)
            {
                // No field here - no possible flux line
                break;
            }

            x      += sign * field[0]/f * ds;
            y      += sign * field[1]/f * ds;
            z      += sign * field[2]/f * ds;

            deltaS += ds;

            if (deltaS > arrowSpacing)
            {
                deltaS = 0;
                this.drawArrow(x, y, z, sign, field, f, arrowSize, narrows);
                narrows++;
            }
        }

        // The number of points populating this array.
        npoints = i;
    }

}



