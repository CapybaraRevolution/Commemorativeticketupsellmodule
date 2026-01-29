import imgImage1 from "figma:asset/0441a340d780260cc141f92444927b86ccf2f191.png";
import imgImage2 from "figma:asset/010abcd9f0838e59f4344ebcedf61c1bc2444a41.png";

export default function Frame() {
  return (
    <div className="relative size-full">
      <div className="absolute h-[714px] left-0 top-0 w-[1728px]" data-name="image 1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[135.01%] left-0 max-w-none top-0 w-full" src={imgImage1} />
        </div>
      </div>
      <div className="absolute h-[418px] left-0 top-[714px] w-[1728px]" data-name="image 2">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[136.84%] left-0 max-w-none top-[-36.84%] w-full" src={imgImage2} />
        </div>
      </div>
    </div>
  );
}