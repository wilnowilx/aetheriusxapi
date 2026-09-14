import{r as u,j as t,C as J,S as $,O as K,u as j}from"./r3f-CfJ9YJZ_.js";import{q as R,r as H,p as C,F,e as N,s as q,h as w}from"./three-BuKzPtX4.js";const Q=({liveData:d})=>{const f=u.useRef(),n=u.useRef(0),b=u.useMemo(()=>{const i=d||{};return[{radius:3.6,tilt:.18,yOffset:.45,speed:.025,bandWidth:.42,color:"#ffffff",opacity:.9,fontSize:44,text:"THE MARKETPLACE   THAT LIVES   "},{radius:3.05,tilt:.32,yOffset:-.15,speed:-.035,bandWidth:.36,color:"#d946ef",opacity:.78,fontSize:34,text:"API INFRASTRUCTURE   FOR AI AGENTS   THAT PAY   "},{radius:2.55,tilt:.12,yOffset:-.55,speed:.04,bandWidth:.32,color:"#22d3ee",opacity:.68,fontSize:28,text:`${i.endpoints||"100+"} ENDPOINTS   ${i.freeEndpoints||"40"} FREE   ${i.latency||"—"}   `}]},[d]),g=u.useMemo(()=>b.map(i=>{const e=document.createElement("canvas");e.width=4096,e.height=160;const o=e.getContext("2d");o.clearRect(0,0,e.width,e.height);const M=`900 ${i.fontSize*1.35}px 'JetBrains Mono', 'Fira Code', monospace`;o.font=M,o.textAlign="center",o.textBaseline="middle";const l=i.text,v=o.measureText(l).width,c=Math.ceil((e.width+v)/v),y=(e.width-v*c)/2+v/2;o.shadowColor=i.color,o.shadowBlur=48,o.fillStyle=i.color;for(let x=0;x<c;x++)o.fillText(l,y+x*v,e.height/2);o.shadowBlur=22;for(let x=0;x<c;x++)o.fillText(l,y+x*v,e.height/2);o.shadowBlur=0,o.fillStyle=i.color==="#ffffff"?"#ffffff":i.color;for(let x=0;x<c;x++)o.fillText(l,y+x*v,e.height/2);o.fillStyle="#ffffff",o.globalAlpha=.85;for(let x=0;x<c;x++)o.fillText(l,y+x*v,e.height/2);o.globalAlpha=1;const h=new R(e);return h.anisotropy=8,h.minFilter=q,h.magFilter=q,h}),[b]),m=u.useMemo(()=>b.map(i=>{const e=document.createElement("canvas");e.width=4096,e.height=160;const o=e.getContext("2d");o.clearRect(0,0,e.width,e.height),o.font=`900 ${i.fontSize*1.35}px 'JetBrains Mono', 'Fira Code', monospace`,o.textAlign="center",o.textBaseline="middle";const M=i.text,l=o.measureText(M).width,v=Math.ceil((e.width+l)/l),c=(e.width-l*v)/2+l/2;o.shadowColor=i.color,o.shadowBlur=28,o.fillStyle=i.color,o.globalAlpha=.35;for(let h=0;h<v;h++)o.fillText(M,c+h*l,e.height/2);o.globalAlpha=1;const y=new R(e);return y.anisotropy=4,y}),[b]),[a,p]=u.useState(null),r=u.useRef(0);return j((i,e)=>{n.current+=e,r.current+=e,f.current&&b.forEach((o,M)=>{const l=f.current.children[M];if(l){a===M||(l.rotation.y+=e*o.speed);const c=l.children[0];if(c!=null&&c.material){const y=.88+.12*Math.sin(r.current*.7+M*1.2);c.material.opacity=(a===M?1:o.opacity)*y}}})}),t.jsx("group",{ref:f,children:b.map((i,e)=>t.jsxs("group",{position:[0,i.yOffset,0],rotation:[i.tilt,0,0],children:[t.jsxs("mesh",{onPointerOver:o=>{o.stopPropagation(),p(e),document.body.style.cursor="pointer"},onPointerOut:()=>{p(null),document.body.style.cursor="auto"},onClick:()=>{window.__aetherius_addImpact&&window.__aetherius_addImpact({position:new w(i.radius,i.yOffset,0),intensity:.8})},children:[t.jsx("cylinderGeometry",{args:[i.radius,i.radius,i.bandWidth,128,1,!0]}),t.jsx("meshBasicMaterial",{map:g[e],transparent:!0,opacity:i.opacity,side:F,depthWrite:!1,blending:C,toneMapped:!1})]}),t.jsxs("mesh",{children:[t.jsx("cylinderGeometry",{args:[i.radius,i.radius,i.bandWidth,128,1,!0]}),t.jsx("meshBasicMaterial",{map:m[e],transparent:!0,opacity:.22,side:H,depthWrite:!1,blending:C,toneMapped:!1})]}),t.jsxs("mesh",{children:[t.jsx("torusGeometry",{args:[i.radius,i.bandWidth*.06,6,128]}),t.jsx("meshBasicMaterial",{color:i.color,transparent:!0,opacity:i.opacity*.12,depthWrite:!1})]})]},e))})};function Y(){const d=u.useMemo(()=>({time:{value:0},colorA:{value:new N(2282478)},colorB:{value:new N(11032055)},colorC:{value:new N(14239471)}}),[]);return j((f,n)=>{d.time.value+=n*.6}),t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[2.65,28,20]}),t.jsx("shaderMaterial",{uniforms:d,vertexShader:`
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
        `,side:F,transparent:!0,depthWrite:!1,blending:C})]})}function Z(){const d=u.useMemo(()=>({time:{value:0}}),[]);return j((f,n)=>{d.time.value+=n*.4}),t.jsxs("mesh",{scale:.85,children:[t.jsx("sphereGeometry",{args:[2.2,32,32]}),t.jsx("shaderMaterial",{uniforms:d,vertexShader:`
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
        `,side:F,transparent:!0,depthWrite:!1,blending:C})]})}function X({impactPoints:d}){const f=u.useRef(),n=u.useMemo(()=>({time:{value:0},impact0:{value:new w(0,0,0)},i0t:{value:0},impact1:{value:new w(0,0,0)},i1t:{value:0},impact2:{value:new w(0,0,0)},i2t:{value:0},impact3:{value:new w(0,0,0)},i3t:{value:0},impact4:{value:new w(0,0,0)},i4t:{value:0},impact5:{value:new w(0,0,0)},i5t:{value:0},impact6:{value:new w(0,0,0)},i6t:{value:0},impact7:{value:new w(0,0,0)},i7t:{value:0}}),[]);return j((b,g)=>{if(n.time.value+=g*.5,d)for(let m=0;m<8&&m<d.length;m++){const a=d[m];n[`impact${m}`].value.copy(a.position),n[`i${m}t`].value=a.intensity}}),t.jsxs("mesh",{ref:f,children:[t.jsx("sphereGeometry",{args:[2.2,36,24]}),t.jsx("shaderMaterial",{uniforms:n,vertexShader:`
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

          float impactPulse(vec3 worldPos, vec3 impactPos, float intensity) {
            float dist = length(worldPos - impactPos);
            float ring = abs(dist - time * 0.5 * intensity);
            float ringPulse = exp(-ring * 0.8) * intensity;
            float prox = exp(-dist * 1.2) * intensity * 0.5;
            return (ringPulse*0.4 + prox) * intensity;
          }
          float polarGlow(vec3 pos) {
            return pow(abs(pos.y / 2.2), 2.5) * 0.6;
          }

          void main() {
            float pulse = 0.6 + 0.4 * sin(time * 0.5 + vWorldPos.y * 2.0);
            float fade = smoothstep(0.0, 0.3, abs(vPos.y));

            // Accumulate impact pulses
            float impacts = 0.0;
            impacts += impactPulse(vWorldPos, impact0, i0t);
            impacts += impactPulse(vWorldPos, impact1, i1t);
            impacts += impactPulse(vWorldPos, impact2, i2t);
            impacts += impactPulse(vWorldPos, impact3, i3t);
            impacts += impactPulse(vWorldPos, impact4, i4t);
            impacts += impactPulse(vWorldPos, impact5, i5t);
            impacts += impactPulse(vWorldPos, impact6, i6t);
            impacts += impactPulse(vWorldPos, impact7, i7t);
            impacts = clamp(impacts, 0.0, 1.5);

            // Base wireframe color (purple → cyan)
            vec3 baseCol = mix(vec3(0.659, 0.333, 0.969), vec3(0.133, 0.827, 0.933), 0.3 + 0.2 * sin(time * 0.3));
            float polar = polarGlow(vPos);
            baseCol += polar * vec3(0.25, 0.1, 0.4);
            // Impact color (white-blue flash)
            vec3 impactCol = mix(vec3(0.0, 0.322, 1.0), vec3(1.0, 1.0, 1.0), 0.6);
            vec3 col = mix(baseCol, impactCol, impacts * 0.7);
            col += vec3(0.10, 0.06, 0.015) * impacts;

            float alpha = (0.045 + polar * 0.025) * pulse * fade + impacts * 0.38;
            gl_FragColor = vec4(col, alpha);
          }
        `,wireframe:!0,transparent:!0,depthWrite:!1})]})}function tt({flowRef:d}){const f=u.useRef(),n=u.useRef(0),b=u.useMemo(()=>{const m=document.createElement("canvas");m.width=512,m.height=128;const a=m.getContext("2d");return a.clearRect(0,0,512,128),a.font="bold 72px monospace",a.textAlign="center",a.textBaseline="middle",a.fillStyle="#0052FF",a.shadowColor="#0052FF",a.shadowBlur=30,a.fillText("BASE",256,64),a.shadowBlur=0,a.fillText("BASE",256,64),new R(m)},[]);j((m,a)=>{var r;n.current+=a;const p=(d==null?void 0:d.current)||{pulse:.3};if(p.pulse=Math.max(.25,(p.pulse||0)-a*1.6),f.current){f.current.rotation.y=n.current*.08,f.current.rotation.x=Math.sin(n.current*.12)*.08;const i=Math.sin(n.current*1.5),e=p.pulse,o=1+.04*i+.18*e;f.current.scale.set(o,o,o);const M=(r=f.current.children[0])==null?void 0:r.material;M&&(M.opacity=.7+.18*i+.18*e)}});const g=u.useMemo(()=>({time:{value:0},flow:{value:1},pulse:{value:0}}),[]);return j((m,a)=>{var p,r;g.time.value+=a*.5,g.flow.value=((p=d==null?void 0:d.current)==null?void 0:p.intensity)||1,g.pulse.value=((r=d==null?void 0:d.current)==null?void 0:r.pulse)||.3}),t.jsxs("group",{ref:f,scale:1.3,children:[t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[1.4,20,16]}),t.jsx("shaderMaterial",{uniforms:g,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float pulse;
            void main(){
              float dist = length(vPos) / 1.4;
              float fog = pow(dist, 1.5) * (1.0 - dist) * 2.0;
              float beat = 0.5 + 0.5*pulse;
              vec3 col = vec3(0.08,0.25,0.7);
              float alpha = fog * 0.04 * beat;
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:C,side:H})]}),t.jsx("sprite",{scale:[2.2,.55,1],renderOrder:-1,children:t.jsx("spriteMaterial",{map:b,transparent:!0,blending:C,opacity:.85,depthWrite:!1,depthTest:!0})}),t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[.38,32,24]}),t.jsx("shaderMaterial",{uniforms:g,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float flow; uniform float pulse;
            void main(){
              float dist = length(vPos) / 0.38;
              float radial = pow(1.0 - dist, 3.0);
              float swirl = sin(vPos.x*8.0+time*0.8)*sin(vPos.y*6.0+time*0.5)*sin(vPos.z*5.0+time*0.6);
              float noise = 0.7 + 0.3*swirl;
              float beat = 0.6 + 0.4*pulse;
              vec3 deepBlue = vec3(0.0,0.15,0.9);
              vec3 coreCyan = vec3(0.08,0.6,1.0);
              vec3 col = mix(deepBlue, coreCyan, (1.0-dist)*0.6 + noise*0.15);
              col += vec3(0.25,0.08,0.45) * (1.0-dist) * 0.4;
              float alpha = radial * 0.88 * noise * (0.75 + 0.4*flow) * beat;
              alpha *= smoothstep(1.0, 0.5, dist);
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:C,side:F})]}),t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[.62,24,18]}),t.jsx("shaderMaterial",{uniforms:g,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float flow; uniform float pulse;
            void main(){
              float dist = length(vPos) / 0.62;
              float radial = pow(1.0 - dist, 2.4);
              float beat = 0.55 + 0.45*pulse;
              vec3 col = mix(vec3(0.06,0.42,0.92), vec3(0.5,0.22,0.88), dist*0.5);
              float alpha = radial * 0.28 * beat * (0.7+0.35*flow);
              alpha *= smoothstep(1.0, 0.4, dist);
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:C,side:F})]}),t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[.88,16,12]}),t.jsx("shaderMaterial",{uniforms:g,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float pulse;
            void main(){
              float dist = length(vPos) / 0.88;
              float radial = pow(1.0 - dist, 3.2);
              float beat = 0.5 + 0.5*pulse;
              vec3 col = mix(vec3(0.45,0.2,0.85), vec3(0.75,0.28,0.65), dist*0.4);
              float alpha = radial * 0.14 * beat;
              alpha *= smoothstep(1.0, 0.3, dist);
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:C,side:F})]}),t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[1.45,20,16]}),t.jsx("shaderMaterial",{uniforms:g,vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:`
            varying vec3 vPos; uniform float time; uniform float pulse;
            void main(){
              float dist = length(vPos) / 1.45;
              float radial = pow(1.0 - dist, 2.0) * pow(dist, 0.3);
              float beat = 0.4 + 0.6*pulse;
              float phase = sin(time*0.4 + 2.0)*0.5+0.5;
              vec3 col = mix(vec3(0.12,0.3,0.8), vec3(0.45,0.2,0.75), dist*0.5+phase*0.15);
              float alpha = radial * 0.07 * beat;
              gl_FragColor = vec4(col, alpha);
            }`,transparent:!0,depthWrite:!1,blending:C,side:F})]})]})}function et({liveData:d,onImpact:f,flowRef:n}){const g=u.useRef(0),m=u.useRef(),a=2.2,p=a*a,r=l=>{var x;const v=Math.random()*Math.PI*2,c=Math.acos(2*Math.random()-1),y=Math.max(.5,Math.min(1.8,((x=n==null?void 0:n.current)==null?void 0:x.intensity)||1)),h=(1.6+Math.random()*1)*(.9+.3*y);l[0]=Math.sin(c)*Math.cos(v)*h,l[1]=Math.sin(c)*Math.sin(v)*h,l[2]=Math.cos(c)*h},i=(l,v,c)=>{if(Math.random()<.42)l[c*3]=.08,l[c*3+1]=.85,l[c*3+2]=.55,v[c]=.055+Math.random()*.045;else{const y=Math.random();l[c*3]=.15*(1-y)+.78*y,l[c*3+1]=.45*(1-y)+.35*y,l[c*3+2]=1*(1-y)+.97*y,v[c]=.04+Math.random()*.04}},e=u.useMemo(()=>{const l=new Float32Array(156),v=new Float32Array(156),c=new Float32Array(156),y=new Float32Array(52),h=new Float32Array(52),x=new Float32Array(52),B=new Uint8Array(52);for(let P=0;P<52;P++){const A=Math.random()*.08,T=Math.random()*Math.PI*2,S=Math.acos(2*Math.random()-1);l[P*3]=A*Math.sin(S)*Math.cos(T),l[P*3+1]=A*Math.sin(S)*Math.sin(T),l[P*3+2]=A*Math.cos(S);const _=Math.random()*Math.PI*2,z=Math.acos(2*Math.random()-1),W=1.6+Math.random()*1;v[P*3]=Math.sin(z)*Math.cos(_)*W,v[P*3+1]=Math.sin(z)*Math.sin(_)*W,v[P*3+2]=Math.cos(z)*W,i(c,y,P),h[P]=Math.random()*1.5,x[P]=1.8+Math.random()*.8}return{positions:l,velocities:v,colors:c,sizes:y,lifetimes:h,maxLifetimes:x,hit:B}},[]),o=u.useMemo(()=>({time:{value:0},flow:{value:1}}),[]),M=u.useRef(0);return j((l,v)=>{var G,L;g.current+=v,o.time.value=g.current;const c=Math.max(.5,Math.min(1.8,((G=n==null?void 0:n.current)==null?void 0:G.intensity)||1));o.flow.value=c;const y=((L=n==null?void 0:n.current)==null?void 0:L.pulse)>.95&&g.current-M.current>1.2;y&&(M.current=g.current);const{positions:h,velocities:x,colors:B,sizes:P,lifetimes:A,maxLifetimes:T,hit:S}=e,_=[0,0,0];let z=!1,W=y?8:0;for(let s=0;s<52;s++){A[s]+=v;const V=W>0&&A[s]>.15;if(A[s]>=T[s]||V){V&&W--;const O=Math.random()*.08,E=Math.random()*Math.PI*2,U=Math.acos(2*Math.random()-1);h[s*3]=O*Math.sin(U)*Math.cos(E),h[s*3+1]=O*Math.sin(U)*Math.sin(E),h[s*3+2]=O*Math.cos(U),r(_),x[s*3]=_[0],x[s*3+1]=_[1],x[s*3+2]=_[2],i(B,P,s),z=!0,A[s]=0,T[s]=1.8+Math.random()*.8,S[s]=0;continue}const k=Math.sqrt(h[s*3]*h[s*3]+h[s*3+1]*h[s*3+1]+h[s*3+2]*h[s*3+2]),I=k>1.6?(k-1.6)/.6:0;I>0&&(x[s*3]*=1-I*.08,x[s*3+1]*=1-I*.08,x[s*3+2]*=1-I*.08,P[s]=P[s]*(1+I*.8)),h[s*3]+=x[s*3]*v,h[s*3+1]+=x[s*3+1]*v,h[s*3+2]+=x[s*3+2]*v;const D=h[s*3]*h[s*3]+h[s*3+1]*h[s*3+1]+h[s*3+2]*h[s*3+2];if(D>=p)if(S[s])P[s]*=1.06;else{S[s]=1;const O=Math.sqrt(D),E=a/O;h[s*3]*=E,h[s*3+1]*=E,h[s*3+2]*=E,x[s*3]=0,x[s*3+1]=0,x[s*3+2]=0,f&&f({position:new w(h[s*3],h[s*3+1],h[s*3+2]),intensity:1}),A[s]=T[s]-.35}}m.current&&(m.current.geometry.attributes.position.needsUpdate=!0,z&&(m.current.geometry.attributes.aColor.needsUpdate=!0,m.current.geometry.attributes.aSize.needsUpdate=!0))}),t.jsxs("points",{ref:m,children:[t.jsxs("bufferGeometry",{children:[t.jsx("bufferAttribute",{attach:"attributes-position",args:[e.positions,3]}),t.jsx("bufferAttribute",{attach:"attributes-aColor",args:[e.colors,3]}),t.jsx("bufferAttribute",{attach:"attributes-aSize",args:[e.sizes,1]})]}),t.jsx("shaderMaterial",{uniforms:o,vertexShader:`
          attribute float aSize; attribute vec3 aColor;
          varying vec3 vColor; varying float vAlpha; uniform float time; uniform float flow;
          void main() {
            vColor = aColor;
            float dist = length(position);
            float travel = clamp(dist / 2.2, 0.0, 1.0);
            float edgeDissolve = 1.0 - smoothstep(0.65, 1.0, travel);
            vAlpha = (0.7 + 0.3 * sin(time * 2.0 + dist * 4.0)) * (0.9 + 0.25 * flow) * (0.3 + 0.7 * edgeDissolve);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float sz = aSize * (1.0 + travel * 1.2);
            gl_PointSize = sz * (0.9 + 0.6 * flow) * (480.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,fragmentShader:`
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float glow = pow(1.0 - d * 2.0, 1.4);
            float core = 1.0 - smoothstep(0.0, 0.3, d);
            vec3 col = vColor + core * 0.6;
            gl_FragColor = vec4(col, glow * vAlpha);
          }
        `,transparent:!0,depthWrite:!1,blending:C})]})}function ot(){const{positions:f,colors:n,sizes:b}=u.useMemo(()=>{const m=new Float32Array(180),a=new Float32Array(180),p=new Float32Array(60);for(let r=0;r<60;r++){const i=Math.acos(-1+2*r/60),e=Math.sqrt(60*Math.PI)*i,o=2.35;m[r*3]=o*Math.cos(e)*Math.sin(i),m[r*3+1]=o*Math.sin(e)*Math.sin(i),m[r*3+2]=o*Math.cos(i);const M=r>=36;if(M)a[r*3]=.133,a[r*3+1]=.827,a[r*3+2]=.933;else{const l=new N().setHSL(.75+Math.random()*.1,.7,.6);a[r*3]=l.r,a[r*3+1]=l.g,a[r*3+2]=l.b}p[r]=M?.09:.055}return{positions:m,colors:a,sizes:p}},[]),g=u.useMemo(()=>({time:{value:0}}),[]);return j((m,a)=>{g.time.value+=a*1.5}),t.jsxs("points",{children:[t.jsxs("bufferGeometry",{children:[t.jsx("bufferAttribute",{attach:"attributes-position",args:[f,3]}),t.jsx("bufferAttribute",{attach:"attributes-aColor",args:[n,3]}),t.jsx("bufferAttribute",{attach:"attributes-aSize",args:[b,1]})]}),t.jsx("shaderMaterial",{uniforms:g,vertexShader:`
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
        `,transparent:!0,depthWrite:!1,blending:C})]})}function at(){const d=u.useRef(),f=u.useMemo(()=>({time:{value:0}}),[]),n=u.useRef(0);j((a,p)=>{n.current+=p,f.time.value=n.current,d.current&&(d.current.rotation.y=n.current*.06)});const{positions:b,colors:g,sizes:m}=u.useMemo(()=>{const p=new Float32Array(150),r=new Float32Array(150),i=new Float32Array(50);for(let e=0;e<50;e++){const o=e/50*Math.PI*2,M=e%3,l=2.55+M*.22,v=.15*M;p[e*3]=l*Math.cos(o),p[e*3+1]=l*Math.sin(o)*Math.sin(v),p[e*3+2]=l*Math.sin(o)*Math.cos(v);const c=e/50;r[e*3]=.659*(1-c)+.133*c,r[e*3+1]=.333*(1-c)+.827*c,r[e*3+2]=.969*(1-c)+.933*c,i[e]=.015+Math.random()*.025}return{positions:p,colors:r,sizes:i}},[]);return t.jsx("group",{ref:d,children:t.jsxs("points",{children:[t.jsxs("bufferGeometry",{children:[t.jsx("bufferAttribute",{attach:"attributes-position",args:[b,3]}),t.jsx("bufferAttribute",{attach:"attributes-aColor",args:[g,3]}),t.jsx("bufferAttribute",{attach:"attributes-aSize",args:[m,1]})]}),t.jsx("shaderMaterial",{uniforms:f,vertexShader:`
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
          `,transparent:!0,depthWrite:!1,blending:C})]})})}function it({onImpactsReady:d}){const f=u.useRef([]),n=u.useRef(Array.from({length:8},()=>({position:new w,intensity:0,active:!1,age:0})));return j((b,g)=>{for(;f.current.length>0&&n.current.some(a=>!a.active);){const a=f.current.shift(),p=n.current.find(r=>!r.active);p&&(p.position.copy(a.position),p.intensity=a.intensity,p.active=!0,p.age=0)}const m=1.5;n.current.forEach(a=>{a.active&&(a.age+=g,a.intensity=Math.max(0,1-a.age*m),a.intensity<=0&&(a.active=!1))}),d(n.current.filter(a=>a.active).map(a=>({position:a.position,intensity:a.intensity})))}),u.useEffect(()=>(window.__aetherius_addImpact=b=>{f.current.push(b)},()=>{delete window.__aetherius_addImpact}),[]),null}function st(){const[d,f]=u.useState([]),n=u.useRef(""),b=u.useCallback(g=>{let m=g.length+":";for(let a=0;a<g.length;a++){const p=g[a];m+=p.position.x.toFixed(1)+","+p.position.y.toFixed(1)+","+p.position.z.toFixed(1)+","+p.intensity.toFixed(2)+";"}m!==n.current&&(n.current=m,f(g))},[]);return t.jsxs(t.Fragment,{children:[t.jsx(X,{impactPoints:d}),t.jsx(it,{onImpactsReady:b})]})}function rt(){const d=u.useRef(),f=u.useRef(0),{positions:n,colors:b,sizes:g}=u.useMemo(()=>{const p=new Float32Array(24),r=new Float32Array(24),i=new Float32Array(8);for(let e=0;e<8;e++){const o=e/8*Math.PI*2+Math.random()*.5,M=4+Math.random()*2;p[e*3]=M*Math.cos(o),p[e*3+1]=(Math.random()-.5)*3,p[e*3+2]=M*Math.sin(o);const l=Math.random();l<.4?(r[e*3]=.13,r[e*3+1]=.82,r[e*3+2]=.93):l<.7?(r[e*3]=.84,r[e*3+1]=.27,r[e*3+2]=.93):(r[e*3]=.83,r[e*3+1]=.66,r[e*3+2]=.32),i[e]=.08+Math.random()*.06}return{positions:p,colors:r,sizes:i}},[]),m=u.useMemo(()=>({time:{value:0}}),[]);return j((a,p)=>{var i,e,o;f.current+=p,m.time.value=f.current,d.current&&(d.current.rotation.y=f.current*.02);const r=(o=(e=(i=d.current)==null?void 0:i.geometry)==null?void 0:e.attributes)==null?void 0:o.aSize;if(r){for(let M=0;M<8;M++)r.array[M]=.06+.05*Math.sin(f.current*2+M*1.5);r.needsUpdate=!0}}),t.jsxs("points",{ref:d,children:[t.jsxs("bufferGeometry",{children:[t.jsx("bufferAttribute",{attach:"attributes-position",args:[n,3]}),t.jsx("bufferAttribute",{attach:"attributes-aColor",args:[b,3]}),t.jsx("bufferAttribute",{attach:"attributes-aSize",args:[g,1]})]}),t.jsx("shaderMaterial",{uniforms:m,vertexShader:"attribute float aSize; attribute vec3 aColor; varying vec3 vColor; varying float vAlpha; uniform float time; void main(){vColor=aColor; vAlpha=0.6+0.4*sin(time*1.2+position.x*2.0); vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*(500.0/-mv.z); gl_Position=projectionMatrix*mv;}",fragmentShader:"varying vec3 vColor; varying float vAlpha; void main(){ float d=length(gl_PointCoord-vec2(0.5)); if(d>0.5)discard; float g=pow(1.0-d*2.0,1.5); gl_FragColor=vec4(vColor,g*vAlpha);}",transparent:!0,depthWrite:!1,blending:C})]})}function ct({liveData:d,paused:f}){const n=u.useMemo(()=>typeof window>"u"?!1:window.matchMedia("(pointer: coarse)").matches||window.innerWidth<768,[]),b=u.useCallback(i=>{window.__aetherius_addImpact&&window.__aetherius_addImpact(i)},[]),g=u.useRef({intensity:1,pulse:.4,block:null});u.useEffect(()=>{const i=()=>{const o=d||{},M=parseFloat(String(o.volume||"").replace(/[^0-9.]/g,""))||0,l=parseFloat(String(o.gas||"").replace(/[^0-9.]/g,""))||0;let v=.9+Math.min(M/500,.5)+Math.min(l/50,.25)+Math.random()*.15;v=Math.max(.6,Math.min(1.8,v));const c=g.current;c.intensity=v,o.block&&o.block!=="—"&&o.block!==c.block?(c.block=o.block,c.pulse=1):c.pulse=Math.max(.3,(c.pulse||.3)*.94)};i();const e=setInterval(i,400);return()=>clearInterval(e)},[d]);const m=u.useMemo(()=>({position:[0,.3,10.5],fov:40}),[]),a=u.useMemo(()=>({alpha:!0,antialias:!n,powerPreference:"high-performance"}),[n]),p=u.useMemo(()=>({position:"absolute",inset:0,width:"100%",height:"100%",background:"transparent"}),[]),r=u.useMemo(()=>[1,1.5],[]);return t.jsxs(J,{camera:m,gl:a,onCreated:({gl:i})=>i.setClearColor(0,0),style:p,dpr:r,frameloop:f?"demand":"always",children:[t.jsx("ambientLight",{intensity:.05}),t.jsxs("group",{scale:1.3,children:[t.jsx(st,{}),t.jsx(tt,{flowRef:g}),t.jsx(et,{liveData:d,onImpact:b,flowRef:g}),t.jsx(Y,{}),t.jsx(Z,{}),t.jsx(ot,{}),t.jsx(Q,{liveData:d}),t.jsx(at,{})]}),!n&&t.jsxs(t.Fragment,{children:[t.jsx($,{radius:12,depth:30,count:600,factor:3,saturation:.3,fade:!0,speed:.12}),t.jsx($,{radius:8,depth:15,count:300,factor:1.5,saturation:.5,fade:!0,speed:.08}),t.jsx(rt,{})]}),t.jsx(K,{autoRotate:!0,autoRotateSpeed:1,enableZoom:!1,enablePan:!1,enableDamping:!0,dampingFactor:.08,rotateSpeed:.5,minPolarAngle:Math.PI*.25,maxPolarAngle:Math.PI*.75})]})}export{ct as default};
