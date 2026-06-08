// 5秒鼠标轨迹能量蓄水池机制

// 用一个纯数值作为能量池，彻底抛弃会产生延迟饱和的数组队列
let hantao_energyPool = 0; 

// 🔥【微调点 1】：把初始冬眠活跃度同步降低到 0.02 (2% 速度)
let hantao_smoothedActivity = 0.02; 

function getHantaoInteraction() {
  // 1. 计算当前这一帧鼠标相对于上一帧移动了多少像素的物理距离
  let frameDistance = dist(mouseX, mouseY, pmouseX, pmouseY);
  
  // 过滤刚打开页面或者鼠标瞬间跨屏导致的极端噪点数据
  if (frameDistance > 300) frameDistance = 0;

  // 2. 注入充能：鼠标只要在动，就按比例实时转化为能量注入池中
  hantao_energyPool += frameDistance * 0.03;

  // 3. 核心即时减速机制：物理阻尼自然蒸发
  hantao_energyPool *= 0.99;

  // 约束能量池范围在 0 到 1.0 之间
  hantao_energyPool = constrain(hantao_energyPool, 0, 1.0);

  // 4. 🔥【核心修改 - 动态范围拉满】：
  // 0 能量时 = 映射为极度静止的 2% 活跃度 (0.02)，球体几乎完全冻结
  // 满能量时 = 映射为原本 2.5 倍的超频暴走活跃度 (2.5)，自转和地表波动疯狂加速
  let targetActivity = map(hantao_energyPool, 0, 1.0, 0.02, 2.5);
  
  // 5. 阻尼缓动：让能量在充能和消退的过渡瞬间显得更有科技画面的质感
  hantao_smoothedActivity = lerp(hantao_smoothedActivity, targetActivity, 0.1);
  
  return hantao_smoothedActivity;
}