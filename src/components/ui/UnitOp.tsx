import {
  Geometry2d,
  HTMLContainer,
  RecordProps,
  Rectangle2d,
  resizeBox,
  ShapeUtil,
  T,
  TLBaseShape,
  TLOnResizeHandler,
} from "tldraw";

type ICustomShape = TLBaseShape<
  "my-custom-shape",
  {
    w: number;
    h: number;
    text: string;
  }
>;

export class MyShapeUtil extends ShapeUtil<ICustomShape> {
  // [a]
  static override type = "my-custom-shape" as const;
  static override props: RecordProps<ICustomShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
  };

  // [b]
  getDefaultProps(): ICustomShape["props"] {
    return {
      w: 200,
      h: 100,
      text: "Evaporator",
    };
  }

  // [c]
  override canEdit = () => false;
  override canResize = () => false;
  override isAspectRatioLocked = () => false;

  // [d]
  getGeometry(shape: ICustomShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  // [e]
  override onResize: TLOnResizeHandler<any> = (shape, info) => {
    return resizeBox(shape, info);
  };

  // [f]
  component(shape: ICustomShape) {
    return (
      <HTMLContainer
        style={{
          //   backgroundColor: "#efefef",
          backgroundColor: "rgba(239, 239, 239, 1)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "justify",
          border: "3px solid black",
          borderRadius: "5px",
        }}
      >
        {shape.props.text}
      </HTMLContainer>
    );
  }

  // [g]
  indicator(shape: ICustomShape) {
    //The indicator is the blue outline around a selected shape.
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}
