import { Vec, VecLike, precise, rng, EASINGS, average } from "@tldraw/editor";
import {
  CubicSpline2d,
  Polyline2d,
  TLLineShape,
  getSvgPathFromPoints,
} from "@tldraw/editor";

export interface StrokeOptions {
  /** The base size (diameter) of the stroke. */
  size?: number;
  /** The effect of pressure on the stroke's size. */
  thinning?: number;
  /** How much to soften the stroke's edges. */
  smoothing?: number;
  streamline?: number;
  /** An easing function to apply to each point's pressure. */
  easing?(pressure: number): number;
  /** Whether to simulate pressure based on velocity. */
  simulatePressure?: boolean;
  /** Cap, taper and easing for the start of the line. */
  start?: {
    cap?: boolean;
    taper?: number | boolean;
    easing?(distance: number): number;
  };
  /** Cap, taper and easing for the end of the line. */
  end?: {
    cap?: boolean;
    taper?: number | boolean;
    easing?(distance: number): number;
  };
  /** Whether to handle the points as a completed stroke. */
  last?: boolean;
}

/**
 * The points returned by `getStrokePoints`, and the input for `getStrokeOutlinePoints`
 *
 * @public
 */
export interface StrokePoint {
  point: Vec;
  input: Vec;
  vector: Vec;
  pressure: number;
  distance: number;
  runningLength: number;
  radius: number;
}

export function getDrawLinePathData(
  id: string,
  outline: VecLike[],
  strokeWidth: number
) {
  let innerPathData = `M ${precise(outline[0])}L`;
  let outerPathData2 = `M ${precise(outline[0])}L`;

  const offset = strokeWidth / 3;
  const roundness = strokeWidth * 2;

  const random = rng(id);
  let p0 = outline[0];
  let p1: VecLike;

  let s0 = outline[0];
  let s1: VecLike;

  const len = outline.length;

  for (let i = 0, n = len - 1; i < n; i++) {
    p1 = outline[i + 1];
    s1 = Vec.AddXY(outline[i + 1], random() * offset, random() * offset);

    const delta = Vec.Sub(p1, p0);
    const distance = Vec.Len(delta);
    const vector = Vec.Div(delta, distance).mul(
      Math.min(distance / 4, roundness)
    );

    const q0 = Vec.Add(p0, vector);
    const q1 = Vec.Add(p1, vector.neg());

    const sDelta = Vec.Sub(s1, s0);
    const sDistance = Vec.Len(sDelta);
    const sVector = Vec.Div(sDelta, sDistance).mul(
      Math.min(sDistance / 4, roundness)
    );

    const sq0 = Vec.Add(s0, sVector);
    const sq1 = Vec.Add(s1, sVector.neg());

    if (i === n - 1) {
      innerPathData += `${precise(q0)}L ${precise(p1)}`;
      outerPathData2 += `${precise(sq0)}L ${precise(s1)}`;
    } else {
      innerPathData += `${precise(q0)}L ${precise(q1)}Q ${precise(p1)}`;
      outerPathData2 += `${precise(sq0)}L ${precise(sq1)}Q ${precise(s1)}`;

      p0 = p1;
      s0 = s1;
    }
  }

  return [innerPathData, innerPathData + outerPathData2];
}

/**
 * Calculates the path data for drawing a line with rounded corners.
 *
 * @param id - The identifier for the line.
 * @param outline - An array of points representing the line's outline.
 * @param strokeWidth - The width of the line stroke.
 * @returns An array containing the inner and outer path data for the line.
 */

const { PI, min } = Math;

// Browser strokes seem to be off if PI is regular, a tiny offset seems to fix it
const FIXED_PI = PI + 0.0001;

