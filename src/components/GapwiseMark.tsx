import Svg, { G, Path } from "react-native-svg";

/**
 * Native rendering of the canonical Gapwise mark.
 * Geometry is copied exactly from assets/brand/logo-mark.svg, which in turn is
 * byte-for-byte sourced from andrewmuratov/gapwise/public/logo-mark.svg.
 */
export function GapwiseMark({ size = 52 }: { size?: number }) {
  const upperLeft =
    "M627 638 540 534c-21-19-47-32-75-49-47-29-68-77-68-132h31c2 32 13 63 34 87 6 6 12 12 20 18-3-14-3-27-1-39 2-13 6-24 12-33l25 13c-7 15-10 30-8 42 1 17 7 29 15 37 7 8 13 12 19 15l83 37Z";
  const lowerLeft =
    "M627 692 522 558c-18-19-40-33-59-39-15-1-31-1-48-1 0 30 11 56 36 76 17 12 35 16 74 16v120c0 8 3 14 8 20l72 100c5 7 12 10 22 10Z";

  return (
    <Svg
      width={size}
      height={size}
      viewBox="350 315 554 554"
      accessibilityLabel="Gapwise deer mark"
    >
      <G fill="#4EA7FE">
        <Path d={upperLeft} />
        <Path d={upperLeft} transform="translate(1254 0) scale(-1 1)" />
        <Path d={lowerLeft} />
        <Path d={lowerLeft} transform="translate(1254 0) scale(-1 1)" />
      </G>
    </Svg>
  );
}
