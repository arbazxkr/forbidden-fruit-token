import React, { useEffect, useRef } from 'react';
import './ArrowGame.css';

// Extend Window interface for GSAP
declare global {
  interface Window {
    TweenMax: any;
    MorphSVGPlugin: any;
    Elastic: any;
    Linear: any;
    Back: any;
  }
}

const ArrowGame: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Load GSAP and MorphSVGPlugin
    const loadGSAP = async () => {
      // Load GSAP scripts dynamically
      const gsapScript = document.createElement('script');
      gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.1/TweenMax.min.js';
      document.head.appendChild(gsapScript);

      const morphScript = document.createElement('script');
      morphScript.src = '//s3-us-west-2.amazonaws.com/s.cdpn.io/16327/MorphSVGPlugin.min.js';
      document.head.appendChild(morphScript);

      await new Promise((resolve) => {
        gsapScript.onload = () => {
          morphScript.onload = resolve;
        };
      });

      initGame();
    };

    const initGame = () => {
      const svg = svgRef.current;
      if (!svg || !window.TweenMax || !window.MorphSVGPlugin) return;

      const cursor = svg.createSVGPoint();
      const arrows = svg.querySelector('.arrows') as SVGGElement;
      let randomAngle = 0;

      // Target and bow positions (matching original)
      const target = { x: 900, y: 249.5 };
      const lineSegment = { x1: 875, y1: 280, x2: 925, y2: 220 };
      const pivot = { x: 100, y: 250 };

      // Convert screen coordinates to SVG coordinates
      const getMouseSVG = (e: MouseEvent) => {
        cursor.x = e.clientX;
        cursor.y = e.clientY;
        return cursor.matrixTransform(svg.getScreenCTM()?.inverse() || new DOMMatrix());
      };

      const aim = (e: MouseEvent) => {
        const point = getMouseSVG(e);
        point.x = Math.min(point.x, pivot.x - 7);
        point.y = Math.max(point.y, pivot.y + 7);
        const dx = point.x - pivot.x;
        const dy = point.y - pivot.y;

        const angle = Math.atan2(dy, dx) + randomAngle;
        const bowAngle = angle - Math.PI;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 50);
        const scale = Math.min(Math.max(distance / 30, 1), 2);

        window.TweenMax.to("#bow", 0.3, {
          scaleX: scale,
          rotation: bowAngle + "rad",
          transformOrigin: "right center"
        });

        const arrowX = Math.min(pivot.x - (1 / scale) * distance, 88);
        window.TweenMax.to(".arrow-angle", 0.3, {
          rotation: bowAngle + "rad",
          svgOrigin: "100 250"
        });

        window.TweenMax.to(".arrow-angle use", 0.3, {
          x: -distance
        });

        window.TweenMax.to("#bow polyline", 0.3, {
          attr: {
            points: "88,200 " + arrowX + ",250 88,300"
          }
        });

        const radius = distance * 9;
        const offset = {
          x: Math.cos(bowAngle) * radius,
          y: Math.sin(bowAngle) * radius
        };
        const arcWidth = offset.x * 3;

        window.TweenMax.to("#arc", 0.3, {
          attr: {
            d: "M100,250c" + offset.x + "," + offset.y + "," + (arcWidth - offset.x) + "," + (offset.y + 50) + "," + arcWidth + ",50"
          },
          autoAlpha: distance / 60
        });
      };

      const loose = () => {
        document.removeEventListener("mousemove", aim);
        document.removeEventListener("mouseup", loose);

        window.TweenMax.to("#bow", 0.4, {
          scaleX: 1,
          transformOrigin: "right center",
          ease: window.Elastic.easeOut
        });

        window.TweenMax.to("#bow polyline", 0.4, {
          attr: {
            points: "88,200 88,250 88,300"
          },
          ease: window.Elastic.easeOut
        });

        // Create flying arrow
        const newArrow = document.createElementNS("http://www.w3.org/2000/svg", "use");
        newArrow.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#arrow");
        arrows.appendChild(newArrow);

        // Animate along curved path
        const path = window.MorphSVGPlugin.pathDataToBezier("#arc");
        window.TweenMax.to([newArrow], 0.5, {
          force3D: true,
          bezier: {
            type: "cubic",
            values: path,
            autoRotate: ["x", "y", "rotation"]
          },
          onUpdate: hitTest,
          onUpdateParams: ["{self}"],
          onComplete: onMiss,
          ease: window.Linear.easeNone
        });

        window.TweenMax.to("#arc", 0.3, { opacity: 0 });
        window.TweenMax.set(".arrow-angle use", { opacity: 0 });
      };

      const hitTest = (tween: any) => {
        const arrow = tween.target[0];
        const transform = arrow._gsTransform;
        const radians = (transform.rotation * Math.PI) / 180;
        const arrowSegment = {
          x1: transform.x,
          y1: transform.y,
          x2: Math.cos(radians) * 60 + transform.x,
          y2: Math.sin(radians) * 60 + transform.y
        };

        const intersection = getIntersection(arrowSegment, lineSegment);
        if (intersection && intersection.segment1 && intersection.segment2) {
          tween.pause();
          const dx = intersection.x - target.x;
          const dy = intersection.y - target.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const selector = distance < 7 ? ".beautiful" : ".precious";
          showMessage(selector);
        }
      };

      const onMiss = () => {
        showMessage(".thankyou");
      };

      const showMessage = (selector: string) => {
        window.TweenMax.killTweensOf(selector);
        window.TweenMax.killChildTweensOf(selector);
        window.TweenMax.set(selector, { autoAlpha: 1 });

        // Animate the text element
        window.TweenMax.fromTo(
          selector,
          0.8,
          {
            rotation: -10,
            scale: 0,
            transformOrigin: "center"
          },
          {
            scale: 1,
            rotation: 0,
            ease: window.Back.easeOut
          }
        );

        window.TweenMax.to(
          selector,
          0.5,
          {
            delay: 2.5,
            rotation: 15,
            scale: 0,
            ease: window.Back.easeIn
          }
        );
      };

      const getIntersection = (segment1: any, segment2: any) => {
        const dx1 = segment1.x2 - segment1.x1;
        const dy1 = segment1.y2 - segment1.y1;
        const dx2 = segment2.x2 - segment2.x1;
        const dy2 = segment2.y2 - segment2.y1;
        const cx = segment1.x1 - segment2.x1;
        const cy = segment1.y1 - segment2.y1;
        const denominator = dy2 * dx1 - dx2 * dy1;

        if (denominator === 0) return null;

        const ua = (dx2 * cy - dy2 * cx) / denominator;
        const ub = (dx1 * cy - dy1 * cx) / denominator;

        return {
          x: segment1.x1 + ua * dx1,
          y: segment1.y1 + ua * dy1,
          segment1: ua >= 0 && ua <= 1,
          segment2: ub >= 0 && ub <= 1
        };
      };

      // Mouse event handlers
      const draw = (e: MouseEvent) => {
        randomAngle = Math.random() * Math.PI * 0.03 - 0.015;
        window.TweenMax.to(".arrow-angle use", 0.3, { opacity: 1 });
        document.addEventListener("mousemove", aim);
        document.addEventListener("mouseup", loose);
        aim(e);
      };

      // Initialize
      aim({ clientX: 320, clientY: 300 } as MouseEvent);
      window.addEventListener("mousedown", draw);
    };

    loadGSAP();
  }, []);

  return (
    <svg
      ref={svgRef}
      className="arrow-game-svg"
      viewBox="0 0 1000 400"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <g id="arrow">
          <line x2="60" fill="none" stroke="#888" strokeWidth="2" />
          <polygon fill="#888" points="64 0 58 2 56 0 58 -2" />
          <polygon fill="#88ce02" points="2 -3 -4 -3 -1 0 -4 3 2 3 5 0" />
        </g>
      </defs>

      <path id="arc" fill="none" stroke="url(#ArcGradient)" strokeWidth="4" d="M100,250c250-400,550-400,800,0" pointerEvents="none"/>
      <linearGradient id="ArcGradient">
        <stop offset="0" stopColor="#fff" stopOpacity="0.2"/>
        <stop offset="50%" stopColor="#fff" stopOpacity="0"/>
      </linearGradient>

      <g id="target">
        <path fill="#FFF" d="M924.2,274.2c-21.5,21.5-45.9,19.9-52,3.2c-4.4-12.1,2.4-29.2,14.2-41c11.8-11.8,29-18.6,41-14.2 C944.1,228.3,945.7,252.8,924.2,274.2z" />
        <path fill="#F4531C" d="M915.8,265.8c-14.1,14.1-30.8,14.6-36,4.1c-4.1-8.3,0.5-21.3,9.7-30.5s22.2-13.8,30.5-9.7 C930.4,235,929.9,251.7,915.8,265.8z" />
        <path fill="#FFF" d="M908.9,258.9c-8,8-17.9,9.2-21.6,3.5c-3.2-4.9-0.5-13.4,5.6-19.5c6.1-6.1,14.6-8.8,19.5-5.6 C918.1,241,916.9,250.9,908.9,258.9z" />
        <path fill="#F4531C" d="M903.2,253.2c-2.9,2.9-6.7,3.6-8.3,1.7c-1.5-1.8-0.6-5.4,2-8c2.6-2.6,6.2-3.6,8-2 C906.8,246.5,906.1,250.2,903.2,253.2z" />
      </g>

      <g id="bow" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" pointerEvents="none">
        <polyline fill="none" stroke="#ddd" strokeLinecap="round" points="88,200 88,250 88,300"/>
        <path fill="none" stroke="#88ce02" strokeWidth="3" strokeLinecap="round" d="M88,300 c0-10.1,12-25.1,12-50s-12-39.9-12-50"/>
      </g>

      <g className="arrow-angle">
        <use href="#arrow" x="100" y="250"/>
      </g>

      <clipPath id="mask">
        <polygon opacity="0.5" points="0,0 1500,0 1500,200 970,290 950,240 925,220 875,280 890,295 920,310 0,350" pointerEvents="none"/>
      </clipPath>

      <g className="arrows" clipPath="url(#mask)" pointerEvents="none"></g>

      {/* Appreciative Messages for Ariba */}
      <text className="thankyou" fill="#FFD700" opacity="0" x="50%" y="8%" fontSize="38" fontFamily="'Dancing Script', cursive" textAnchor="middle" dominantBaseline="middle">EPITOME OF BEAUTY</text>

      <text className="beautiful" fill="#FF69B4" opacity="0" x="50%" y="8%" fontSize="42" fontFamily="'Dancing Script', cursive" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">BEAUTY!</text>

      <text className="precious" fill="#87CEEB" opacity="0" x="50%" y="8%" fontSize="38" fontFamily="'Dancing Script', cursive" textAnchor="middle" dominantBaseline="middle">YOU'RE HEAVEN ON EARTH</text>
    </svg>
  );
};

export default ArrowGame;