export function getStrokeOutlineTracks(
  strokePoints: StrokePoint[],
  options: StrokeOptions = {}
): { left: Vec[]; right: Vec[] } {
  const { size = 16, smoothing = 0.5 } = options;

  // We can't do anything with an empty array or a stroke with negative size.
  if (strokePoints.length === 0 || size <= 0) {
    return { left: [], right: [] };
  }

  const firstStrokePoint = strokePoints[0];
  const lastStrokePoint = strokePoints[strokePoints.length - 1];

  // The total length of the line
  const totalLength = lastStrokePoint.runningLength;

  // The minimum allowed distance between points (squared)
  const minDistance = Math.pow(size * smoothing, 2);

  // Our collected left and right points
  const leftPts: Vec[] = [];
  const rightPts: Vec[] = [];

  // Previous vector
  let prevVector = strokePoints[0].vector;

  // Previous left and right points
  let pl = strokePoints[0].point;
  let pr = pl;

  // Temporary left and right points
  let tl = pl;
  let tr = pr;

  // Keep track of whether the previous point is a sharp corner
  // ... so that we don't detect the same corner twice
  let isPrevPointSharpCorner = false;

  /*
    Find the outline's left and right points

    Iterating through the points and populate the rightPts and leftPts arrays,
    skipping the first and last pointsm, which will get caps later on.
  */

  let strokePoint: StrokePoint;

  for (let i = 0; i < strokePoints.length; i++) {
    strokePoint = strokePoints[i];
    const { point, vector } = strokePoints[i];

    /*
      Handle sharp corners

      Find the difference (dot product) between the current and next vector.
      If the next vector is at more than a right angle to the current vector,
      draw a cap at the current point.
    */

    const prevDpr = strokePoint.vector.dpr(prevVector);
    const nextVector = (
      i < strokePoints.length - 1 ? strokePoints[i + 1] : strokePoints[i]
    ).vector;
    const nextDpr =
      i < strokePoints.length - 1 ? nextVector.dpr(strokePoint.vector) : 1;

    const isPointSharpCorner = prevDpr < 0 && !isPrevPointSharpCorner;
    const isNextPointSharpCorner = nextDpr !== null && nextDpr < 0.2;

    if (isPointSharpCorner || isNextPointSharpCorner) {
      // It's a sharp corner. Draw a rounded cap and move on to the next point
      // Considering saving these and drawing them later? So that we can avoid
      // crossing future points.

      if (
        nextDpr > -0.62 &&
        totalLength - strokePoint.runningLength > strokePoint.radius
      ) {
        // Draw a "soft" corner
        const offset = prevVector.clone().mul(strokePoint.radius);
        const cpr = prevVector.clone().cpr(nextVector);

        if (cpr < 0) {
          tl = Vec.Add(point, offset);
          tr = Vec.Sub(point, offset);
        } else {
          tl = Vec.Sub(point, offset);
          tr = Vec.Add(point, offset);
        }

        leftPts.push(tl);
        rightPts.push(tr);
      } else {
        // Draw a "sharp" corner
        const offset = prevVector.clone().mul(strokePoint.radius).per();
        const start = Vec.Sub(strokePoint.input, offset);

        for (let step = 1 / 13, t = 0; t < 1; t += step) {
          tl = Vec.RotWith(start, strokePoint.input, FIXED_PI * t);
          leftPts.push(tl);

          tr = Vec.RotWith(start, strokePoint.input, FIXED_PI + FIXED_PI * -t);
          rightPts.push(tr);
        }
      }

      pl = tl;
      pr = tr;

      if (isNextPointSharpCorner) {
        isPrevPointSharpCorner = true;
      }

      continue;
    }

    isPrevPointSharpCorner = false;

    if (strokePoint === firstStrokePoint || strokePoint === lastStrokePoint) {
      const offset = Vec.Per(vector).mul(strokePoint.radius);
      leftPts.push(Vec.Sub(point, offset));
      rightPts.push(Vec.Add(point, offset));

      continue;
    }

    /* 
      Add regular points

      Project points to either side of the current point, using the
      calculated size as a distance. If a point's distance to the 
      previous point on that side greater than the minimum distance
      (or if the corner is kinda sharp), add the points to the side's
      points array.
    */

    const offset = Vec.Lrp(nextVector, vector, nextDpr)
      .per()
      .mul(strokePoint.radius);

    tl = Vec.Sub(point, offset);

    if (i <= 1 || Vec.Dist2(pl, tl) > minDistance) {
      leftPts.push(tl);
      pl = tl;
    }

    tr = Vec.Add(point, offset);

    if (i <= 1 || Vec.Dist2(pr, tr) > minDistance) {
      rightPts.push(tr);
      pr = tr;
    }

    // Set variables for next iteration
    prevVector = vector;

    continue;
  }

  /*
    Return the points in the correct winding order: begin on the left side, then 
    continue around the end cap, then come back along the right side, and finally 
    complete the start cap.
  */

  return {
    left: leftPts,
    right: rightPts,
  };
}

/**
 * ## getStrokeOutlinePoints
 *
 * Get an array of points (as `[x, y]`) representing the outline of a stroke.
 *
 * @param points - An array of StrokePoints as returned from `getStrokePoints`.
 * @param options - An object with options.
 * @public
 */
