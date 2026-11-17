// A clamped ease with zero velocity at both ends. Inputs share the frame clock.
export function progress(frame, start, end) {
  const t = Math.min(1, Math.max(0, (frame - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function mix(a, b, t) {
  return a + (b - a) * t;
}

export function morphRect(a, b, t) {
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    width: mix(a.width, b.width, t),
    height: mix(a.height, b.height, t),
    radius: mix(a.radius, b.radius, t),
  };
}

export function boxStyle(box) {
  return {
    position: 'absolute',
    left: box.x,
    top: box.y,
    width: box.width,
    height: box.height,
    borderRadius: box.radius,
  };
}
