import React from "react";

interface DongSonDrumSvgProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function DongSonDrumSvg({ className, ...props }: DongSonDrumSvgProps) {
  const rays14 = Array.from({ length: 14 });
  const chimLac = Array.from({ length: 14 }); 
  const dots = Array.from({ length: 90 });
  const zigzags = Array.from({ length: 80 });

  return (
    <svg viewBox="0 0 1000 1000" className={className} stroke="currentColor" fill="none" {...props}>
      <circle cx="500" cy="500" r="490" strokeWidth="4" />
      <circle cx="500" cy="500" r="480" strokeWidth="1" />
      <circle cx="500" cy="500" r="460" strokeWidth="1" />
      <circle cx="500" cy="500" r="455" strokeWidth="2" />
      
      {/* Outer zigzag */}
      <g strokeWidth="1.5">
        {zigzags.map((_, i) => (
          <g key={`oz-${i}`} transform={`rotate(${(360 / 80) * i} 500 500)`}>
            <path d="M 500 480 L 510 460" />
            <path d="M 500 480 L 490 460" />
          </g>
        ))}
      </g>

      <circle cx="500" cy="500" r="430" strokeWidth="3" />
      <circle cx="500" cy="500" r="420" strokeWidth="1" />

      {/* Chim Lac Ring (Radius 270 to 420) */}
      <circle cx="500" cy="500" r="270" strokeWidth="2" />
      <g fill="currentColor" stroke="none">
        {chimLac.map((_, i) => (
          <g key={`bird-${i}`} transform={`rotate(${(360 / 14) * i} 500 500)`}>
             {/* Chim Lạc flying counter-clockwise. Midpoint y ~ 155 (radius ~345) */}
             <g transform="translate(500, 155) scale(0.65) rotate(-15)">
               {/* Beak */}
               <path d="M 0,0 L -90,5 L -10,15 Z" />
               {/* Head */}
               <path d="M -10,-5 Q 30,-60 40,-5 Q 30,30 -10,15 Z" />
               {/* Body */}
               <path d="M 30,-5 Q 100,-40 130,30 Q 90,60 20,20 Z" />
               {/* Wing */}
               <path d="M 50,-15 Q 80,-70 120,-40 Q 100,-10 70,-10 Z" /> 
               {/* Tail feathers */}
               <path d="M 120,5 Q 190,-30 280,25 Q 200,45 120,30 Z" />
               <path d="M 115,20 Q 180,-10 260,50 Q 190,60 115,40 Z" />
               {/* Crest feathers */}
               <path d="M 10,-10 Q 40,-60 100,-30 Q 60,-10 30,-2 Z" />
               <path d="M 20,-5 Q 50,-40 110,-5 Q 60,-5 40,5 Z" />
             </g>
          </g>
        ))}
      </g>

      <circle cx="500" cy="500" r="260" strokeWidth="1" />
      
      {/* Circle with dot motifs */}
      <circle cx="500" cy="500" r="235" strokeWidth="1" />
      <circle cx="500" cy="500" r="210" strokeWidth="2" />
      <circle cx="500" cy="500" r="200" strokeWidth="3" />
      <g fill="currentColor" stroke="none">
        {Array.from({ length: 50 }).map((_, i) => (
          <g key={`cm-${i}`} transform={`rotate(${(360 / 50) * i} 500 500)`}>
             <circle cx="500" cy="247" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
             <circle cx="500" cy="247" r="3" />
          </g>
        ))}
      </g>

      <circle cx="500" cy="500" r="160" strokeWidth="1" />
      
      {/* Inner zigzag */}
      <g strokeWidth="1.5">
        {Array.from({ length: 42 }).map((_, i) => (
          <g key={`iz-${i}`} transform={`rotate(${(360 / 42) * i} 500 500)`}>
            <path d="M 500 200 L 512 160" />
            <path d="M 500 200 L 488 160" />
          </g>
        ))}
      </g>

      {/* Center Sun (Radius 160) */}
      <circle cx="500" cy="500" r="150" strokeWidth="1" />
      <circle cx="500" cy="500" r="145" strokeWidth="2" />
      
      <g fill="currentColor" stroke="none">
        {rays14.map((_, i) => (
          <g key={`sun-${i}`} transform={`rotate(${(360 / 14) * i} 500 500)`}>
            {/* Sun Ray */}
            <polygon points="500,355 488,440 512,440" />
            
            {/* Peacock feather / chevron between rays */}
            <g transform={`rotate(${360/28} 500 500)`}>
               <polyline points="488,370 500,350 512,370" stroke="currentColor" strokeWidth="2" fill="none" strokeMiterlimit="5" />
               <polyline points="492,385 500,365 508,385" stroke="currentColor" strokeWidth="1.5" fill="none" strokeMiterlimit="5" />
               <polyline points="494,400 500,380 506,400" stroke="currentColor" strokeWidth="1" fill="none" strokeMiterlimit="5" />
            </g>
          </g>
        ))}
        {/* Core */}
        <circle cx="500" cy="500" r="60" />
        <circle cx="500" cy="500" r="30" fill="#030914" />
        <circle cx="500" cy="500" r="10" />
      </g>
    </svg>
  );
}