export function getStrokeOutlinePoints(
  strokePoints: StrokePoint[],
  options: StrokeOptions = {}
): Vec[] {
  const { size = 16, start = {}, end = {}, last: isComplete = false } = options;

  const { cap: capStart = true } = start;
  const { cap: capEnd = true } = end;

  // We can't do anything with an empty array or a stroke with negative size.
  if (strokePoints.length === 0 || size <= 0) {
    return [];
  }

  const firstStrokePoint = strokePoints[0];
  const lastStrokePoint = strokePoints[strokePoints.length - 1];

  // The total length of the line
  const totalLength = lastStrokePoint.runningLength;

  const taperStart =
    start.taper === false
      ? 0
      : start.taper === true
      ? Math.max(size, totalLength)
      : (start.taper as number);

  const taperEnd =
    end.taper === false
      ? 0
      : end.taper === true
      ? Math.max(size, totalLength)
      : (end.taper as number);

  // The minimum allowed distance between points (squared)
  // Our collected left and right points
  const { left: leftPts, right: rightPts } = getStrokeOutlineTracks(
    strokePoints,
    options
  );

  /*
    Drawing caps
    
    Now that we have our points on either side of the line, we need to
    draw caps at the start and end. Tapered lines don't have caps, but
    may have dots for very short lines.
  */

  const firstPoint = firstStrokePoint.point;

  const lastPoint =
    strokePoints.length > 1
      ? strokePoints[strokePoints.length - 1].point
      : Vec.AddXY(firstStrokePoint.point, 1, 1);

  /* 
    Draw a dot for very short or completed strokes
    
    If the line is too short to gather left or right points and if the line is
    not tapered on either side, draw a dot. If the line is tapered, then only
    draw a dot if the line is both very short and complete. If we draw a dot,
    we can just return those points.
  */

  if (strokePoints.length === 1) {
    if (!(taperStart || taperEnd) || isComplete) {
      const start = Vec.Add(
        firstPoint,
        Vec.Sub(firstPoint, lastPoint).uni().per().mul(-firstStrokePoint.radius)
      );
      const dotPts: Vec[] = [];
      for (let step = 1 / 13, t = step; t <= 1; t += step) {
        dotPts.push(Vec.RotWith(start, firstPoint, FIXED_PI * 2 * t));
      }
      return dotPts;
    }
  }

  /*
    Draw a start cap

    Unless the line has a tapered start, or unless the line has a tapered end
    and the line is very short, draw a start cap around the first point. Use
    the distance between the second left and right point for the cap's radius.
    Finally remove the first left and right points. :psyduck:
  */

  const startCap: Vec[] = [];
  if (taperStart || (taperEnd && strokePoints.length === 1)) {
    // The start point is tapered, noop
  } else if (capStart) {
    // Draw the round cap - add thirteen points rotating the right point around the start point to the left point
    for (let step = 1 / 8, t = step; t <= 1; t += step) {
      const pt = Vec.RotWith(rightPts[0], firstPoint, FIXED_PI * t);
      startCap.push(pt);
    }
  } else {
    // Draw the flat cap - add a point to the left and right of the start point
    const cornersVector = Vec.Sub(leftPts[0], rightPts[0]);
    const offsetA = Vec.Mul(cornersVector, 0.5);
    const offsetB = Vec.Mul(cornersVector, 0.51);

    startCap.push(
      Vec.Sub(firstPoint, offsetA),
      Vec.Sub(firstPoint, offsetB),
      Vec.Add(firstPoint, offsetB),
      Vec.Add(firstPoint, offsetA)
    );
  }

  /*
    Draw an end cap

    If the line does not have a tapered end, and unless the line has a tapered
    start and the line is very short, draw a cap around the last point. Finally,
    remove the last left and right points. Otherwise, add the last point. Note
    that This cap is a full-turn-and-a-half: this prevents incorrect caps on
    sharp end turns.
  */

  const endCap: Vec[] = [];
  const direction = lastStrokePoint.vector.clone().per().neg();

  if (taperEnd || (taperStart && strokePoints.length === 1)) {
    // Tapered end - push the last point to the line
    endCap.push(lastPoint);
  } else if (capEnd) {
    // Draw the round end cap
    const start = Vec.Add(
      lastPoint,
      Vec.Mul(direction, lastStrokePoint.radius)
    );
    for (let step = 1 / 29, t = step; t < 1; t += step) {
      endCap.push(Vec.RotWith(start, lastPoint, FIXED_PI * 3 * t));
    }
  } else {
    // Draw the flat end cap
    endCap.push(
      Vec.Add(lastPoint, Vec.Mul(direction, lastStrokePoint.radius)),
      Vec.Add(lastPoint, Vec.Mul(direction, lastStrokePoint.radius * 0.99)),
      Vec.Sub(lastPoint, Vec.Mul(direction, lastStrokePoint.radius * 0.99)),
      Vec.Sub(lastPoint, Vec.Mul(direction, lastStrokePoint.radius))
    );
  }

  /*
    Return the points in the correct winding order: begin on the left side, then 
    continue around the end cap, then come back along the right side, and finally 
    complete the start cap.
  */

  return leftPts.concat(endCap, rightPts.reverse(), startCap);
}

