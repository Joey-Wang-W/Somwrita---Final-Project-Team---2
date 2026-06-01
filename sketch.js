let myPlanet;

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
  // 场景自转速度：调整 0.001 可以改变整个球体的自转快慢
  rotateY(frameCount * 0.001); 

  myPlanet.update();
  myPlanet.display();
}

function windowResized() {
  // 窗口自适应缩放
  resizeCanvas(windowWidth, windowHeight);
}