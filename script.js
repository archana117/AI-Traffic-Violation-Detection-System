// ===== COUNTERS =====
function animC(id,t,s='',d=2000){const e=document.getElementById(id);if(!e)return;const st=performance.now();function step(n){const p=Math.min((n-st)/d,1),v=(1-Math.pow(1-p,3))*t;e.textContent=(t%1?v.toFixed(4):Math.round(v).toLocaleString())+s;if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
setTimeout(()=>{animC('stat-params',252219);animC('stat-fps',62,' fps');animC('stat-layers',13);animC('stat-accuracy',0.0087);},500);

// ===== NEURAL NET =====
(function(){const c=document.getElementById('neural-canvas');if(!c)return;const x=c.getContext('2d'),W=c.width,H=c.height,L=[3,8,12,16,12,8,4,1];let t=0;const N=[];L.forEach((n,li)=>{const px=60+li*(W-120)/(L.length-1),a=[];for(let i=0;i<n;i++)a.push({x:px,y:H/2-(n-1)*14/2+i*14});N.push(a);});function d(){x.clearRect(0,0,W,H);t+=.012;for(let l=0;l<N.length-1;l++)for(let i=0;i<N[l].length;i++)for(let j=0;j<N[l+1].length;j++){const a=N[l][i],b=N[l+1][j],s=Math.sin(t*2+l*.5+i*.3+j*.2)*.5+.5;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.strokeStyle=`hsla(35,60%,50%,${.02+s*.06})`;x.lineWidth=.5;x.stroke();}N.forEach((la,li)=>la.forEach((n,ni)=>{const p=Math.sin(t*3+li+ni*.5)*.4+.6;const g=x.createRadialGradient(n.x,n.y,0,n.x,n.y,10);g.addColorStop(0,`hsla(38,70%,55%,${p*.7})`);g.addColorStop(1,'hsla(38,70%,55%,0)');x.fillStyle=g;x.beginPath();x.arc(n.x,n.y,10,0,Math.PI*2);x.fill();x.fillStyle=`hsla(38,60%,58%,${.4+p*.5})`;x.beginPath();x.arc(n.x,n.y,3*p,0,Math.PI*2);x.fill();}));requestAnimationFrame(d);}d();})();

// ===== CURVED ROAD SIMULATOR WITH CAR =====
(function(){
  const roadC=document.getElementById('road-canvas'),steerC=document.getElementById('steering-canvas'),preC=document.getElementById('preprocess-canvas'),slider=document.getElementById('curvature-slider');
  if(!roadC||!steerC||!preC||!slider)return;
  const rc=roadC.getContext('2d'),sc=steerC.getContext('2d'),pc=preC.getContext('2d');
  const RW=roadC.width,RH=roadC.height;
  let curv=0,aiAng=0,spd=18,fr=0;

  slider.addEventListener('input',e=>{curv=e.target.value/100;});
  document.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'){slider.value=Math.max(-100,+slider.value-5);curv=slider.value/100;}
    if(e.key==='ArrowRight'){slider.value=Math.min(100,+slider.value+5);curv=slider.value/100;}
  });

  // Generate road points along a curve
  function getRoadPoints(curvature,numPts){
    const pts=[];
    let x=RW/2,y=RH+20,angle=-Math.PI/2; // start at bottom center going up
    const stepLen=4;
    for(let i=0;i<numPts;i++){
      const t=i/numPts; // 0=near, 1=far
      // perspective scaling: things get smaller as they go far
      const scale=1-t*0.95;
      const roadW=280*scale;
      // curve the angle
      angle+= curvature*0.018*scale;
      x+=Math.cos(angle+Math.PI/2)*stepLen*scale*0.5;
      y+=Math.sin(angle)*stepLen-stepLen*0.6;
      pts.push({x,y,w:roadW,scale,angle});
    }
    return pts;
  }

  // BMW-style rear-view car
  function drawCar(ctx,cx,cy,sc,steer){
    const w=52*sc,h=80*sc;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(steer*0.12);
    // Shadow under car
    ctx.fillStyle='rgba(0,0,0,0.4)';ctx.beginPath();ctx.ellipse(2,h*0.15,w*0.55,h*0.12,0,0,Math.PI*2);ctx.fill();
    // REAR VIEW - we see the back of the BMW
    // Lower bumper
    const bmp=ctx.createLinearGradient(-w/2,h*0.3,w/2,h*0.3);
    bmp.addColorStop(0,'#1a1a1a');bmp.addColorStop(0.5,'#2a2a2a');bmp.addColorStop(1,'#1a1a1a');
    ctx.fillStyle=bmp;
    ctx.beginPath();ctx.moveTo(-w*0.46,h*0.05);ctx.lineTo(w*0.46,h*0.05);
    ctx.quadraticCurveTo(w*0.5,h*0.15,w*0.46,h*0.22);ctx.lineTo(-w*0.46,h*0.22);
    ctx.quadraticCurveTo(-w*0.5,h*0.15,-w*0.46,h*0.05);ctx.fill();
    // Main body
    const bd=ctx.createLinearGradient(-w/2,-h*0.5,w/2,-h*0.1);
    bd.addColorStop(0,'#0a0a12');bd.addColorStop(0.3,'#1a1a2e');bd.addColorStop(0.5,'#252540');bd.addColorStop(0.7,'#1a1a2e');bd.addColorStop(1,'#0a0a12');
    ctx.fillStyle=bd;
    ctx.beginPath();
    ctx.moveTo(-w*0.44,-h*0.42);ctx.quadraticCurveTo(-w*0.02,-h*0.46,w*0.44,-h*0.42);
    ctx.lineTo(w*0.48,-h*0.05);ctx.lineTo(w*0.46,h*0.05);
    ctx.lineTo(-w*0.46,h*0.05);ctx.lineTo(-w*0.48,-h*0.05);ctx.closePath();ctx.fill();
    // Roof
    const rf=ctx.createLinearGradient(0,-h*0.5,0,-h*0.35);
    rf.addColorStop(0,'#15152a');rf.addColorStop(1,'#1e1e38');
    ctx.fillStyle=rf;
    ctx.beginPath();
    ctx.moveTo(-w*0.32,-h*0.5);ctx.quadraticCurveTo(0,-h*0.54,w*0.32,-h*0.5);
    ctx.lineTo(w*0.38,-h*0.42);ctx.quadraticCurveTo(0,-h*0.44,-w*0.38,-h*0.42);ctx.closePath();ctx.fill();
    // Rear window
    ctx.fillStyle='rgba(60,80,110,0.7)';
    ctx.beginPath();
    ctx.moveTo(-w*0.28,-h*0.48);ctx.quadraticCurveTo(0,-h*0.51,w*0.28,-h*0.48);
    ctx.lineTo(w*0.34,-h*0.4);ctx.quadraticCurveTo(0,-h*0.42,-w*0.34,-h*0.4);ctx.closePath();ctx.fill();
    // Window reflection
    ctx.fillStyle='rgba(120,160,200,0.12)';
    ctx.beginPath();ctx.moveTo(-w*0.1,-h*0.49);ctx.lineTo(w*0.05,-h*0.49);ctx.lineTo(w*0.1,-h*0.42);ctx.lineTo(-w*0.05,-h*0.42);ctx.closePath();ctx.fill();
    // Trunk line
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=sc;ctx.beginPath();
    ctx.moveTo(-w*0.35,-h*0.38);ctx.quadraticCurveTo(0,-h*0.39,w*0.35,-h*0.38);ctx.stroke();
    // Tail lights (BMW L-shape)
    for(let side=-1;side<=1;side+=2){
      const lx=side*w*0.42,ly=-h*0.18;
      // Outer housing
      ctx.fillStyle='#2a0000';
      ctx.beginPath();ctx.roundRect(lx-6*sc,ly-4*sc,12*sc,10*sc,2*sc);ctx.fill();
      // Light bar (red)
      const lg=ctx.createLinearGradient(lx-5*sc,ly,lx+5*sc,ly);
      lg.addColorStop(0,'#ff1a1a');lg.addColorStop(0.5,'#cc0000');lg.addColorStop(1,'#ff1a1a');
      ctx.fillStyle=lg;
      ctx.beginPath();ctx.roundRect(lx-5*sc,ly-3*sc,10*sc,5*sc,1.5*sc);ctx.fill();
      // Glow
      ctx.save();ctx.globalAlpha=0.25;const tg=ctx.createRadialGradient(lx,ly,0,lx,ly,15*sc);
      tg.addColorStop(0,'#ff3333');tg.addColorStop(1,'transparent');ctx.fillStyle=tg;
      ctx.beginPath();ctx.arc(lx,ly,15*sc,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    // BMW badge (center trunk)
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.beginPath();ctx.arc(0,-h*0.3,3*sc,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,100,200,0.4)';ctx.beginPath();ctx.arc(0,-h*0.3,2*sc,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.arc(0,-h*0.3,2*sc,0,Math.PI);ctx.fill();
    // License plate
    ctx.fillStyle='#e8e0d0';ctx.beginPath();ctx.roundRect(-w*0.18,h*0.0,w*0.36,h*0.07,1.5*sc);ctx.fill();
    ctx.fillStyle='#222';ctx.font=`bold ${Math.max(6,8*sc)}px "JetBrains Mono"`;ctx.textAlign='center';
    ctx.fillText('AI 0042',0,h*0.06);
    // Dual exhaust tips
    for(let side=-1;side<=1;side+=2){
      ctx.fillStyle='#555';ctx.beginPath();ctx.ellipse(side*w*0.25,h*0.2,3.5*sc,2*sc,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#333';ctx.beginPath();ctx.ellipse(side*w*0.25,h*0.2,2.5*sc,1.3*sc,0,0,Math.PI*2);ctx.fill();
    }
    // Body highlight
    ctx.fillStyle='rgba(255,255,255,0.04)';ctx.beginPath();ctx.ellipse(0,-h*0.2,w*0.3,h*0.12,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  function drawRoad(){
    fr++;const ctx=rc;ctx.clearRect(0,0,RW,RH);
    // Apply road banking - tilt the entire scene based on curvature
    ctx.save();
    const bankAngle=curv*0.04; // subtle tilt
    ctx.translate(RW/2,RH/2);
    ctx.rotate(bankAngle);
    ctx.translate(-RW/2,-RH/2);
    const hz=RH*0.38;
    // Sky
    const sk=ctx.createLinearGradient(0,0,0,hz);
    sk.addColorStop(0,'#0d1117');sk.addColorStop(0.5,'#1a1e2e');sk.addColorStop(1,'#3d2a2a');
    ctx.fillStyle=sk;ctx.fillRect(0,0,RW,hz+5);
    // Stars
    for(let i=0;i<40;i++){const sx=(i*127+fr*.005)%RW,sy=(i*67)%(hz*.7),b=Math.sin(fr*.015+i*1.7)*.3+.5;ctx.fillStyle=`rgba(255,240,200,${b*.4})`;ctx.fillRect(sx,sy,1,1);}
    // Mountains
    ctx.beginPath();ctx.moveTo(0,hz);
    for(let x=0;x<=RW;x+=6){ctx.lineTo(x,Math.sin(x*.006)*30+Math.sin(x*.014)*15+hz-35);}
    ctx.lineTo(RW,hz);ctx.closePath();ctx.fillStyle='#1a1520';ctx.fill();
    // Ground
    const gn=ctx.createLinearGradient(0,hz,0,RH);
    gn.addColorStop(0,'#2a2518');gn.addColorStop(1,'#161a12');
    ctx.fillStyle=gn;ctx.fillRect(0,hz,RW,RH-hz);

    // Road segments using curve
    const pts=getRoadPoints(curv,90);

    // Draw road surface as filled quads from far to near
    for(let i=pts.length-2;i>=0;i--){
      const p=pts[i],p2=pts[i+1];
      if(p.y<hz-10||p2.y<hz-10)continue;
      // Road asphalt
      const darkness=0.25+p.scale*0.2;
      ctx.fillStyle=`rgb(${Math.floor(55+darkness*30)},${Math.floor(55+darkness*25)},${Math.floor(55+darkness*20)})`;
      ctx.beginPath();
      ctx.moveTo(p.x-p.w/2,p.y);ctx.lineTo(p.x+p.w/2,p.y);
      ctx.lineTo(p2.x+p2.w/2,p2.y);ctx.lineTo(p2.x-p2.w/2,p2.y);
      ctx.closePath();ctx.fill();
    }
    // Edge lines (white) and center dashes (yellow)
    ctx.lineCap='round';
    for(let i=0;i<pts.length-1;i++){
      const p=pts[i],p2=pts[i+1];
      if(p.y<hz-10)continue;
      const lw=Math.max(0.5,p.scale*3);
      // Left edge
      ctx.strokeStyle=`rgba(255,255,255,${0.3+p.scale*0.6})`;ctx.lineWidth=lw;
      ctx.beginPath();ctx.moveTo(p.x-p.w/2,p.y);ctx.lineTo(p2.x-p2.w/2,p2.y);ctx.stroke();
      // Right edge
      ctx.beginPath();ctx.moveTo(p.x+p.w/2,p.y);ctx.lineTo(p2.x+p2.w/2,p2.y);ctx.stroke();
      // Center dashes (yellow)
      const dashIdx=Math.floor((i+fr*0.5)*.15);
      if(dashIdx%2===0){
        ctx.strokeStyle=`rgba(230,190,60,${0.3+p.scale*0.6})`;ctx.lineWidth=lw*0.8;
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
      }
    }

    // Trees along the road
    for(let i=5;i<pts.length;i+=8){
      const p=pts[i];if(p.y<hz||p.scale<0.05)continue;
      const th=25*p.scale;
      for(let side=-1;side<=1;side+=2){
        const tx=p.x+side*(p.w/2+15*p.scale+10*p.scale);
        ctx.fillStyle='#2a1a0a';ctx.fillRect(tx-p.scale,p.y-th,2*p.scale,th*0.6);
        ctx.fillStyle=`hsl(${120+i*3},25%,${14+p.scale*8}%)`;
        ctx.beginPath();ctx.arc(tx,p.y-th,th*0.45,0,Math.PI*2);ctx.fill();
      }
    }

    // DRAW THE CAR on the road near the bottom
    const carIdx=8; // car position along the road
    const carPt=pts[carIdx];
    if(carPt){
      drawCar(ctx,carPt.x,carPt.y-8,carPt.scale*1.1,aiAng);
      // Headlight beams
      ctx.save();ctx.globalAlpha=0.04;
      const beamPt=pts[Math.min(carIdx+25,pts.length-1)];
      if(beamPt){
        ctx.fillStyle='#ffe880';
        ctx.beginPath();
        ctx.moveTo(carPt.x-12,carPt.y-35);ctx.moveTo(carPt.x+12,carPt.y-35);
        ctx.lineTo(beamPt.x+beamPt.w*0.2,beamPt.y);ctx.lineTo(beamPt.x-beamPt.w*0.2,beamPt.y);
        ctx.lineTo(carPt.x-12,carPt.y-35);
        ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }

    // Restore banking transform before HUD so text stays level
    ctx.restore();
    // HUD (drawn without banking)
    ctx.font='bold 11px "JetBrains Mono"';ctx.fillStyle='rgba(200,170,100,0.5)';
    ctx.fillText('DRIVERNET AI',12,18);
    ctx.fillText(`STEER: ${aiAng.toFixed(3)}`,12,32);
    ctx.fillText(`SPD: ${Math.round(spd)} mph`,12,46);
    ctx.fillText(`CURVE: ${curv.toFixed(2)}`,12,60);
    // Compass
    const cx2=RW-40,cy2=50,cr=15;
    ctx.strokeStyle='rgba(200,170,100,0.3)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx2,cy2,cr,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(220,180,80,0.7)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cx2,cy2);ctx.lineTo(cx2+Math.sin(curv*.8)*cr*.8,cy2-Math.cos(curv*.8)*cr*.8);ctx.stroke();
  }

  function drawSteering(){
    const ctx=sc,W=steerC.width,H=steerC.height;ctx.clearRect(0,0,W,H);
    const cx=W/2,cy=H/2+10,r=55;
    ctx.strokeStyle='hsl(220,10%,18%)';ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    for(let i=-6;i<=6;i++){const a=-Math.PI/2+i*Math.PI/12,inn=r-6,out=r+2;ctx.strokeStyle=i===0?'rgba(200,170,100,0.6)':'rgba(150,130,90,0.25)';ctx.lineWidth=i===0?1.5:0.8;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*inn,cy+Math.sin(a)*inn);ctx.lineTo(cx+Math.cos(a)*out,cy+Math.sin(a)*out);ctx.stroke();}
    const ar=aiAng*Math.PI/2,sa=-Math.PI/2;
    ctx.strokeStyle='hsl(38,80%,50%)';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(cx,cy,r,sa,sa+ar,ar<0);ctx.stroke();
    ctx.save();ctx.globalAlpha=.15;ctx.filter='blur(4px)';ctx.strokeStyle='hsl(38,80%,55%)';ctx.lineWidth=10;ctx.beginPath();ctx.arc(cx,cy,r,sa,sa+ar,ar<0);ctx.stroke();ctx.restore();
    const nx=cx+Math.sin(ar)*r*.82,ny=cy-Math.cos(ar)*r*.82;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(nx,ny);ctx.strokeStyle='#c04030';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.stroke();
    ctx.fillStyle='#c04030';ctx.beginPath();ctx.arc(nx,ny,3.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='hsl(220,10%,22%)';ctx.beginPath();ctx.arc(cx,cy,5,0,Math.PI*2);ctx.fill();
    ctx.font='600 9px "JetBrains Mono"';ctx.fillStyle='hsl(35,10%,40%)';ctx.textAlign='center';
    ctx.fillText('L',cx-r-14,cy+3);ctx.fillText('R',cx+r+14,cy+3);ctx.fillText('0°',cx,cy-r-8);
  }

  function drawPre(){
    const ctx=pc,W=preC.width,H=preC.height;ctx.clearRect(0,0,W,H);
    for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){const nx=x/W,ny=y/H;const rd=nx>0.15+curv*.1&&nx<0.85+curv*.1&&ny>0.25;const l=rd?50+Math.random()*20+Math.sin((nx-.5+curv*.2)*8)*8:20+Math.random()*8;const il=rd&&Math.abs(nx-.5-curv*.15)<.01;ctx.fillStyle=il?`rgb(${l+40},${l+30},${l})`:`rgb(${Math.floor(l*.9)},${Math.floor(l)},${Math.floor(l*1.1)})`;ctx.fillRect(x,y,2,2);}
    ctx.font='500 8px "JetBrains Mono"';ctx.fillStyle='rgba(200,170,100,0.4)';ctx.fillText('66 × 200 · YUV',6,H-5);
  }

  function update(){
    const tgt=curv*0.8+Math.sin(fr*.025)*.015;aiAng+=(tgt-aiAng)*.06;
    spd=18-Math.abs(aiAng)*10+Math.sin(fr*.04)*.3;
    const thr=Math.max(0,1-aiAng*aiAng-(spd/25)**2);
    document.getElementById('curvature-value').textContent=curv.toFixed(2);
    document.getElementById('steering-angle').textContent=aiAng.toFixed(3)+'°';
    document.getElementById('throttle-value').textContent=thr.toFixed(2);
    document.getElementById('speed-value').textContent=Math.round(spd)+' mph';
    drawRoad();drawSteering();if(fr%4===0)drawPre();requestAnimationFrame(update);
  }
  update();
})();

// ===== TRAINING =====
(function(){const c=document.getElementById('loss-chart');if(!c)return;const x=c.getContext('2d'),W=c.width,H=c.height,btn=document.getElementById('btn-start-training');let tL=[],vL=[],run=false,ep=0,mx=40;
function dc(){x.clearRect(0,0,W,H);const p={l:50,r:20,t:20,b:30},cw=W-p.l-p.r,ch=H-p.t-p.b;x.strokeStyle='hsla(220,10%,20%,0.5)';x.lineWidth=.5;for(let i=0;i<=5;i++){const y=p.t+ch*i/5;x.beginPath();x.moveTo(p.l,y);x.lineTo(p.l+cw,y);x.stroke();x.fillStyle='hsl(35,10%,35%)';x.font='10px "JetBrains Mono"';x.textAlign='right';x.fillText((0.5-i*0.1).toFixed(1),p.l-8,y+4);}if(tL.length<2)return;function dl(d,col){x.beginPath();x.strokeStyle=col;x.lineWidth=2;x.lineJoin='round';d.forEach((v,i)=>{const px=p.l+i/(mx-1)*cw,py=p.t+(1-v/0.5)*ch;i===0?x.moveTo(px,py):x.lineTo(px,py);});x.stroke();x.save();x.globalAlpha=.06;x.lineTo(p.l+(d.length-1)/(mx-1)*cw,p.t+ch);x.lineTo(p.l,p.t+ch);x.closePath();x.fillStyle=col;x.fill();x.restore();}dl(tL,'hsl(35,85%,55%)');dl(vL,'hsl(25,90%,48%)');}
function ts(){if(ep>=mx){run=false;btn.disabled=false;btn.innerHTML='⟳ Restart';document.getElementById('training-status').textContent='Done! Best: '+Math.min(...vL).toFixed(4);return;}const t=.45*Math.exp(-ep*.08)+Math.random()*.012,v=.48*Math.exp(-ep*.065)+Math.random()*.018;tL.push(t);vL.push(v);ep++;document.getElementById('epoch-display').textContent=ep+' / '+mx;document.getElementById('train-loss-val').textContent=t.toFixed(4);document.getElementById('val-loss-val').textContent=v.toFixed(4);document.getElementById('training-progress').style.width=(ep/mx*100)+'%';document.getElementById('training-status').textContent='Epoch '+ep+'...';dc();setTimeout(ts,130);}
btn.addEventListener('click',()=>{if(run)return;run=true;btn.disabled=true;ep=0;tL=[];vL=[];ts();});dc();})();

// ===== NAV =====
document.querySelectorAll('.nav-link').forEach(l=>{l.addEventListener('click',()=>{document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));l.classList.add('active');});});
const secs=document.querySelectorAll('section'),nls=document.querySelectorAll('.nav-link');
window.addEventListener('scroll',()=>{let c='';secs.forEach(s=>{if(scrollY>=s.offsetTop-200)c=s.id;});nls.forEach(l=>{l.classList.remove('active');if(l.getAttribute('href')==='#'+c)l.classList.add('active');});});