const MIN_START_PRESSURE = 0.025;
const MIN_END_PRESSURE = 0.01;

/**
 * ## getStrokePoints
 *
 * Get an array of points as objects with an adjusted point, pressure, vector, distance, and
 * runningLength.
 *
 * @param points - An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is
 *   optional in both cases.
 * @param options - An object with options.
 * @public
 */
export function getStrokePoints(
  rawInputPoints: VecLike[],
  options: StrokeOptions = {}
): StrokePoint[] {
  const { streamline = 0.5, size = 16, simulatePressure = false } = options;

  // If we don't have any points, return an empty array.
  if (rawInputPoints.length === 0) return [];

  // Find the interpolation level between points.
  const t = 0.15 + (1 - streamline) * 0.85;

  // Whatever the input is, make sure that the points are in number[][].
  let pts = rawInputPoints.map(Vec.From);

  let pointsRemovedFromNearEnd = 0;

  if (!simulatePressure) {
    // Strip low pressure points from the start of the array.
    let pt = pts[0];
    while (pt) {
      if (pt.z >= MIN_START_PRESSURE) break;
      pts.shift();
      pt = pts[0];
    }
  }

  if (!simulatePressure) {
    // Strip low pressure points from the end of the array.
    let pt = pts[pts.length - 1];
    while (pt) {
      if (pt.z >= MIN_END_PRESSURE) break;
      pts.pop();
      pt = pts[pts.length - 1];
    }
  }

  if (pts.length === 0)
    return [
      {
        point: Vec.From(rawInputPoints[0]),
        input: Vec.From(rawInputPoints[0]),
        pressure: simulatePressure ? 0.5 : 0.15,
        vector: new Vec(1, 1),
        distance: 0,
        runningLength: 0,
        radius: 1,
      },
    ];

  // Strip points that are too close to the first point.
  let pt = pts[1];
  while (pt) {
    if (Vec.Dist2(pt, pts[0]) > (size / 3) ** 2) break;
    pts[0].z = Math.max(pts[0].z, pt.z); // Use maximum pressure
    pts.splice(1, 1);
    pt = pts[1];
  }

  // Strip points that are too close to the last point.
  const last = pts.pop()!;
  pt = pts[pts.length - 1];
  while (pt) {
    if (Vec.Dist2(pt, last) > (size / 3) ** 2) break;
    pts.pop();
    pt = pts[pts.length - 1];
    pointsRemovedFromNearEnd++;
  }
  pts.push(last);

  const isComplete =
    options.last ||
    !options.simulatePressure ||
    (pts.length > 1 &&
      Vec.Dist2(pts[pts.length - 1], pts[pts.length - 2]) < size ** 2) ||
    pointsRemovedFromNearEnd > 0;

  // Add extra points between the two, to help avoid "dash" lines
  // for strokes with tapered start and ends. Don't mutate the
  // input array!
  if (pts.length === 2 && options.simulatePressure) {
    const last = pts[1];
    pts = pts.slice(0, -1);
    for (let i = 1; i < 5; i++) {
      const next = Vec.Lrp(pts[0], last, i / 4);
      next.z = ((pts[0].z + (last.z - pts[0].z)) * i) / 4;
      pts.push(next);
    }
  }

  // The strokePoints array will hold the points for the stroke.
  // Start it out with the first point, which needs no adjustment.
  const strokePoints: StrokePoint[] = [
    {
      point: pts[0],
      input: pts[0],
      pressure: simulatePressure ? 0.5 : pts[0].z,
      vector: new Vec(1, 1),
      distance: 0,
      runningLength: 0,
      radius: 1,
    },
  ];

  // We use the totalLength to keep track of the total distance
  let totalLength = 0;

  // We're set this to the latest point, so we can use it to calculate
  // the distance and vector of the next point.
  let prev = strokePoints[0];

  // Iterate through all of the points, creating StrokePoints.
  let point: Vec, distance: number;

  if (isComplete && streamline > 0) {
    pts.push(pts[pts.length - 1].clone());
  }

  for (let i = 1, n = pts.length; i < n; i++) {
    point =
      !t || (options.last && i === n - 1)
        ? pts[i].clone()
        : pts[i].clone().lrp(prev.point, 1 - t);

    // If the new point is the same as the previous point, skip ahead.
    if (prev.point.equals(point)) continue;

    // How far is the new point from the previous point?
    distance = Vec.Dist(point, prev.point);

    // Add this distance to the total "running length" of the line.
    totalLength += distance;

    // At the start of the line, we wait until the new point is a
    // certain distance away from the original point, to avoid noise

    if (i < 4 && totalLength < size) {
      continue;
    }

    // Create a new strokepoint (it will be the new "previous" one).
    prev = {
      input: pts[i],
      // The adjusted point
      point,
      // The input pressure (or .5 if not specified)
      pressure: simulatePressure ? 0.5 : pts[i].z,
      // The vector from the current point to the previous point
      vector: Vec.Sub(prev.point, point).uni(),
      // The distance between the current point and the previous point
      distance,
      // The total distance so far
      runningLength: totalLength,
      // The stroke point's radius
      radius: 1,
    };

    // Push it to the strokePoints array.
    strokePoints.push(prev);
  }

  // Set the vector of the first point to be the same as the second point.
  if (strokePoints[1]?.vector) {
    strokePoints[0].vector = strokePoints[1].vector.clone();
  }

  if (totalLength < 1) {
    const maxPressureAmongPoints = Math.max(
      0.5,
      ...strokePoints.map((s) => s.pressure)
    );
    strokePoints.forEach((s) => (s.pressure = maxPressureAmongPoints));
  }

  return strokePoints;
}

