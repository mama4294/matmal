import {
  StateNode,
  TLShapeId,
  TLHandle,
  TLPointerEventInfo,
  TLLineShape,
  TLArrowShape,
  sortByIndex,
  Vec,
  TLShapePartial,
  snapAngle,
  TLClickEvent,
} from "@tldraw/editor";
import { StreamShape } from "../StreamShapeUtil";

export type DrawingLineInfo = TLPointerEventInfo & {
  shape: TLArrowShape | TLLineShape;
  target: "handle";
  onInteractionEnd?: string;
  isCreating?: boolean;
  creatingMarkId?: string;
};

export class DrawingLine extends StateNode {
  static override id = "drawing_line";

  private shapeId = "" as TLShapeId;
  initialHandle = {} as TLHandle;
  initialAdjacentHandle = null as TLHandle | null;
  info = {} as DrawingLineInfo;
  markId = "";
  initialPageTransform: any;
  initialPageRotation: any;
  initialPagePoint = {} as Vec;

  override onEnter = (info: DrawingLineInfo) => {
    const { shape, isCreating, creatingMarkId, handle } = info;
    this.info = info;
    this.parent.setCurrentToolIdMask(info.onInteractionEnd);
    this.shapeId = shape.id;
    this.markId = "";

    this.initialHandle = structuredClone(handle);

    if (this.editor.isShapeOfType<StreamShape>(shape, "line")) {
      // For line shapes, if we're dragging a "create" handle, then
      // create a new vertex handle at that point; and make this handle
      // the handle that we're dragging.
      if (this.initialHandle.type === "create") {
        this.editor.updateShape({
          ...shape,
          props: {
            points: {
              ...shape.props.points,
              [handle.index]: {
                id: handle.index,
                index: handle.index,
                x: handle.x,
                y: handle.y,
              },
            },
          },
        });
        const handlesAfter = this.editor.getShapeHandles(shape)!;
        const handleAfter = handlesAfter.find((h) => h.index === handle.index)!;
        this.initialHandle = structuredClone(handleAfter);
      }
    }

    this.initialPageTransform = this.editor.getShapePageTransform(shape)!;
    this.initialPageRotation = this.initialPageTransform.rotation();
    this.initialPagePoint = this.editor.inputs.originPagePoint.clone();

    this.editor.setCursor({
      type: isCreating ? "cross" : "grabbing",
      rotation: 0,
    });

    const handles = this.editor.getShapeHandles(shape)!.sort(sortByIndex);
    const index = handles.findIndex((h) => h.id === info.handle.id);
  };

  override onPointerMove = () => {
    this.update();
  };

  override onPointerUp = () => {
    this.addHandle();
  };

  override onKeyDown = () => {
    this.update();
  };

  override onKeyUp = () => {
    this.update();
  };

  override onComplete = () => {
    this.update();
    this.complete();
  };

  override onCancel = () => {
    this.cancel();
  };

  private cancel() {
    this.editor.bailToMark(this.markId);
    this.editor.snaps.clearIndicators();

    const { onInteractionEnd } = this.info;
    if (onInteractionEnd) {
      // Return to the tool that was active before this one,
      // whether tool lock is turned on or not!
      this.editor.setCurrentTool(onInteractionEnd, { shapeId: this.shapeId });
      return;
    }

    this.parent.transition("idle");
  }

  private update() {
    const { editor, shapeId, initialPagePoint } = this;
    const { initialHandle, initialPageRotation, initialAdjacentHandle } = this;
    const hintingShapeIds = this.editor.getHintingShapeIds();
    const isSnapMode = this.editor.user.getIsSnapMode();
    const {
      snaps,
      inputs: { currentPagePoint, shiftKey, ctrlKey, altKey, pointerVelocity },
    } = editor;

    const initial = this.info.shape;

    const shape = editor.getShape(shapeId);
    if (!shape) return;
    const util = editor.getShapeUtil(shape);

    let point = currentPagePoint
      .clone()
      .sub(initialPagePoint)
      .rot(-initialPageRotation)
      .add(initialHandle);

    if (shiftKey && initialAdjacentHandle && initialHandle.id !== "middle") {
      const angle = Vec.Angle(initialAdjacentHandle, point);
      const snappedAngle = snapAngle(angle, 24);
      const angleDifference = snappedAngle - angle;
      point = Vec.RotWith(point, initialAdjacentHandle, angleDifference);
    }

    // Clear any existing snaps
    editor.snaps.clearIndicators();

    let nextHandle = { ...initialHandle, x: point.x, y: point.y };

    if (initialHandle.canSnap && (isSnapMode ? !ctrlKey : ctrlKey)) {
      // We're snapping
      const pageTransform = editor.getShapePageTransform(shape.id);
      if (!pageTransform) throw Error("Expected a page transform");

      const snap = snaps.handles.snapHandle({
        currentShapeId: shapeId,
        handle: nextHandle,
      });

      if (snap) {
        snap.nudge.rot(-editor.getShapeParentTransform(shape)!.rotation());
        point.add(snap.nudge);
        nextHandle = { ...initialHandle, x: point.x, y: point.y };
      }
    }

    const changes = util.onHandleDrag?.(shape, {
      handle: nextHandle,
      isPrecise: altKey,
      initial: initial,
    });

    const next: TLShapePartial<any> = {
      id: shape.id,
      type: shape.type,
      ...changes,
    };

    // Arrows
    // if (
    //   initialHandle.type === "vertex" &&
    //   this.editor.isShapeOfType<TLArrowShape>(shape, "arrow")
    // ) {
    //   const bindingAfter = getArrowBindings(editor, shape)[
    //     initialHandle.id as "start" | "end"
    //   ];

    //   if (bindingAfter) {
    //     if (hintingShapeIds[0] !== bindingAfter.toId) {
    //       editor.setHintingShapes([bindingAfter.toId]);
    //       this.pointingId = bindingAfter.toId;
    //       this.isPrecise = pointerVelocity.len() < 0.5 || altKey;
    //       this.isPreciseId = this.isPrecise ? bindingAfter.toId : null;
    //       this.resetExactTimeout();
    //     }
    //   } else {
    //     if (hintingShapeIds.length > 0) {
    //       editor.setHintingShapes([]);
    //       this.pointingId = null;
    //       this.isPrecise = false;
    //       this.isPreciseId = null;
    //       this.resetExactTimeout();
    //     }
    //   }
    // }

    if (changes) {
      editor.updateShapes([next]);
    }
  }

  private addHandle() {
    //TODO
    //check if the cursor is over a unit operation
    //Bind if so.

    this.editor.snaps.clearIndicators();
    // kickoutOccludedShapes(this.editor, [this.shapeId]);

    console.log("function: addHandle");
    const { onInteractionEnd } = this.info;
    if (this.editor.getInstanceState().isToolLocked && onInteractionEnd) {
      // Return to the tool that was active before this one,
      // but only if tool lock is turned on!
      this.editor.setCurrentTool(onInteractionEnd, { shapeId: this.shapeId });
      return;
    }

    this.parent.transition("pointing", { shapeId: this.shapeId });
  }

  private complete() {
    this.editor.snaps.clearIndicators();
    // kickoutOccludedShapes(this.editor, [this.shapeId]);

    const { onInteractionEnd } = this.info;
    if (this.editor.getInstanceState().isToolLocked && onInteractionEnd) {
      // Return to the tool that was active before this one,
      // but only if tool lock is turned on!
      this.editor.setCurrentTool(onInteractionEnd, { shapeId: this.shapeId });
      return;
    }

    // this.parent.transition("idle");
    this.editor.setCurrentTool("select");
  }
}
