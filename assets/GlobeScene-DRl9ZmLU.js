import{j as e,r as u,u as w,C as K,S as k,O as X}from"./r3f-Yy5NoV6S.js";import{u as Q}from"./index-mkdHBwCu.js";import{p as A,e as I,q as G,r as q,F as N,s as $,h as z,D as J}from"./three-DAA57BSS.js";import"./gsap-CzGW6FVa.js";const O=500;function Z({reputationParticles:m}){const y=u.useRef();m.length;const{positions:h,colors:b,sizes:v,alphas:g,types:p}=u.useMemo(()=>{const r=new Float32Array(O*3),n=new Float32Array(O*3),a=new Float32Array(O),t=new Float32Array(O),o=new Float32Array(O);for(let c=0;c<O;c++)r[c*3]=0,r[c*3+1]=0,r[c*3+2]=0,n[c*3]=0,n[c*3+1]=0,n[c*3+2]=0,a[c]=0,t[c]=0,o[c]=0;return{positions:r,colors:n,sizes:a,alphas:t,types:o}},[]);return w((r,n)=>{if(!y.current)return;const{positions:a,colors:t,sizes:o,alphas:c,types:s}=y.current.geometry.attributes;for(let l=0;l<Math.min(m.length,O);l++){const i=m[l];a.array[l*3]=i.position[0],a.array[l*3+1]=i.position[1],a.array[l*3+2]=i.position[2];const M=new I(i.color);t.array[l*3]=M.r,t.array[l*3+1]=M.g,t.array[l*3+2]=M.b;const f=i.age/i.maxAge,d=f<.1?f/.1:1,S=f>.7?(1-f)/.3:1,C=Math.min(d,S);o.array[l]=i.size*(1+f*.5)*C,c.array[l]=C*(.6+.4*Math.sin(Date.now()*.003+l)),s.array[l]=i.isBatch?1:0}for(let l=m.length;l<O;l++)c.array[l]=0,o.array[l]=0;a.needsUpdate=!0,t.needsUpdate=!0,o.needsUpdate=!0,c.needsUpdate=!0,s.needsUpdate=!0}),e.jsxs("points",{ref:y,renderOrder:15,children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[h,3]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[b,3]}),e.jsx("bufferAttribute",{attach:"attributes-aSize",args:[v,1]}),e.jsx("bufferAttribute",{attach:"attributes-aAlpha",args:[g,1]}),e.jsx("bufferAttribute",{attach:"attributes-aType",args:[p,1]})]}),e.jsx("shaderMaterial",{vertexShader:`
          attribute float aSize;
          attribute vec3 aColor;
          attribute float aAlpha;
          attribute float aType;
          varying vec3 vColor;
          varying float vAlpha;
          varying float vType;
          varying float vSize;
          void main() {
            vColor = aColor;
            vAlpha = aAlpha;
            vType = aType;
            vSize = aSize;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float perspective = 300.0 / -mv.z;
            gl_PointSize = aSize * perspective * (1.0 + vType * 0.5);
            gl_Position = projectionMatrix * mv;
          }
        `,fragmentShader:`
          varying vec3 vColor;
          varying float vAlpha;
          varying float vType;
          varying float vSize;
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float dist = length(uv);
            if (dist > 0.5) discard;

            float ring = smoothstep(0.45, 0.0, dist);
            float core = pow(1.0 - dist * 2.0, 4.0);

            vec3 col = vColor;
            if (vType > 0.5) {
              // Batch particles: diamond/trail shape
              float ax = abs(uv.x);
              float ay = abs(uv.y);
              float diamond = 1.0 - max(ax, ay) * 2.0;
              col = mix(col, vec3(1.0), diamond * 0.5);
            } else {
              // Single particles: star shape
              float ax = abs(uv.x);
              float ay = abs(uv.y);
              float spikeX = smoothstep(0.25, 0.0, ay) * pow(1.0 - ax, 2.0);
              float spikeY = smoothstep(0.25, 0.0, ax) * pow(1.0 - ay, 2.0);
              col = mix(col, vec3(1.0), max(spikeX, spikeY) * 0.7 + core * 0.5);
            }

            float alpha = (ring * 0.6 + core * 0.4) * vAlpha;
            gl_FragColor = vec4(col, alpha);
          }
        `,transparent:!0,depthWrite:!1,blending:A})]})}function tt(){const m=Q();return m.length===0?null:e.jsx(Z,{reputationParticles:m})}const et=({liveData:m})=>{const y=u.useRef(),h=u.useRef(0),b=u.useMemo(()=>{const a=m||{};return[{radius:3.6,tilt:.18,yOffset:.45,speed:.025,bandWidth:.42,color:"#ffffff",opacity:.9,fontSize:42,text:"   THE MARKETPLACE THAT LIVES   THE MARKETPLACE THAT LIVES   THE MARKETPLACE THAT LIVES   "},{radius:3.05,tilt:.32,yOffset:-.15,speed:-.035,bandWidth:.36,color:"#d946ef",opacity:.82,fontSize:34,text:"   API INFRASTRUCTURE FOR AI AGENTS THAT PAY   API INFRASTRUCTURE FOR AI AGENTS THAT PAY   API INFRASTRUCTURE FOR AI AGENTS THAT PAY   "},{radius:2.55,tilt:.12,yOffset:-.55,speed:.04,bandWidth:.32,color:"#22d3ee",opacity:.75,fontSize:28,text:`   ${a.endpoints||"100+"} ENDPOINTS  ${a.freeEndpoints||"40"} FREE  ${a.latency||""}   ${a.endpoints||"100+"} ENDPOINTS  ${a.freeEndpoints||"40"} FREE  ${a.latency||""}   `}]},[m]),v=u.useMemo(()=>b.map(a=>{const t=document.createElement("canvas");t.width=4096,t.height=160;const o=t.getContext("2d");o.clearRect(0,0,t.width,t.height);const c=`900 ${a.fontSize*1.35}px 'JetBrains Mono', 'Fira Code', monospace`;o.font=c,o.textAlign="center",o.textBaseline="middle";const s=a.text,l=o.measureText(s).width,i=Math.ceil((t.width+l)/l),M=(t.width-l*i)/2+l/2;o.shadowColor=a.color,o.shadowBlur=48,o.fillStyle=a.color;for(let d=0;d<i;d++)o.fillText(s,M+d*l,t.height/2);o.shadowBlur=22;for(let d=0;d<i;d++)o.fillText(s,M+d*l,t.height/2);o.shadowBlur=0,o.fillStyle=a.color==="#ffffff"?"#ffffff":a.color;for(let d=0;d<i;d++)o.fillText(s,M+d*l,t.height/2);o.fillStyle="#ffffff",o.globalAlpha=.85;for(let d=0;d<i;d++)o.fillText(s,M+d*l,t.height/2);o.globalAlpha=1;const f=new G(t);return f.anisotropy=8,f.minFilter=$,f.magFilter=$,f}),[b]),g=u.useMemo(()=>b.map(a=>{const t=document.createElement("canvas");t.width=4096,t.height=160;const o=t.getContext("2d");o.clearRect(0,0,t.width,t.height),o.font=`900 ${a.fontSize*1.35}px 'JetBrains Mono', 'Fira Code', monospace`,o.textAlign="center",o.textBaseline="middle";const c=a.text,s=o.measureText(c).width,l=Math.ceil((t.width+s)/s),i=(t.width-s*l)/2+s/2;o.shadowColor=a.color,o.shadowBlur=28,o.fillStyle=a.color,o.globalAlpha=.35;for(let f=0;f<l;f++)o.fillText(c,i+f*s,t.height/2);o.globalAlpha=1;const M=new G(t);return M.anisotropy=4,M}),[b]),[p,r]=u.useState(null),n=u.useRef(0);return w((a,t)=>{h.current+=t,n.current+=t,y.current&&b.forEach((o,c)=>{const s=y.current.children[c];if(s){p===c||(s.rotation.y+=t*o.speed);const i=s.children[0];if(i!=null&&i.material){const M=.88+.12*Math.sin(n.current*.7+c*1.2);i.material.opacity=(p===c?1:o.opacity)*M}}})}),e.jsx("group",{ref:y,children:b.map((a,t)=>e.jsxs("group",{position:[0,a.yOffset,0],rotation:[a.tilt,0,0],children:[e.jsxs("mesh",{onPointerOver:o=>{o.stopPropagation(),r(t),document.body.style.cursor="pointer"},onPointerOut:()=>{r(null),document.body.style.cursor="auto"},onClick:()=>{window.__aetherius_addImpact&&window.__aetherius_addImpact({position:new z(a.radius,a.yOffset,0),intensity:.8})},children:[e.jsx("cylinderGeometry",{args:[a.radius,a.radius,a.bandWidth,128,1,!0]}),e.jsx("meshBasicMaterial",{map:v[t],transparent:!0,opacity:a.opacity,side:N,depthWrite:!1,blending:A,toneMapped:!1})]}),e.jsxs("mesh",{children:[e.jsx("cylinderGeometry",{args:[a.radius,a.radius,a.bandWidth,128,1,!0]}),e.jsx("meshBasicMaterial",{map:g[t],transparent:!0,opacity:.22,side:q,depthWrite:!1,blending:A,toneMapped:!1})]}),e.jsxs("mesh",{children:[e.jsx("torusGeometry",{args:[a.radius,a.bandWidth*.03,6,128]}),e.jsx("meshBasicMaterial",{color:a.color,transparent:!0,opacity:a.opacity*.04,depthWrite:!1})]})]},t))})};function at(){const m=u.useMemo(()=>({time:{value:0},colorA:{value:new I(2282478)},colorB:{value:new I(11032055)},colorC:{value:new I(14239471)}}),[]);return w((y,h)=>{m.time.value+=h*.6}),e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[2.65,28,20]}),e.jsx("shaderMaterial",{uniforms:m,vertexShader:`
          varying vec3 vPos; varying vec3 vNormal; varying vec3 vWorldPos;
          void main() {
            vPos = position;
            vNormal = normalize(normalMatrix * normal);
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,fragmentShader:`
          varying vec3 vPos; varying vec3 vNormal; varying vec3 vWorldPos;
          uniform float time; uniform vec3 colorA; uniform vec3 colorB; uniform vec3 colorC;
          void main() {
            float dist = length(vPos) / 2.65;
            float radial = pow(1.0 - dist, 2.0);
            // Sombra que emana hacia afuera desde la superficie, sin borde contenido
            float pulse = 0.7 + 0.3 * sin(time * 0.5 + vWorldPos.y * 1.2);
            float wave = 0.5 + 0.5 * sin(time * 0.3 + vWorldPos.x * 1.5);
            float polar = pow(abs(vPos.y / 2.65), 2.0);
            vec3 col = mix(colorA, colorB, wave * 0.3);
            col = mix(col, colorC, 0.15 * sin(time * 0.3 + vWorldPos.y));
            col += polar * vec3(0.2, 0.08, 0.35) * 0.5;
            float alpha = radial * 0.10 * pulse * (1.0 + polar * 0.8);
            alpha *= smoothstep(1.0, 0.3, dist);
            gl_FragColor = vec4(col, alpha);
          }
        `,side:N,transparent:!0,depthWrite:!1,blending:A})]})}function ot(){const m=u.useMemo(()=>({time:{value:0}}),[]);return w((y,h)=>{m.time.value+=h*.4}),e.jsxs("mesh",{scale:.85,children:[e.jsx("sphereGeometry",{args:[2.2,32,32]}),e.jsx("shaderMaterial",{uniforms:m,vertexShader:`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,fragmentShader:`
          varying vec3 vNormal; uniform float time;
          void main() {
            float rim = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), 2.0);
            float pulse = 0.85 + 0.15 * sin(time * 0.4);
            vec3 col = vec3(0.659, 0.333, 0.969);
            gl_FragColor = vec4(col, rim * pulse * 0.04);
          }
        `,side:N,transparent:!0,depthWrite:!1,blending:A})]})}function st({impactPoints:m}){const y=u.useRef(),h=u.useMemo(()=>({time:{value:0},impact0:{value:new z(0,0,0)},i0t:{value:0},impact1:{value:new z(0,0,0)},i1t:{value:0},impact2:{value:new z(0,0,0)},i2t:{value:0},impact3:{value:new z(0,0,0)},i3t:{value:0},impact4:{value:new z(0,0,0)},i4t:{value:0},impact5:{value:new z(0,0,0)},i5t:{value:0},impact6:{value:new z(0,0,0)},i6t:{value:0},impact7:{value:new z(0,0,0)},i7t:{value:0}}),[]);return w((b,v)=>{if(h.time.value+=v*.5,m)for(let g=0;g<8&&g<m.length;g++){const p=m[g];h[`impact${g}`].value.copy(p.position),h[`i${g}t`].value=p.intensity}}),e.jsxs("mesh",{ref:y,children:[e.jsx("sphereGeometry",{args:[2.2,36,24]}),e.jsx("shaderMaterial",{uniforms:h,vertexShader:`
          varying vec3 vPos; varying vec3 vWorldPos;
          uniform float time;
          uniform vec3 impact0, impact1, impact2, impact3, impact4, impact5, impact6, impact7;
          uniform float i0t, i1t, i2t, i3t, i4t, i5t, i6t, i7t;
          void main() {
            vPos = position;
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,fragmentShader:`
          varying vec3 vPos; varying vec3 vWorldPos;
          uniform float time;
          uniform vec3 impact0, impact1, impact2, impact3, impact4, impact5, impact6, impact7;
          uniform float i0t, i1t, i2t, i3t, i4t, i5t, i6t, i7t;

          // Collision glow: localized bright point where spark hits wireframe
          float impactPulse(vec3 worldPos, vec3 impactPos, float intensity) {
            float dist = length(worldPos - impactPos);
            // Tight ring expanding from impact point
            float ring = abs(dist - time * 0.8 * intensity);
            float ringGlow = exp(-ring * 1.5) * intensity * 1.5;
            // Proximity glow (bright at impact, fades radially)
            float prox = exp(-dist * 2.5) * intensity * 1.5;
            // Hot center flash — BRIGHT
            float hotCenter = exp(-dist * 6.0) * intensity * 2.0;
            return (ringGlow * 0.7 + prox + hotCenter) * intensity;
          }

          float polarGlow(vec3 pos) {
            return pow(abs(pos.y / 2.2), 2.5) * 0.6;
          }

          // Ambient sparkle: makes wireframe feel alive even without impacts
          float ambientSparkle(vec3 pos, float t) {
            float s = 0.0;
            // Traveling sparkles along wireframe edges
            float angle = atan(pos.z, pos.x);
            float lat = asin(pos.y / 2.2);
            s += pow(sin(angle * 12.0 + t * 1.5) * 0.5 + 0.5, 8.0) * 0.15;
            s += pow(sin(lat * 8.0 - t * 0.8) * 0.5 + 0.5, 10.0) * 0.1;
            // Random micro-sparkles
            float hash = fract(sin(dot(floor(pos * 20.0), vec3(12.9898,78.233,45.164))) * 43758.5453);
            s += step(0.97, hash) * 0.3 * (0.5 + 0.5 * sin(t * 5.0 + hash * 20.0));
            return s;
          }

          void main() {
            float pulse = 0.5 + 0.5 * sin(time * 0.8 + vWorldPos.y * 3.0);
            float fade = smoothstep(0.0, 0.3, abs(vPos.y));

            // Accumulate impact pulses — enhanced collision glow
            float impacts = 0.0;
            impacts += impactPulse(vWorldPos, impact0, i0t);
            impacts += impactPulse(vWorldPos, impact1, i1t);
            impacts += impactPulse(vWorldPos, impact2, i2t);
            impacts += impactPulse(vWorldPos, impact3, i3t);
            impacts += impactPulse(vWorldPos, impact4, i4t);
            impacts += impactPulse(vWorldPos, impact5, i5t);
            impacts += impactPulse(vWorldPos, impact6, i6t);
            impacts += impactPulse(vWorldPos, impact7, i7t);
            impacts = clamp(impacts, 0.0, 2.0);

            // Ambient sparkle on wireframe
            float sparkle = ambientSparkle(vPos, time * 2.0);

            // Wireframe base: CYAN pulse (the dominant read)
            vec3 cyanBase = vec3(0.0, 0.75, 1.0);
            vec3 purpleAccent = vec3(0.55, 0.25, 0.9);
            float cyanPulse = 0.6 + 0.4 * sin(time * 0.6 + vPos.x * 2.0);
            vec3 baseCol = mix(cyanBase, purpleAccent, 0.25 + 0.15 * sin(time * 0.25));
            baseCol *= (0.7 + 0.3 * cyanPulse);

            float polar = polarGlow(vPos);
            baseCol += polar * vec3(0.1, 0.05, 0.3);

            // Impact: hot cyan-white flash at collision — VIVID
            vec3 impactCol = vec3(0.4, 1.0, 1.0); // bright cyan
            vec3 col = mix(baseCol, impactCol, impacts * 0.9);
            col += vec3(0.3, 0.6, 0.8) * impacts;

            // Sparkle
            col += vec3(0.3, 0.6, 0.8) * sparkle;

            float alpha = (0.10 + polar * 0.05 + cyanPulse * 0.04) * pulse * fade + impacts * 0.85 + sparkle * 0.18;
            gl_FragColor = vec4(col, alpha);
          }
        `,wireframe:!0,transparent:!0,depthWrite:!0})]})}function rt({gasUniforms:m}){const h=u.useRef(),b=u.useRef(0),v=u.useMemo(()=>{const g=new Float32Array(120),p=new Float32Array(120),r=new Float32Array(120),n=new Float32Array(40);for(let a=0;a<40;a++){const t=Math.random()*Math.PI*2,o=Math.acos(2*Math.random()-1),c=.15+Math.random()*.5;g[a*3]=c*Math.sin(o)*Math.cos(t)*2,g[a*3+1]=c*Math.cos(o)*.7,g[a*3+2]=c*Math.sin(o)*Math.sin(t)*.9,p[a*3]=1.5+Math.random()*5,p[a*3+1]=1+Math.random()*4,p[a*3+2]=1.5+Math.random()*4.5;const s=Math.random();s<.4?(r[a*3]=.1+s*.2,r[a*3+1]=.7+s*.3,r[a*3+2]=.9+s*.1):s<.7?(r[a*3]=.8,r[a*3+1]=.9,r[a*3+2]=1):(r[a*3]=.05,r[a*3+1]=.5+s*.3,r[a*3+2]=.9+s*.1),n[a]=.025+Math.random()*.04}return{positions:g,seeds:p,colors:r,sizes:n}},[]);return w((g,p)=>{var a,t,o,c;b.current+=p;const r=b.current,n=(c=(o=(t=(a=h.current)==null?void 0:a.geometry)==null?void 0:t.attributes)==null?void 0:o.position)==null?void 0:c.array;if(n){for(let s=0;s<40;s++){const l=v.seeds[s*3],i=v.seeds[s*3+1],M=v.seeds[s*3+2];n[s*3]=v.positions[s*3]+Math.sin(r*l+s*.7)*.05,n[s*3+1]=v.positions[s*3+1]+Math.cos(r*i+s*1.1)*.035,n[s*3+2]=v.positions[s*3+2]+Math.sin(r*M+s*.9)*.04}h.current.geometry.attributes.position.needsUpdate=!0}}),e.jsxs("points",{ref:h,renderOrder:2,children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[v.positions,3]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[v.colors,3]}),e.jsx("bufferAttribute",{attach:"attributes-aSize",args:[v.sizes,1]})]}),e.jsx("shaderMaterial",{uniforms:m,vertexShader:`
          attribute float aSize; attribute vec3 aColor;
          varying vec3 vColor; varying float vAlpha; uniform float pulse;
          void main() {
            vColor = aColor;
            float beat = 0.5 + 0.5 * pulse;
            vAlpha = beat;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (220.0 / -mv.z) * (0.9 + 0.5 * beat);
            gl_Position = projectionMatrix * mv;
          }
        `,fragmentShader:`
          varying vec3 vColor; varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord * 2.0 - 1.0;
            float d = abs(uv.x) + abs(uv.y) * 0.5; // tiny diamond
            if (d > 1.0) discard;
            float glow = pow(1.0 - d, 2.0);
            float core = pow(1.0 - d, 6.0); // hot white center
            vec3 col = mix(vColor, vec3(1.0), core * 0.7);
            col += vec3(0.3, 0.6, 0.8) * glow * 0.4;
            gl_FragColor = vec4(col, glow * vAlpha * 0.9);
          }
        `,transparent:!0,depthWrite:!1,blending:A})]})}function it({flowRef:m}){const y=u.useRef(),h=u.useRef(0),b=u.useMemo(()=>{const g=document.createElement("canvas");g.width=512,g.height=128;const p=g.getContext("2d");return p.clearRect(0,0,512,128),p.font="bold 72px monospace",p.textAlign="center",p.textBaseline="middle",p.fillStyle="#0052FF",p.shadowColor="#0052FF",p.shadowBlur=30,p.fillText("BASE",256,64),p.shadowBlur=0,p.fillText("BASE",256,64),new G(g)},[]);w((g,p)=>{var n;h.current+=p;const r=(m==null?void 0:m.current)||{pulse:.3};if(r.pulse=Math.max(.25,(r.pulse||0)-p*1.6),y.current){y.current.rotation.y=h.current*.08,y.current.rotation.x=Math.sin(h.current*.12)*.08;const a=Math.sin(h.current*1.5),t=Math.sin(h.current*.9)*.03,o=r.pulse,c=1+.04*a+.18*o;y.current.scale.set(c,c,c),y.current.position.y=t;const s=(n=y.current.children[0])==null?void 0:n.material;s&&(s.opacity=.7+.18*a+.18*o)}});const v=u.useMemo(()=>({time:{value:0},flow:{value:1},pulse:{value:0}}),[]);return w((g,p)=>{var r,n;v.time.value+=p*.5,v.flow.value=((r=m==null?void 0:m.current)==null?void 0:r.intensity)||1,v.pulse.value=((n=m==null?void 0:m.current)==null?void 0:n.pulse)||.3}),e.jsxs("group",{ref:y,scale:1.3,children:[e.jsxs("mesh",{renderOrder:0,children:[e.jsx("sphereGeometry",{args:[1.5,24,18]}),e.jsx("shaderMaterial",{uniforms:v,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float pulse; uniform float flow;
            void main(){
              float dist = length(vPos) / 1.5;
              float fog1 = pow(1.0 - dist, 2.0) * pow(dist, 0.4) * 1.5;
              float fog2 = pow(1.0 - dist, 0.8) * 0.4;
              float fog = fog1 + fog2;
              float swirl = sin(vPos.x*5.0+time*0.4)*sin(vPos.y*4.0+time*0.3)*sin(vPos.z*3.5+time*0.35);
              float turbulence = 0.5 + 0.5 * swirl;
              float beat = 0.4 + 0.6 * pulse;
              // Efecto neón cian y azul base puro
              vec3 col = mix(vec3(0.0,0.3,1.0), vec3(0.0,0.85,1.0), dist*0.5);
              col += vec3(0.0,0.5,1.0) * (1.0-dist) * 0.4;
              float alpha = fog * turbulence * 0.18 * beat * (0.5 + 0.5*flow);
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:A,side:q})]}),e.jsxs("mesh",{renderOrder:1,children:[e.jsx("sphereGeometry",{args:[1.2,20,14]}),e.jsx("shaderMaterial",{uniforms:v,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float flow; uniform float pulse;
            void main(){
              float dist = length(vPos) / 1.2;
              float radial = pow(1.0 - dist, 2.5);
              float swirl = sin(vPos.x*6.0+time*0.5)*sin(vPos.y*5.0+time*0.4)*sin(vPos.z*4.0+time*0.45);
              float tendrils = 0.4 + 0.6 * swirl;
              float noise = tendrils * 0.7 + 0.3;
              float beat = 0.3 + 0.7 * pulse;
              // Efecto neón cian y azul base
              vec3 col = mix(vec3(0.0,0.4,1.0), vec3(0.0,0.9,1.0), noise*0.5);
              col += vec3(0.0,0.5,1.0) * (1.0-dist) * 0.4;
              float alpha = radial * noise * 0.20 * beat * (0.4 + 0.6*flow);
              alpha *= smoothstep(1.0, 0.15, dist);
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:A,side:N})]}),e.jsx("sprite",{scale:[2.2,.55,1],renderOrder:-1,children:e.jsx("spriteMaterial",{map:b,transparent:!0,blending:A,opacity:.85,depthWrite:!1,depthTest:!0})}),e.jsx(rt,{gasUniforms:v}),e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[.38,32,24]}),e.jsx("shaderMaterial",{uniforms:v,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float flow; uniform float pulse;
            void main(){
              float dist = length(vPos) / 0.38;
              float radial = pow(1.0 - dist, 3.0);
              float swirl = sin(vPos.x*8.0+time*0.8)*sin(vPos.y*6.0+time*0.5)*sin(vPos.z*5.0+time*0.6);
              float noise = 0.7 + 0.3*swirl;
              float beat = 0.6 + 0.4*pulse;
              vec3 deepBlue = vec3(0.0,0.2,0.85);
              vec3 coreCyan = vec3(0.0,0.65,1.0);
              vec3 col = mix(deepBlue, coreCyan, (1.0-dist)*0.6 + noise*0.15);
              col += vec3(0.05,0.25,0.35) * (1.0-dist) * 0.4;
              float alpha = radial * 0.88 * noise * (0.75 + 0.4*flow) * beat;
              alpha *= smoothstep(1.0, 0.5, dist);
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:A,side:N})]}),e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[.62,24,18]}),e.jsx("shaderMaterial",{uniforms:v,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float flow; uniform float pulse;
            void main(){
              float dist = length(vPos) / 0.62;
              float radial = pow(1.0 - dist, 2.4);
              float beat = 0.55 + 0.45*pulse;
              vec3 col = mix(vec3(0.0,0.7,1.0), vec3(0.12,0.5,0.9), dist*0.5);
              float alpha = radial * 0.45 * beat * (0.7+0.35*flow);
              alpha *= smoothstep(1.0, 0.4, dist);
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:A,side:N})]}),e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[.88,16,12]}),e.jsx("shaderMaterial",{uniforms:v,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float pulse;
            void main(){
              float dist = length(vPos) / 0.88;
              float radial = pow(1.0 - dist, 3.2);
              float beat = 0.5 + 0.5*pulse;
              vec3 col = mix(vec3(0.0,0.6,1.0), vec3(0.12,0.8,0.75), dist*0.4);
              float alpha = radial * 0.25 * beat;
              alpha *= smoothstep(1.0, 0.3, dist);
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:A,side:N})]}),e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[1.45,20,16]}),e.jsx("shaderMaterial",{uniforms:v,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float pulse;
            void main(){
              float dist = length(vPos) / 1.45;
              float radial = pow(1.0 - dist, 2.0) * pow(dist, 0.3);
              float beat = 0.4 + 0.6*pulse;
              float phase = sin(time*0.4 + 2.0)*0.5+0.5;
              vec3 col = mix(vec3(0.0,0.55,0.95), vec3(0.12,0.75,0.8), dist*0.5+phase*0.15);
              float alpha = radial * 0.14 * beat;
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:A,side:N})]}),e.jsx(nt,{gasUniforms:v})]})}function nt({gasUniforms:m}){const g=4.840000000000001,p=u.useRef(),r=u.useRef([]),n=u.useMemo(()=>{const o=new Float32Array(216),c=new Float32Array(216),s=new Float32Array(360),l=new Float32Array(216);for(let i=0;i<72;i++){const M=i>=48;s[i*5]=1.5+Math.random()*2,s[i*5+1]=1+Math.random()*2.5,s[i*5+2]=Math.random()*3,s[i*5+3]=M?1:0,s[i*5+4]=1;const f=Math.random()*Math.PI*2,d=Math.acos(2*Math.random()-1),S=s[i*5];if(c[i*3]=Math.sin(d)*Math.cos(f)*S,c[i*3+1]=Math.sin(d)*Math.sin(f)*S,c[i*3+2]=Math.cos(d)*S,o[i*3]=(Math.random()-.5)*.04,o[i*3+1]=(Math.random()-.5)*.04,o[i*3+2]=(Math.random()-.5)*.04,M){const C=Math.random();l[i*3]=0,l[i*3+1]=.5+C*.4,l[i*3+2]=.95+C*.05}else{const C=Math.random();l[i*3]=0,l[i*3+1]=.75+C*.25,l[i*3+2]=1}}return{positions:o,velocities:c,seeds:s,colors:l}},[]);return w((o,c)=>{if(!p.current)return;const{positions:s,velocities:l,seeds:i,colors:M}=n;m.time.value,m.pulse.value;const f=[];for(let d=0;d<72;d++){const S=i[d*5+3]>.5;i[d*5+2]+=c;const C=i[d*5+2],j=i[d*5+1];if(C>=j){const T=Math.random()*Math.PI*2,P=Math.acos(2*Math.random()-1),_=1.5+Math.random()*2;l[d*3]=Math.sin(P)*Math.cos(T)*_,l[d*3+1]=Math.sin(P)*Math.sin(T)*_,l[d*3+2]=Math.cos(P)*_,s[d*3]=(Math.random()-.5)*.04,s[d*3+1]=(Math.random()-.5)*.04,s[d*3+2]=(Math.random()-.5)*.04,i[d*5]=_,i[d*5+2]=0,i[d*5+4]=1;continue}if(i[d*5+4]<.5)continue;s[d*3]+=l[d*3]*c,s[d*3+1]+=l[d*3+1]*c,s[d*3+2]+=l[d*3+2]*c;const F=S?.97:.992;l[d*3]*=F,l[d*3+1]*=F,l[d*3+2]*=F;const R=s[d*3]**2+s[d*3+1]**2+s[d*3+2]**2;if(R>=g&&i[d*5+4]>.5){const P=2.2/Math.sqrt(R);s[d*3]*=P,s[d*3+1]*=P,s[d*3+2]*=P,f.push({x:s[d*3],y:s[d*3+1],z:s[d*3+2],intensity:S?.6:1}),S?(l[d*3]*=-.3,l[d*3+1]*=-.3,l[d*3+2]*=-.3,i[d*5+2]=i[d*5+1]-.2):(i[d*5+4]=0,i[d*5+2]=i[d*5+1]-.1)}}r.current=f,p.current.geometry.attributes.position.needsUpdate=!0}),e.jsxs("points",{ref:p,renderOrder:10,children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[n.positions,3]}),e.jsx("bufferAttribute",{attach:"attributes-seeds",args:[n.seeds,5]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[n.colors,3]})]}),e.jsx("shaderMaterial",{uniforms:m,vertexShader:`
    attribute vec5 seeds;
    attribute vec3 aColor;
    uniform float time;
    uniform float pulse;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vType;
    varying float vAge;

    void main() {
      vColor = aColor;
      float speed = seeds.x;
      float maxLife = seeds.y;
      float age = seeds.z;
      float type = seeds.w;
      float alive = seeds.a;

      vType = type;
      float lifeRatio = clamp(age / maxLife, 0.0, 1.0);
      vAge = lifeRatio;

      // Fade: sharp birth, aggressive death
      float birth = smoothstep(0.0, 0.08, lifeRatio);
      float death = 1.0 - smoothstep(0.6, 1.0, lifeRatio);
      float alive_f = step(0.5, alive);

      // Size: sparks microscopic — tiny pinpricks
      float baseSize = type < 0.5 ? 0.03 : 0.012;
      // Distance-based scaling
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      float dist = length(position);
      float perspScale = 12.0 / (-mvPos.z);

      vAlpha = birth * death * alive_f * (0.7 + 0.3 * pulse);
      gl_PointSize = baseSize * perspScale * (1.0 - lifeRatio * 0.4);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    varying vec3 vColor;
    varying float vAlpha;
    varying float vType;
    varying float vAge;

    void main() {
      vec2 uv = gl_PointCoord * 2.0 - 1.0;
      float r = length(uv);
      if (r > 1.0) discard; // MÁSCARA CIRCULAR ESTRICTA — IMPOSIBLE QUE SEAN CUADRADOS

      float ax = abs(uv.x);
      float ay = abs(uv.y);

      // Estrella de 4 puntas orgánica dentro de límite circular
      float spikeX = smoothstep(0.20, 0.0, ay) * pow(1.0 - ax, 2.0);
      float spikeY = smoothstep(0.20, 0.0, ax) * pow(1.0 - ay, 2.0);
      float starCross = max(spikeX, spikeY);

      float centerGlow = pow(1.0 - r, 2.5);
      float hotCore = pow(1.0 - r, 10.0);

      vec3 hotColor = mix(vColor, vec3(1.0), hotCore * 0.85);
      float alpha = (starCross * 0.6 + centerGlow * 0.4) * vAlpha;

      gl_FragColor = vec4(hotColor, alpha);
    }
  `,transparent:!0,depthWrite:!1,blending:A})]})}function lt(){const h=u.useRef(),b=u.useRef([]),v=u.useRef(0),g=u.useMemo(()=>{const r=new Float32Array(1950),n=new Float32Array(650*3),a=new Float32Array(650);for(let t=0;t<650;t++){const o=Math.random()*Math.PI*2,c=Math.acos(2*Math.random()-1),s=4.8+Math.random()*12;r[t*3]=s*Math.sin(c)*Math.cos(o),r[t*3+1]=s*Math.sin(c)*Math.sin(o),r[t*3+2]=s*Math.cos(c);const l=Math.random();l<.5?(n[t*3]=0,n[t*3+1]=.85,n[t*3+2]=1):l<.8?(n[t*3]=0,n[t*3+1]=.4,n[t*3+2]=1):(n[t*3]=.1,n[t*3+1]=.9,n[t*3+2]=.7),a[t]=.02+Math.random()*.035}return{positions:r,colors:n,sizes:a}},[]),p=u.useMemo(()=>Array.from({length:16},()=>{const r=Math.random()*Math.PI*2,n=Math.acos(2*Math.random()-1),a=5.5+Math.random()*8.5,t=Math.random();let o;return t<.4?o=[0,.82,1]:t<.7?o=[0,.45,.95]:o=[.1,.88,.72],{position:[a*Math.sin(n)*Math.cos(r),a*Math.sin(n)*Math.sin(r),a*Math.cos(n)],scale:1.8+Math.random()*2.5,color:o,rotSpeed:(Math.random()-.5)*.02,bobSpeed:.1+Math.random()*.2,bobAmp:.2+Math.random()*.4,phase:Math.random()*Math.PI*2}}),[]);return w((r,n)=>{v.current+=n,h.current&&(h.current.rotation.y=v.current*.008),b.current.forEach((a,t)=>{if(!a)return;const o=p[t],c=v.current;a.position.x=o.position[0]+Math.sin(c*o.rotSpeed+o.phase)*o.bobAmp,a.position.y=o.position[1]+Math.cos(c*o.bobSpeed+o.phase)*o.bobAmp*.6,a.position.z=o.position[2]+Math.sin(c*o.rotSpeed*.7+o.phase*1.3)*o.bobAmp*.4})}),e.jsxs("group",{ref:h,children:[e.jsxs("points",{children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[g.positions,3]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[g.colors,3]}),e.jsx("bufferAttribute",{attach:"attributes-aSize",args:[g.sizes,1]})]}),e.jsx("shaderMaterial",{vertexShader:`
            attribute float aSize; attribute vec3 aColor; varying vec3 vColor;
            void main() {
              vColor = aColor;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = aSize * (350.0 / -mv.z);
              gl_Position = projectionMatrix * mv;
            }
          `,fragmentShader:`
            varying vec3 vColor;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              float g = pow(1.0 - d * 2.0, 1.8);
              gl_FragColor = vec4(vColor, g * 0.55);
            }
          `,transparent:!0,depthWrite:!1,blending:A})]}),p.map((r,n)=>e.jsxs("mesh",{ref:a=>b.current[n]=a,position:r.position,children:[e.jsx("planeGeometry",{args:[1,1]}),e.jsx("shaderMaterial",{uniforms:{color:{value:new I(r.color[0],r.color[1],r.color[2])},scaleVal:{value:r.scale}},vertexShader:`
              uniform float scaleVal;
              varying vec2 vUv;
              void main() {
                vUv = uv;
                vec4 mvPos = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                mvPos.xy += (uv - 0.5) * scaleVal;
                gl_Position = projectionMatrix * mvPos;
              }
            `,fragmentShader:`
              uniform vec3 color;
              varying vec2 vUv;
              void main() {
                vec2 center = vUv - 0.5;
                float dist = length(center);
                // ESTRICTO MÁSCARA CIRCULAR: obliga a alpha 0.0 antes de dist = 0.45
                float edgeMask = smoothstep(0.45, 0.12, dist);
                float radial = pow(max(0.0, 1.0 - dist * 2.1), 2.2);
                float turb = sin(vUv.x * 12.0) * sin(vUv.y * 10.0) * 0.25 + 0.75;
                float alpha = radial * turb * 0.22 * edgeMask;
                if (alpha < 0.002) discard;
                gl_FragColor = vec4(color, alpha);
              }
            `,transparent:!0,depthWrite:!1,blending:A,side:J})]},n))]})}function ct({liveData:m,onImpact:y,flowRef:h}){const v=u.useRef(0),g=u.useRef(),p=2.2,r=p*p,n=s=>{var d;const l=Math.random()*Math.PI*2,i=Math.acos(2*Math.random()-1),M=Math.max(.5,Math.min(1.8,((d=h==null?void 0:h.current)==null?void 0:d.intensity)||1)),f=(1.6+Math.random()*1)*(.9+.3*M);s[0]=Math.sin(i)*Math.cos(l)*f,s[1]=Math.sin(i)*Math.sin(l)*f,s[2]=Math.cos(i)*f},a=(s,l,i)=>{Math.random()<.5?(s[i*3]=0,s[i*3+1]=.85,s[i*3+2]=1,l[i]=.04+Math.random()*.03):(s[i*3]=0,s[i*3+1]=.4,s[i*3+2]=1,l[i]=.035+Math.random()*.03)},t=u.useMemo(()=>{const s=new Float32Array(156),l=new Float32Array(156),i=new Float32Array(156),M=new Float32Array(52),f=new Float32Array(52),d=new Float32Array(52),S=new Uint8Array(52);for(let C=0;C<52;C++){const j=Math.random()*.08,F=Math.random()*Math.PI*2,R=Math.acos(2*Math.random()-1);s[C*3]=j*Math.sin(R)*Math.cos(F),s[C*3+1]=j*Math.sin(R)*Math.sin(F),s[C*3+2]=j*Math.cos(R);const T=Math.random()*Math.PI*2,P=Math.acos(2*Math.random()-1),_=1.6+Math.random()*1;l[C*3]=Math.sin(P)*Math.cos(T)*_,l[C*3+1]=Math.sin(P)*Math.sin(T)*_,l[C*3+2]=Math.cos(P)*_,a(i,M,C),f[C]=Math.random()*1.5,d[C]=1.8+Math.random()*.8}return{positions:s,velocities:l,colors:i,sizes:M,lifetimes:f,maxLifetimes:d,hit:S}},[]),o=u.useMemo(()=>({time:{value:0},flow:{value:1}}),[]),c=u.useRef(0);return w((s,l)=>{var B,D;v.current+=l,o.time.value=v.current;const i=Math.max(.5,Math.min(1.8,((B=h==null?void 0:h.current)==null?void 0:B.intensity)||1));o.flow.value=i;const M=((D=h==null?void 0:h.current)==null?void 0:D.pulse)>.95&&v.current-c.current>1.2;M&&(c.current=v.current);const{positions:f,velocities:d,colors:S,sizes:C,lifetimes:j,maxLifetimes:F,hit:R}=t,T=[0,0,0];let P=!1,_=M?8:0;for(let x=0;x<52;x++){j[x]+=l;const V=_>0&&j[x]>.15;if(j[x]>=F[x]||V){V&&_--;const W=Math.random()*.08,E=Math.random()*Math.PI*2,L=Math.acos(2*Math.random()-1);f[x*3]=W*Math.sin(L)*Math.cos(E),f[x*3+1]=W*Math.sin(L)*Math.sin(E),f[x*3+2]=W*Math.cos(L),n(T),d[x*3]=T[0],d[x*3+1]=T[1],d[x*3+2]=T[2],a(S,C,x),P=!0,j[x]=0,F[x]=1.8+Math.random()*.8,R[x]=0;continue}const H=Math.sqrt(f[x*3]*f[x*3]+f[x*3+1]*f[x*3+1]+f[x*3+2]*f[x*3+2]),U=H>1.6?(H-1.6)/.6:0;U>0&&(d[x*3]*=1-U*.08,d[x*3+1]*=1-U*.08,d[x*3+2]*=1-U*.08,C[x]=C[x]*(1+U*.8)),f[x*3]+=d[x*3]*l,f[x*3+1]+=d[x*3+1]*l,f[x*3+2]+=d[x*3+2]*l;const Y=f[x*3]*f[x*3]+f[x*3+1]*f[x*3+1]+f[x*3+2]*f[x*3+2];if(Y>=r)if(R[x])C[x]*=1.06;else{R[x]=1;const W=Math.sqrt(Y),E=p/W;f[x*3]*=E,f[x*3+1]*=E,f[x*3+2]*=E,d[x*3]=0,d[x*3+1]=0,d[x*3+2]=0,y&&y({position:new z(f[x*3],f[x*3+1],f[x*3+2]),intensity:1}),j[x]=F[x]-.8}}g.current&&(g.current.geometry.attributes.position.needsUpdate=!0,P&&(g.current.geometry.attributes.aColor.needsUpdate=!0,g.current.geometry.attributes.aSize.needsUpdate=!0))}),e.jsxs("points",{ref:g,children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[t.positions,3]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[t.colors,3]}),e.jsx("bufferAttribute",{attach:"attributes-aSize",args:[t.sizes,1]})]}),e.jsx("shaderMaterial",{uniforms:o,vertexShader:`
          attribute float aSize; attribute vec3 aColor;
          varying vec3 vColor; varying float vAlpha; uniform float time; uniform float flow;
          void main() {
            vColor = aColor;
            float dist = length(position);
            float travel = clamp(dist / 2.2, 0.0, 1.0);
            // PARTS visible through entire journey — fade gently at edge, don't vanish
            float edgeFade = 1.0 - smoothstep(0.7, 1.05, travel) * 0.4;
            vAlpha = (0.8 + 0.2 * sin(time * 2.0 + dist * 4.0)) * (0.9 + 0.25 * flow) * edgeFade;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float sz = aSize * (1.0 + travel * 0.8);
            gl_PointSize = sz * (1.0 + 0.6 * flow) * (220.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,fragmentShader:`
          varying vec3 vColor; varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord * 2.0 - 1.0;
            float r = length(uv);
            if (r > 1.0) discard; // Strict circular boundary — NO SQUARES

            float ax = abs(uv.x);
            float ay = abs(uv.y);
            float spikeX = smoothstep(0.18, 0.0, ay) * pow(1.0 - ax, 2.0);
            float spikeY = smoothstep(0.18, 0.0, ax) * pow(1.0 - ay, 2.0);
            float starCross = max(spikeX, spikeY);

            float centerGlow = pow(1.0 - r, 2.5);
            float hotCore = pow(1.0 - r, 10.0);
            vec3 hotColor = mix(vColor, vec3(1.0), hotCore * 0.8);
            float alpha = (starCross * 0.6 + centerGlow * 0.4) * vAlpha;

            gl_FragColor = vec4(hotColor, alpha);
          }
        `,transparent:!0,depthWrite:!1,blending:A})]})}function pt(){const{positions:y,colors:h,sizes:b}=u.useMemo(()=>{const g=new Float32Array(180),p=new Float32Array(180),r=new Float32Array(60);for(let n=0;n<60;n++){const a=Math.acos(-1+2*n/60),t=Math.sqrt(60*Math.PI)*a,o=2.35;g[n*3]=o*Math.cos(t)*Math.sin(a),g[n*3+1]=o*Math.sin(t)*Math.sin(a),g[n*3+2]=o*Math.cos(a);const c=n>=36;if(c)p[n*3]=.133,p[n*3+1]=.827,p[n*3+2]=.933;else{const s=new I().setHSL(.75+Math.random()*.1,.7,.6);p[n*3]=s.r,p[n*3+1]=s.g,p[n*3+2]=s.b}r[n]=c?.09:.055}return{positions:g,colors:p,sizes:r}},[]),v=u.useMemo(()=>({time:{value:0}}),[]);return w((g,p)=>{v.time.value+=p*1.5}),e.jsxs("points",{children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[y,3]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[h,3]}),e.jsx("bufferAttribute",{attach:"attributes-aSize",args:[b,1]})]}),e.jsx("shaderMaterial",{uniforms:v,vertexShader:`
          attribute float aSize; attribute vec3 aColor;
          varying vec3 vColor; varying float vAlpha; uniform float time;
          void main() {
            vColor = aColor;
            vec3 pos = position;
            pos += normalize(position) * sin(time * 1.0 + position.x * 2.5) * 0.025;
            vAlpha = 0.5 + 0.5 * sin(time * 1.6 + position.y * 1.8);
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = aSize * (360.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,fragmentShader:`
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 2.0);
            gl_FragColor = vec4(vColor, glow * vAlpha * 0.8);
          }
        `,transparent:!0,depthWrite:!1,blending:A})]})}function dt(){const m=u.useRef(),y=u.useMemo(()=>({time:{value:0}}),[]),h=u.useRef(0);w((p,r)=>{h.current+=r,y.time.value=h.current,m.current&&(m.current.rotation.y=h.current*.06)});const{positions:b,colors:v,sizes:g}=u.useMemo(()=>{const r=new Float32Array(150),n=new Float32Array(150),a=new Float32Array(50);for(let t=0;t<50;t++){const o=t/50*Math.PI*2,c=t%3,s=2.55+c*.22,l=.15*c;r[t*3]=s*Math.cos(o),r[t*3+1]=s*Math.sin(o)*Math.sin(l),r[t*3+2]=s*Math.sin(o)*Math.cos(l);const i=t/50;n[t*3]=.659*(1-i)+.133*i,n[t*3+1]=.333*(1-i)+.827*i,n[t*3+2]=.969*(1-i)+.933*i,a[t]=.015+Math.random()*.025}return{positions:r,colors:n,sizes:a}},[]);return e.jsx("group",{ref:m,children:e.jsxs("points",{children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[b,3]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[v,3]}),e.jsx("bufferAttribute",{attach:"attributes-aSize",args:[g,1]})]}),e.jsx("shaderMaterial",{uniforms:y,vertexShader:`
            attribute float aSize; attribute vec3 aColor;
            varying vec3 vColor; varying float vAlpha; uniform float time;
            void main() {
              vColor = aColor;
              vAlpha = 0.4 + 0.6 * sin(time * 2.0 + position.x * 3.0);
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = aSize * (280.0 / -mv.z);
              gl_Position = projectionMatrix * mv;
            }
          `,fragmentShader:`
            varying vec3 vColor; varying float vAlpha;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              float glow = pow(1.0 - d * 2.0, 1.5);
              gl_FragColor = vec4(vColor, glow * vAlpha * 0.7);
            }
          `,transparent:!0,depthWrite:!1,blending:A})]})})}function ut({onImpactsReady:m}){const y=u.useRef([]),h=u.useRef(Array.from({length:8},()=>({position:new z,intensity:0,active:!1,age:0})));return w((b,v)=>{for(;y.current.length>0&&h.current.some(p=>!p.active);){const p=y.current.shift(),r=h.current.find(n=>!n.active);r&&(r.position.copy(p.position),r.intensity=p.intensity,r.active=!0,r.age=0)}const g=.8;h.current.forEach(p=>{p.active&&(p.age+=v,p.intensity=Math.max(0,1-p.age*g),p.intensity<=0&&(p.active=!1))}),m(h.current.filter(p=>p.active).map(p=>({position:p.position,intensity:p.intensity})))}),u.useEffect(()=>(window.__aetherius_addImpact=b=>{y.current.push(b)},()=>{delete window.__aetherius_addImpact}),[]),null}function ft(){const[m,y]=u.useState([]),h=u.useRef(""),b=u.useCallback(v=>{let g=v.length+":";for(let p=0;p<v.length;p++){const r=v[p];g+=r.position.x.toFixed(1)+","+r.position.y.toFixed(1)+","+r.position.z.toFixed(1)+","+r.intensity.toFixed(2)+";"}g!==h.current&&(h.current=g,y(v))},[]);return e.jsxs(e.Fragment,{children:[e.jsx(st,{impactPoints:m}),e.jsx(ut,{onImpactsReady:b})]})}function ht(){const m=u.useRef(),y=u.useRef(0),{positions:h,colors:b,sizes:v}=u.useMemo(()=>{const r=new Float32Array(24),n=new Float32Array(24),a=new Float32Array(8);for(let t=0;t<8;t++){const o=t/8*Math.PI*2+Math.random()*.5,c=4+Math.random()*2;r[t*3]=c*Math.cos(o),r[t*3+1]=(Math.random()-.5)*3,r[t*3+2]=c*Math.sin(o);const s=Math.random();s<.4?(n[t*3]=.13,n[t*3+1]=.82,n[t*3+2]=.93):s<.7?(n[t*3]=.84,n[t*3+1]=.27,n[t*3+2]=.93):(n[t*3]=.83,n[t*3+1]=.66,n[t*3+2]=.32),a[t]=.08+Math.random()*.06}return{positions:r,colors:n,sizes:a}},[]),g=u.useMemo(()=>({time:{value:0}}),[]);return w((p,r)=>{var a,t,o;y.current+=r,g.time.value=y.current,m.current&&(m.current.rotation.y=y.current*.02);const n=(o=(t=(a=m.current)==null?void 0:a.geometry)==null?void 0:t.attributes)==null?void 0:o.aSize;if(n){for(let c=0;c<8;c++)n.array[c]=.06+.05*Math.sin(y.current*2+c*1.5);n.needsUpdate=!0}}),e.jsxs("points",{ref:m,children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[h,3]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[b,3]}),e.jsx("bufferAttribute",{attach:"attributes-aSize",args:[v,1]})]}),e.jsx("shaderMaterial",{uniforms:g,vertexShader:"attribute float aSize; attribute vec3 aColor; varying vec3 vColor; varying float vAlpha; uniform float time; void main(){vColor=aColor; vAlpha=0.6+0.4*sin(time*1.2+position.x*2.0); vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*(500.0/-mv.z); gl_Position=projectionMatrix*mv;}",fragmentShader:"varying vec3 vColor; varying float vAlpha; void main(){ float d=length(gl_PointCoord-vec2(0.5)); if(d>0.5)discard; float g=pow(1.0-d*2.0,1.5); gl_FragColor=vec4(vColor,g*vAlpha);}",transparent:!0,depthWrite:!1,blending:A})]})}function vt(){const y=u.useRef();u.useRef([]);const h=u.useRef(0),b=u.useMemo(()=>{const p=new Float32Array(3600),r=new Float32Array(1200*3),n=new Float32Array(1200),a=()=>Math.random();for(let t=0;t<1200;t++){const o=a()*Math.PI*2,c=Math.acos(2*a()-1),s=a();let l,i;s<.45?(l=6+a()*6,i=.07):s<.8?(l=12+a()*8,i=.05):(l=20+a()*8,i=.035),p[t*3]=l*Math.sin(c)*Math.cos(o),p[t*3+1]=l*Math.sin(c)*Math.sin(o),p[t*3+2]=l*Math.cos(c);const M=a();M<.4?(r[t*3]=.95,r[t*3+1]=.97,r[t*3+2]=1):M<.55?(r[t*3]=.3,r[t*3+1]=.95,r[t*3+2]=1):M<.68?(r[t*3]=1,r[t*3+1]=1,r[t*3+2]=1):M<.78?(r[t*3]=.6,r[t*3+1]=.8,r[t*3+2]=1):M<.88?(r[t*3]=.95,r[t*3+1]=.35,r[t*3+2]=.9):(r[t*3]=1,r[t*3+1]=.82,r[t*3+2]=.55),n[t]=i+a()*.035}return{positions:p,colors:r,sizes:n}},[]),v=u.useMemo(()=>{const r=new Float32Array(96),n=new Float32Array(96),a=new Float32Array(32),t=new Float32Array(64),o=()=>Math.random();for(let c=0;c<32;c++){const s=o()*Math.PI*2,l=Math.acos(2*o()-1),i=o()<.65?6+o()*8:14+o()*9;r[c*3]=i*Math.sin(l)*Math.cos(s),r[c*3+1]=i*Math.sin(l)*Math.sin(s),r[c*3+2]=i*Math.cos(l);const M=o();let f=[0,.8,1];M<.25?f=[0,.82,1]:M<.45?f=[.1,.92,.7]:M<.6?f=[.05,.55,.95]:M<.78?f=[.15,.75,.88]:f=[.35,.15,.8],n[c*3]=f[0],n[c*3+1]=f[1],n[c*3+2]=f[2],a[c]=220+o()*260,t[c*2]=2+o()*3,t[c*2+1]=o()*100}return{positions:r,colors:n,sizes:a,noise:t}},[]);return w((p,r)=>{h.current+=r;const n=h.current;y.current&&(y.current.rotation.y=n*.0018,y.current.rotation.x=Math.sin(n*.0012)*.012)}),e.jsxs("group",{ref:y,children:[e.jsxs("points",{children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[b.positions,3]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[b.colors,3]}),e.jsx("bufferAttribute",{attach:"attributes-aSize",args:[b.sizes,1]})]}),e.jsx("shaderMaterial",{vertexShader:`
            attribute float aSize;
            attribute vec3 aColor;
            varying vec3 vColor;
            varying float vDist;
            void main() {
              vColor = aColor;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vDist = -mv.z;
              gl_PointSize = aSize * (380.0 / vDist);
              gl_Position = projectionMatrix * mv;
            }
          `,fragmentShader:`
            varying vec3 vColor;
            varying float vDist;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              if (d > 0.5) discard;
              float glow = pow(1.0 - d * 2.0, 1.8);
              float core = pow(1.0 - d * 2.0, 8.0);
              vec3 col = vColor + vec3(1.0) * core * 0.4;
              float distFade = clamp(1.0 - (vDist - 6.0) / 30.0, 0.35, 1.0);
              gl_FragColor = vec4(col, glow * distFade);
            }
          `,transparent:!0,depthWrite:!1,blending:A})]}),e.jsxs("points",{children:[e.jsxs("bufferGeometry",{children:[e.jsx("bufferAttribute",{attach:"attributes-position",args:[v.positions,3]}),e.jsx("bufferAttribute",{attach:"attributes-aColor",args:[v.colors,3]}),e.jsx("bufferAttribute",{attach:"attributes-aSize",args:[v.sizes,1]}),e.jsx("bufferAttribute",{attach:"attributes-aNoise",args:[v.noise,2]})]}),e.jsx("shaderMaterial",{vertexShader:`
            attribute float aSize;
            attribute vec3 aColor;
            attribute vec2 aNoise;
            varying vec3 vColor;
            varying vec2 vNoiseParams;
            varying float vDist;
            void main() {
              vColor = aColor;
              vNoiseParams = aNoise;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vDist = -mv.z;
              gl_PointSize = aSize * (320.0 / vDist);
              gl_Position = projectionMatrix * mv;
            }
          `,fragmentShader:`
            varying vec3 vColor;
            varying vec2 vNoiseParams;
            varying float vDist;

            
    float hash21(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * vnoise(p);
        p = p * 2.1 + vec2(37.0, 17.0);
        a *= 0.5;
      }
      return v;
    }
  

            void main() {
              vec2 coord = gl_PointCoord - vec2(0.5);
              float dist = length(coord);
              if (dist > 0.5) discard; // Hardware circular clip — ZERO square artifacts!

              float uvDist = dist * 2.0;
              vec2 noiseCoord = coord * vNoiseParams.x + vNoiseParams.y;
              float n = fbm(noiseCoord);

              float warpedDist = uvDist + n * 0.45 - 0.2;
              float radial = pow(max(0.0, 1.0 - warpedDist * 2.0), 2.2);

              float filaments = fbm(noiseCoord * 1.8);
              filaments = smoothstep(0.2, 0.8, filaments);

              float edgeMask = smoothstep(1.0, 0.15, uvDist);
              float alpha = radial * (0.35 + filaments * 0.65) * 0.26 * edgeMask;
              if (alpha < 0.001) discard;

              float distFade = clamp(1.0 - (vDist - 6.0) / 28.0, 0.3, 1.0);
              alpha *= distFade;

              vec3 col = vColor + vec3(filaments * 0.1, n * 0.05, filaments * 0.08);
              gl_FragColor = vec4(col, alpha);
            }
          `,transparent:!0,depthWrite:!1,blending:A})]})]})}function Mt({liveData:m,paused:y}){const h=u.useMemo(()=>typeof window>"u"?!1:window.matchMedia("(pointer: coarse)").matches||window.innerWidth<768,[]),b=u.useCallback(a=>{window.__aetherius_addImpact&&window.__aetherius_addImpact(a)},[]),v=u.useRef({intensity:1,pulse:.4,block:null});u.useEffect(()=>{const a=()=>{const o=m||{},c=parseFloat(String(o.volume||"").replace(/[^0-9.]/g,""))||0,s=parseFloat(String(o.gas||"").replace(/[^0-9.]/g,""))||0;let l=.9+Math.min(c/500,.5)+Math.min(s/50,.25)+Math.random()*.15;l=Math.max(.6,Math.min(1.8,l));const i=v.current;i.intensity=l,o.block&&o.block!=="—"&&o.block!==i.block?(i.block=o.block,i.pulse=1):i.pulse=Math.max(.3,(i.pulse||.3)*.94)};a();const t=setInterval(a,400);return()=>clearInterval(t)},[m]);const g=u.useMemo(()=>({position:[0,.3,10.5],fov:40}),[]),p=u.useMemo(()=>({alpha:!0,antialias:!h,powerPreference:"high-performance"}),[h]),r=u.useMemo(()=>({position:"absolute",inset:0,width:"100%",height:"100%",background:"transparent"}),[]),n=u.useMemo(()=>[1,1.5],[]);return e.jsxs(K,{camera:g,gl:p,onCreated:({gl:a})=>a.setClearColor(0,0),style:r,dpr:n,frameloop:y?"demand":"always",children:[e.jsx("ambientLight",{intensity:.05}),e.jsxs("group",{scale:1.3,children:[e.jsx(it,{flowRef:v}),e.jsx(ft,{}),e.jsx(ct,{liveData:m,onImpact:b,flowRef:v}),e.jsx(at,{}),e.jsx(ot,{}),e.jsx(pt,{}),e.jsx(et,{liveData:m}),e.jsx(dt,{}),e.jsx(tt,{})]}),!h&&e.jsxs(e.Fragment,{children:[e.jsx(vt,{}),e.jsx(k,{radius:12,depth:30,count:350,factor:1.2,saturation:.15,fade:!0,speed:.12}),e.jsx(k,{radius:8,depth:15,count:180,factor:.6,saturation:.2,fade:!0,speed:.08}),e.jsx(k,{radius:20,depth:50,count:80,factor:.5,saturation:.1,fade:!0,speed:.05}),e.jsx(lt,{}),e.jsx(ht,{})]}),e.jsx(X,{autoRotate:!0,autoRotateSpeed:1,enableZoom:!1,enablePan:!1,enableDamping:!0,dampingFactor:.08,rotateSpeed:.5,minPolarAngle:Math.PI*.25,maxPolarAngle:Math.PI*.75})]})}export{Mt as default};