function getLineDrawFreehandOptions(strokeWidth: number) {
  return {
    size: strokeWidth,
    thinning: 0.4,
    streamline: 0,
    smoothing: 0.5,
    simulatePressure: true,
    last: true,
  };
}

function getLineStrokePoints(
  shape: TLLineShape,
  spline: CubicSpline2d | Polyline2d,
  strokeWidth: number
) {
  // const points = getLinePoints(spline)
  const points = spline.vertices;
  const options = getLineDrawFreehandOptions(strokeWidth);
  return getStrokePoints(points, options);
}

function getLineDrawStrokeOutlinePoints(
  shape: TLLineShape,
  spline: CubicSpline2d | Polyline2d,
  strokeWidth: number
) {
  const options = getLineDrawFreehandOptions(strokeWidth);
  return getStrokeOutlinePoints(
    setStrokePointRadii(
      getLineStrokePoints(shape, spline, strokeWidth),
      options
    ),
    options
  );
}

export function getLineDrawPath(
  shape: TLLineShape,
  spline: CubicSpline2d | Polyline2d,
  strokeWidth: number
) {
  const stroke = getLineDrawStrokeOutlinePoints(shape, spline, strokeWidth);
  return getSvgPathFromPoints(stroke);
}

export function getLineIndicatorPath(
  shape: TLLineShape,
  spline: CubicSpline2d | Polyline2d,
  strokeWidth: number
) {
  if (shape.props.dash === "draw") {
    const strokePoints = getLineStrokePoints(shape, spline, strokeWidth);
    return getSvgPathFromStrokePoints(strokePoints);
  }

  return spline.getSvgPathData();
}

// This is the rate of change for simulated pressure. It could be an option.
const RATE_OF_PRESSURE_CHANGE = 0.275;

