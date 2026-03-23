// I? I.
// - Orion

const {t}=params, A=sinn(t), D=denorm(A,400,20), P=denorm(.6+.5*A,0,3)
for(let k=3;k--;){begin()
 for(let i=floor(D)+1;i--;){
  let s=(floor(D)-i)/300, u=sinn(s+.1),
      w=(.1+.5*abs(u)**3)*(1-.4*sinn(t+abs(u))),
      ph=(.12+s)*P+k/3,
      x=w*cosn(ph),
      y=u*.95+.1*sinn(ph*2);
  line(x,y)
 }}
