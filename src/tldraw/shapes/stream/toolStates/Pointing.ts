import {
  Mat,
  StateNode,
  TLClickEvent,
  TLLineShape,
  TLShapeId,
  Vec,
  createShapeId,
  getIndexAbove,
  sortByIndex,
  structuredClone,
} from "@tldraw/editor";

const MINIMUM_DISTANCE_BETWEEN_SHIFT_CLICKED_HANDLES = 2;

export class Pointing extends StateNode {
  static override id = "pointing";

  shape = {} as TLLineShape;

  markId: string | undefined;

  override onEnter = (info: { shapeId?: TLShapeId }) => {
    const { inputs } = this.editor;
    const { currentPagePoint } = inputs;

    this.markId = undefined;

    // Previously created line shape that we might be extending
    const shape =
      info.shapeId && this.editor.getShape<TLLineShape>(info.shapeId);

    if (shape && inputs.shiftKey) {
      // Extending a previous shape
      //   this.markId = this.editor.markHistoryStoppingPoint(
      //     `creating_line:${shape.id}`
      //   );
      // this.shape = shape;

      const handles = this.editor.getShapeHandles(this.shape);
      if (!handles) return;

      const vertexHandles = handles
        .filter((h) => h.type === "vertex")
        .sort(sortByIndex);
      const endHandle = vertexHandles[vertexHandles.length - 1];
      const prevEndHandle = vertexHandles[vertexHandles.length - 2];

      const shapePagePoint = Mat.applyToPoint(
        this.editor.getShapeParentTransform(this.shape)!,
        new Vec(this.shape.x, this.shape.y)
      );

      const nextPoint = Vec.Sub(currentPagePoint, shapePagePoint).addXY(
        0.1,
        0.1
      );
      const points = structuredClone(this.shape.props.points);

      if (
        Vec.DistMin(
          endHandle,
          prevEndHandle,
          MINIMUM_DISTANCE_BETWEEN_SHIFT_CLICKED_HANDLES
        ) ||
        Vec.DistMin(
          nextPoint,
          endHandle,
          MINIMUM_DISTANCE_BETWEEN_SHIFT_CLICKED_HANDLES
        )
      ) {
        // Don't add a new point if the distance between the last two points is too small
        points[endHandle.id] = {
          id: endHandle.id,
          index: endHandle.index,
          x: nextPoint.x,
          y: nextPoint.y,
        };
      } else {
        // Add a new point
        const nextIndex = getIndexAbove(endHandle.index);
        points[nextIndex] = {
          id: nextIndex,
          index: nextIndex,
          x: nextPoint.x,
          y: nextPoint.y,
        };
      }

      this.editor.updateShapes([
        {
          id: this.shape.id,
          type: this.shape.type,
          props: {
            points,
          },
        },
      ]);
    } else {
      const id = createShapeId();

      //   this.markId = this.editor.markHistoryStoppingPoint(`creating_line:${id}`);

      this.editor.createShapes<TLLineShape>([
        {
          id,
          type: "line",
          x: currentPagePoint.x,
          y: currentPagePoint.y,
          props: {
            scale: this.editor.user.getIsDynamicResizeMode()
              ? 1 / this.editor.getZoomLevel()
              : 1,
          },
        },
      ]);

      this.editor.select(id);
      this.shape = this.editor.getShape(id)!;
    }
  };

  override onPointerMove = () => {
    if (!this.shape) return;

    const handles = this.editor.getShapeHandles(this.shape);
    if (!handles) {
      if (this.markId) this.editor.bailToMark(this.markId);
      throw Error("No handles found");
    }
    //   const lastHandle = last(handles)!;
    const lastHandle = handles[handles.length - 1];
    this.parent.transition("drawing_line", {
      shape: this.shape,
      isCreating: true,
      creatingMarkId: this.markId,
      // remove the offset that we added to the handle when we created it
      handle: { ...lastHandle, x: lastHandle.x - 0.1, y: lastHandle.y - 0.1 },
      onInteractionEnd: "line",
    });
  };

  override onDoubleClick?: TLClickEvent | undefined = () => {
    console.log("Pointing: Double Click");
    this.complete();
  };

  // override onPointerUp = () => {
  //   this.complete();
  // };

  override onCancel = () => {
    this.cancel();
  };

  override onComplete = () => {
    this.complete();
  };

  override onInterrupt = () => {
    this.parent.transition("idle");
    if (this.markId) this.editor.bailToMark(this.markId);
    this.editor.snaps.clearIndicators();
  };

  cancel() {
    if (this.markId) this.editor.bailToMark(this.markId);
    this.parent.transition("idle", { shapeId: this.shape.id });
    this.editor.snaps.clearIndicators();
  }

  private complete() {
    this.editor.snaps.clearIndicators();
    this.editor.setCurrentTool("select");
  }
}
