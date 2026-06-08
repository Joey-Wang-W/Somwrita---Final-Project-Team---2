let myPlanet;
// 引入增量角度变量，防止动态改变自转速度时画面产生瞬间旋转跳变的 Bug
let hantao_rotationAngle = 0; 

function setup() {
  // 创建 WEBGL 3D 渲染画布
  createCanvas(windowWidth, windowHeight, WEBGL);
  // 开启抗锯齿，确保 1 像素的全息线条足够细腻、没有毛刺
  setAttributes('antialias', true); 
  
  // 实例化球体对象
  myPlanet = new OscilloscopeSphere();
}

function draw() {
  // 设置深邃的赛博暗色背景
  background(5, 5, 8);
  // 开启鼠标轨道控制，允许在预览窗口拖拽、缩放视角
  orbitControl(); 

  // 倾斜相机视角，营造全息等高线沙盘的俯瞰透视感
  rotateX(PI / 3.5);
  
  // 获取过去 10 秒鼠标轨迹累计算出来的全局活跃度系数 (0.1 ~ 1.0+)
  let currentActivity = getHantaoInteraction();

  // 根据当前的活跃度，动态累加旋转角度（平时速度只有原本的 10%）
  hantao_rotationAngle += 0.001 * currentActivity;
  rotateY(hantao_rotationAngle); 

  // 驱动球体数据演变（将活跃度喂给时间轴，控制地形波动速度）
  myPlanet.update(currentActivity);
  // 渲染球体
  myPlanet.display();
}

function windowResized() {
  // 窗口自适应缩放
  resizeCanvas(windowWidth, windowHeight);
}