import{r as n,j as e,C as j,S as w,O as C,u as m}from"./r3f-mhkaesY0.js";import{e as p,p as d,q as M,F as b,r as y}from"./three-Dt9xBCz9.js";function N(){const t=n.useMemo(()=>({time:{value:0},glowColor:{value:new p(11032055)},accentColor:{value:new p(14239471)}}),[]);return m(a=>{t.time.value=a.clock.elapsedTime}),e.jsxs("mesh",{scale:1.07,children:[e.jsx("sphereGeometry",{args:[2.2,48,48]}),e.jsx("shaderMaterial",{uniforms:t,vertexShader:`
          varying vec3 vNormal;
          varying vec3 vWorldPos;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,fragmentShader:`
          varying vec3 vNormal;
          varying vec3 vWorldPos;
          uniform float time;
          uniform vec3 glowColor;
          uniform vec3 accentColor;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
            float pulse = 0.8 + 0.2 * sin(time * 1.2 + vWorldPos.y * 2.0);
            float wave = 0.5 + 0.5 * sin(time * 0.8 + vWorldPos.x * 3.0 + vWorldPos.z * 2.0);
            vec3 col = mix(glowColor, accentColor, wave * 0.4);
            float alpha = fresnel * pulse * 0.65;
            gl_FragColor = vec4(col, alpha);
          }
        `,side:M,transparent:!0,depthWrite:!1,blending:d})]})}function P(){const t=n.useMemo(()=>({time:{value:0}}),[]);return m(a=>{t.time.value=a.clock.elapsedTime}),e.jsxs("mesh",{scale:.82,children:[e.jsx("sphereGeometry",{args:[2.2,32,32]}),e.jsx("shaderMaterial",{uniforms:t,vertexShader:`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,fragmentShader:`
          varying vec3 vNormal;
          uniform float time;
          void main() {
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), 3.0);
            float pulse = 0.7 + 0.3 * sin(time * 0.6);
            vec3 col = vec3(0.44, 0.21, 0.73);
            gl_FragColor = vec4(col, rim * pulse * 0.25);
          }
        `,side:b,transparent:!0,depthWrite:!1,blending:d})]})}function S(){return e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[2.2,48,32]}),e.jsx("meshBasicMaterial",{color:11032055,wireframe:!0,transparent:!0,opacity:.055})]})}function O(){const{positions:a,colors:s,sizes:o}=n.useMemo(()=>{const l=new Float32Array(300),i=new Float32Array(300),h=new Float32Array(100);for(let r=0;r<100;r++){const c=Math.acos(-1+2*r/100),x=Math.sqrt(100*Math.PI)*c,u=2.35;l[r*3]=u*Math.cos(x)*Math.sin(c),l[r*3+1]=u*Math.sin(x)*Math.sin(c),l[r*3+2]=u*Math.cos(c);const g=r>=60;if(g)i[r*3]=.06,i[r*3+1]=.72,i[r*3+2]=.51;else{const v=new p().setHSL(.75+Math.random()*.1,.7,.6);i[r*3]=v.r,i[r*3+1]=v.g,i[r*3+2]=v.b}h[r]=g?.1:.06}return{positions:l,colors:i,sizes:h}},[]),f=n.useMemo(()=>({time:{value:0}}),[]);return m(l=>{f.time.value=l.clock.elapsedTime}),e.jsxs("points",{children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[a,3]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[s,3]}),e.jsx("bufferAttribute",{attach:"attributes-aSize",args:[o,1]})]}),e.jsx("shaderMaterial",{uniforms:f,vertexShader:`
          attribute float aSize;
          attribute vec3 aColor;
          varying vec3 vColor;
          varying float vAlpha;
          uniform float time;
          void main() {
            vColor = aColor;
            vec3 pos = position;
            pos += normalize(position) * sin(time * 2.0 + position.x * 3.0) * 0.03;
            vAlpha = 0.6 + 0.4 * sin(time * 3.0 + position.y * 2.0);
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = aSize * (380.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,fragmentShader:`
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float glow = 1.0 - d * 2.0;
            glow = pow(glow, 1.8);
            gl_FragColor = vec4(vColor, glow * vAlpha * 0.9);
          }
        `,transparent:!0,depthWrite:!1,blending:d})]})}function A(){return e.jsx("group",{children:[0,1,2].map(t=>e.jsxs("mesh",{rotation:[Math.PI/2+t*.2,0,t*.35],children:[e.jsx("torusGeometry",{args:[2.8+t*.35,.008,8,128]}),e.jsx("meshBasicMaterial",{color:11032055,transparent:!0,opacity:.12-t*.03})]},t))})}function _(){const t=n.useRef(),a=n.useMemo(()=>{const s=document.createElement("canvas");s.width=512,s.height=256;const o=s.getContext("2d");return o.clearRect(0,0,512,256),o.font="bold 150px monospace",o.textAlign="center",o.textBaseline="middle",o.fillStyle="#d946ef",o.shadowColor="#d946ef",o.shadowBlur=44,o.fillText("x402",256,100),o.font="40px sans-serif",o.fillStyle="#a855f7",o.shadowBlur=22,o.fillText("Protocol",256,185),new y(s)},[]);return m(s=>{t.current&&(t.current.material.opacity=.7+.3*Math.sin(s.clock.elapsedTime*1.5))}),e.jsx("sprite",{ref:t,scale:[2.1,1.05,1],children:e.jsx("spriteMaterial",{map:a,transparent:!0,blending:d,opacity:.85,depthWrite:!1})})}function W(){const t=n.useMemo(()=>typeof window>"u"?!1:window.matchMedia("(pointer: coarse)").matches||window.innerWidth<768,[]);return e.jsxs(j,{camera:{position:[0,.3,5.2],fov:40},gl:{alpha:!0,antialias:!t,powerPreference:"high-performance"},onCreated:({gl:a})=>a.setClearColor(0,0),style:{position:"absolute",inset:0,width:"100%",height:"100%",background:"transparent"},dpr:[1,1.5],children:[e.jsx("ambientLight",{intensity:.1}),e.jsx(S,{}),e.jsx(N,{}),e.jsx(P,{}),e.jsx(O,{}),e.jsx(_,{}),e.jsx(A,{}),!t&&e.jsx(w,{radius:8,depth:20,count:250,factor:2,saturation:.5,fade:!0,speed:.5}),e.jsx(C,{autoRotate:!0,autoRotateSpeed:.8,enableZoom:!1,enablePan:!1,enableDamping:!0,dampingFactor:.08,rotateSpeed:.6,minPolarAngle:Math.PI*.25,maxPolarAngle:Math.PI*.75})]})}export{W as default};
