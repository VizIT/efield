/**
 * Handle mouse and touch events for manipulting WebGL graphics
 */

function motionEventHandler(target_)
{
  var activeTouches;
  // Is the mouse pressed in the canvas. Ignore mouse event if not.
  var inprogress;
  var lastX;
  var lastY;
  var target;

  activeTouches = new Array();
  inprogress    = false;
  lastX         = null;
  lastY         = null;
  target        = target_;

  this.findTouchByIdentifier = function(identifier_)
  {
    var i;
    var identifier;

    for (i=0; i<activeTouches.length; i++)
    {
      identifier = activeTouches[i].identifier;

      if (identifier == identifier_)
      {
        return i;
      }
    }
    // Never found a match
    return -1;
  }


  this.handleTouchStart = function(event)
  {
    var i;
    var touch;
    var touches;

    // We only care abut touches that at least started out in the
    // element.
    touches = event.targetTouches;

    for (i=0; i<touches.length; i++)
    {
      touch = touches[i];
      if (this.findTouchByIdentifier(touch.identifier) == -1)
      {
        activeTouches.push(touch);
      }
        
    }

    // Indicate we have done all needed processing on this event
    if (event.preventDefault)
    {
        event.preventDefault();
    }
    else
    {
	return false;
    }
  }

  this.handleTouchEnd = function(event)
  {
    var i;
    var index;
    var touches;

    // The touches that triggered the event.
    touches = event.changedTouches;

    for(i=0; i<touches.length; i++)
    {
      index = this.findTouchByIdentifier(touches[i].identifier);
      if (index != -1)
      {
        // Remove the one entry at index from the array.
        activeTouches.splice(index, 1);
      }
    }

    // Indicate we have done all needed processing on this event
    if (event.preventDefault)
    {
        event.preventDefault();
    }
    else
    {
	return false;
    }
  }

  /*
   * Touch move events when there is one active touch are delegated
   * to this method. These move events are translated into a rotation.
   */
  this.handleOneActiveMove = function(event)
  {
    var deltaX;
    var deltaY;
    var modelViewMatrix;
    var newTouch;
    var oldTouch;

    newTouch = event.changedTouches[0];
    oldTouch = activeTouches[0];
    if (oldTouch != null)
    {
      deltaX   = newTouch.pageX - oldTouch.pageX;
      deltaY   = newTouch.pageY - oldTouch.pageY;

      modelViewMatrix = target.getModelViewMatrix();
      // Rotate the model view by phi radians about the X axis
      // an theta radians about the Y axis.
      rotateXY(modelViewMatrix, deltaY/150, deltaX/150);
      target.setModelViewMatrix(modelViewMatrix);
      target.render();

      // Replace the old touch with the new touch, and hence new location.
      activeTouches.splice(0, 1, newTouch); 
    }
    else
    {
      activeTouches.push(newTouch);
    }

    // Indicate we have done all needed processing on this event
    if (event.preventDefault)
    {
        event.preventDefault();
    }
    else
    {
      return false;
    }
  }

  /*
   * Handle a move event with two active touches. This will correspond to
   * a scale event.
   */
  this.handleTwoActiveMove = function(event)
  {
    var deltaScale;
    var deltaX;
    var deltaY;
    var i;
    var identifier;
    var modelViewMatrix;
    var phi;
    var r0;
    var r1;
    var touch;
    var touch0;
    var touch1;
    var touches;

    touch0  = activeTouches[0];
    touch1  = activeTouches[1];
    deltaX  = touch1.pageX - touch0.pageX;
    deltaY  = touch1.pageY - touch0.pageY;
    r0      = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
    phi     = Math.atan2(deltaY, deltaX);

    touches = event.changedTouches;
     
    for(i=0; i<touches.length; i++)
    {
      touch      = touches[i];
      identifier = touch.identifier;
      // Replace the touch that matches the identifier of the changed touch
      if (touch0.identifier == identifier)
      {
        touch0 = touch;
        activeTouches.splice(0, 1, touch);
      }
      else if (touch1.identifier == identifier)
      {
        touch1 = touch;
        activeTouches.splice(1, 1, touch);
      }
    }

    deltaX     = touch1.pageX - touch0.pageX;
    deltaY     = touch1.pageY - touch0.pageY;
    r1         = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
    // Should this be clockwise or counterclockwise?
    phi        = phi - Math.atan2(deltaY, deltaX);

    modelViewMatrix = target.getModelViewMatrix();
    rotateZ(modelViewMatrix, phi);
    target.setModelViewMatrix(modelViewMatrix);
    
    deltaScale = r1-r0;

    target.zoomBy(-deltaScale/4);

    // Indicate we have done all needed processing on this event
    if (event.preventDefault)
    {
      event.preventDefault();
    }
    else
    {
      return false;
    }
  }

  this.handleTouchMove = function(event)
  {
    if (activeTouches.length == 1)
    {
      return this.handleOneActiveMove(event);
    }
    else if (activeTouches.length == 2)
    {
      return this.handleTwoActiveMove(event);
    }
    return true;
  }

  this.handleMouseDown = function(event)
  {
    inprogress = true;
    lastX      = event.clientX;
    lastY      = event.clientY;
  }

  this.handleMouseUp  = function(event)
  {
    inprogress = false;
  }

  this.handleMouseMove = function(event)
  {
    if (!inprogress)
    {
      return;
    }

    var modelViewMatrix;

    var newX   = event.clientX;
    var newY   = event.clientY;

    var deltaX = newX - lastX;
    var deltaY = newY - lastY;

    modelViewMatrix = target.getModelViewMatrix();

    if(event.shiftKey)
    {
      rotateZ(modelViewMatrix, (deltaY + deltaX)/30);
    }
    else
    {
      // Rotate the model view by phi radians about the X axis
      // an theta radians about the Y axis.
      rotateXY(modelViewMatrix, deltaY/30, deltaX/30);
    }

    target.setModelViewMatrix(modelViewMatrix);
    target.render();

    lastX = newX
    lastY = newY;
  }

  this.handleMouseWheel = function(event_)
  {
    var event;

    //equalize event object
    event=window.event || event_;

    target.zoomBy(event.wheelDeltaY/8);

    // Indicate we have done all needed processing on this event
    if (event.preventDefault)
    {
        event.preventDefault();
    }
    else
    {
	return false;
    }
  }
}
