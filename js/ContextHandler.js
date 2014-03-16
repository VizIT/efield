/**
 * Handle context lost and context restored events from the canvas.
 *
 * @class
 * @param {canvas} An HTML5 canvas canvas we will draw onto.
 * @param {efield} An efield object with methods for establishing gl context and
 *                 rendering geometries.
 */
function GLContextEventHandler(drawingSurface_, renderer_)
{
  var drawingSurface;
  var renderer;

  /**
   * Per 5.15.2 The Context Lost Event of the <a href =
   * "http://www.khronos.org/registry/webgl/specs/latest/1.0/">current spec</a>
   * this enables the webglcontextrestored event to be delivered
   */
  this.contextLost     = function(event)
  {
    event.preventDefault();
  }

  this.contextRestored = function(event)
  {
    // Get gl, load textures.
    renderer.initializeContext(drawingSurface);

    // Wait for the textures to load.
    latch = new countdownLatch(2, renderer.initialRender.bind(renderer));
  }

  drawingSurface = drawingSurface_;
  renderer       = renderer_;
}