/** @public */
export function setStrokePointRadii(
  strokePoints: StrokePoint[],
  options: StrokeOptions
) {
  const {
    size = 16,
    thinning = 0.5,
    simulatePressure = true,
    easing = (t) => t,
    start = {},
    end = {},
  } = options;

  const { easing: taperStartEase = EASINGS.easeOutQuad } = start;
  const { easing: taperEndEase = EASINGS.easeOutCubic } = end;

  const totalLength = strokePoints[strokePoints.length - 1].runningLength;

  let firstRadius: number | undefined;
  let prevPressure = strokePoints[0].pressure;
  let strokePoint: StrokePoint;

  if (!simulatePressure && totalLength < size) {
    const max = strokePoints.reduce(
      (max, curr) => Math.max(max, curr.pressure),
      0.5
    );
    strokePoints.forEach((sp) => {
      sp.pressure = max;
      sp.radius = size * easing(0.5 - thinning * (0.5 - sp.pressure));
    });
    return strokePoints;
  } else {
    // Calculate initial pressure based on the average of the first
    // n number of points. This prevents "dots" at the start of the
    // line. Drawn lines almost always start slow!
    let p: number;
    for (let i = 0, n = strokePoints.length; i < n; i++) {
      strokePoint = strokePoints[i];
      if (strokePoint.runningLength > size * 5) break;
      const sp = min(1, strokePoint.distance / size);
      if (simulatePressure) {
        const rp = min(1, 1 - sp);
        p = min(
          1,
          prevPressure + (rp - prevPressure) * (sp * RATE_OF_PRESSURE_CHANGE)
        );
      } else {
        p = min(1, prevPressure + (strokePoint.pressure - prevPressure) * 0.5);
      }
      prevPressure = prevPressure + (p - prevPressure) * 0.5;
    }

    // Now calculate pressure and radius for each point
    for (let i = 0; i < strokePoints.length; i++) {
      strokePoint = strokePoints[i];
      if (thinning) {
        let { pressure } = strokePoint;
        const sp = min(1, strokePoint.distance / size);
        if (simulatePressure) {
          // If we're simulating pressure, then do so based on the distance
          // between the current point and the previous point, and the size
          // of the stroke.
          const rp = min(1, 1 - sp);
          pressure = min(
            1,
            prevPressure + (rp - prevPressure) * (sp * RATE_OF_PRESSURE_CHANGE)
          );
        } else {
          // Otherwise, use the input pressure slightly smoothed based on the
          // distance between the current point and the previous point.
          pressure = min(
            1,
            prevPressure +
              (pressure - prevPressure) * (sp * RATE_OF_PRESSURE_CHANGE)
          );
        }

        strokePoint.radius = size * easing(0.5 - thinning * (0.5 - pressure));

        prevPressure = pressure;
      } else {
        strokePoint.radius = size / 2;
      }

      if (firstRadius === undefined) {
        firstRadius = strokePoint.radius;
      }
    }
  }

  const taperStart =
    start.taper === false
      ? 0
      : start.taper === true
      ? Math.max(size, totalLength)
      : (start.taper as number);

  const taperEnd =
    end.taper === false
      ? 0
      : end.taper === true
      ? Math.max(size, totalLength)
      : (end.taper as number);

  if (taperStart || taperEnd) {
    for (let i = 0; i < strokePoints.length; i++) {
      strokePoint = strokePoints[i];
      /*
				Apply tapering

				If the current length is within the taper distance at either the
				start or the end, calculate the taper strengths. Apply the smaller 
				of the two taper strengths to the radius.
			*/

      const { runningLength } = strokePoint;

      const ts =
        runningLength < taperStart
          ? taperStartEase(runningLength / taperStart)
          : 1;

      const te =
        totalLength - runningLength < taperEnd
          ? taperEndEase((totalLength - runningLength) / taperEnd)
          : 1;

      strokePoint.radius = Math.max(
        0.01,
        strokePoint.radius * Math.min(ts, te)
      );
    }
  }

  return strokePoints;
}

export function getSvgPathFromStrokePoints(
  points: StrokePoint[],
  closed = false
): string {
  const len = points.length;

  if (len < 2) {
    return "";
  }

  let a = points[0].point;
  let b = points[1].point;

  if (len === 2) {
    return `M${precise(a)}L${precise(b)}`;
  }

  let result = "";

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i].point;
    b = points[i + 1].point;
    result += average(a, b);
  }

  if (closed) {
    // If closed, draw a curve from the last point to the first
    return `M${average(points[0].point, points[1].point)}Q${precise(
      points[1].point
    )}${average(points[1].point, points[2].point)}T${result}${average(
      points[len - 1].point,
      points[0].point
    )}${average(points[0].point, points[1].point)}Z`;
  } else {
    // If not closed, draw a curve starting at the first point and
    // ending at the midpoint of the last and second-last point, then
    // complete the curve with a line segment to the last point.
    return `M${precise(points[0].point)}Q${precise(points[1].point)}${average(
      points[1].point,
      points[2].point
    )}${points.length > 3 ? "T" : ""}${result}L${precise(
      points[len - 1].point
    )}`;
  }
}
