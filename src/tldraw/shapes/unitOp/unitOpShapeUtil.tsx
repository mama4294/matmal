import {
  BoundsSnapGeometry,
  Geometry2d,
  HTMLContainer,
  RecordProps,
  Rectangle2d,
  resizeBox,
  ShapeUtil,
  T,
  TLBaseShape,
  TLOnDoubleClickHandler,
  TLOnResizeHandler,
  useDefaultColorTheme,
} from "tldraw";

export type IUnitOpShape = TLBaseShape<
  "unit-op",
  {
    w: number;
    h: number;
    text: string;
  }
>;

export class UnitOpUtl extends ShapeUtil<IUnitOpShape> {
  // [a]
  static override type = "unit-op" as const;
  static override props: RecordProps<IUnitOpShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
  };

  // [b]
  getDefaultProps(): IUnitOpShape["props"] {
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
  getGeometry(shape: IUnitOpShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onDoubleClick?: TLOnDoubleClickHandler<IUnitOpShape> | undefined =
    () => {
      console.log("Double clicked unitop");
    };

  override getBoundsSnapGeometry(shape: IUnitOpShape): BoundsSnapGeometry {
    return new Rectangle2d({
      width: shape.props.h,
      height: shape.props.h,
      isFilled: true,
    });
  }

  // [e]
  override onResize: TLOnResizeHandler<any> = (shape, info) => {
    return resizeBox(shape, info);
  };

  // [f]
  component(shape: IUnitOpShape) {
    const theme = useDefaultColorTheme();

    return (
      <HTMLContainer
        style={{
          // backgroundColor: "#010403",
          borderColor: theme.white.solid,
          backgroundColor: theme.solid,
          display: "flex",
          boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.2)",
          justifyContent: "center",
          position: "relative",
          alignItems: "center",
          textAlign: "justify",
          border: "3px solid",
          borderRadius: "5px",
          fontWeight: "bold",
          padding: 8,
        }}
      >
        {shape.props.text}
      </HTMLContainer>
    );
  }

  // [g]
  indicator(shape: IUnitOpShape) {
    //The indicator is the blue outline around a selected shape.
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}
