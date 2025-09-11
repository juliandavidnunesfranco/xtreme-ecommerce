import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
}

export default function Logo({ width = 100, height = 100 }: LogoProps) {
  return (
    <Image
      src="/Logo-Xtreme-Construction.png"
      alt="Logo"
      width={width}
      height={height}
      className={`w-${width} h-${height}`}
      priority
    />
  );
}
