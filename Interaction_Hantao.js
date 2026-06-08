// 5秒鼠标轨迹能量蓄水池机制

// 用一个纯数值作为能量池，彻底抛弃会产生延迟饱和的数组队列
let hantao_energyPool = 0; 
let hantao_smoothedActivity = 0.1; // 初始处于 10% 的低能冬眠状态

function getHantaoInteraction() {
  // 1. 计算当前这一帧鼠标相对于上一帧移动了多少像素的物理距离
  let frameDistance = dist(mouseX, mouseY, pmouseX, pmouseY);
  
  // 过滤刚打开页面或者鼠标瞬间跨屏导致的极端噪点数据
  if (frameDistance > 300) frameDistance = 0;

  // 2. 注入充能：鼠标只要在动，就按比例实时转化为能量注入池中
  // 调整 0.03 可以改变充能速度（数值越大，稍微一动就越快充满）
  hantao_energyPool += frameDistance * 0.03;

  // 3. 🔥 核心即时减速机制：物理阻尼自然蒸发
  // 每一帧能量池都自动乘以 0.99。鼠标一旦停下，没有任何排队延迟，立刻开始丝滑减速！
  // 0.99 确保连续 5 秒（300帧）不动时，能量刚好蒸发掉 95% 以上，精准跌回底层
  hantao_energyPool *= 0.99;

  // 约束能量池范围在 0 到 1.0 之间，从根本上斩断“能量过度饱和溢出”的 Bug
  hantao_energyPool = constrain(hantao_energyPool, 0, 1.0);

  // 4. 能量线性映射：0 能量 = 10% 活跃度 (0.1)；满能量 = 100% 活跃度 (1.0)
  let targetActivity = map(hantao_energyPool, 0, 1.0, 0.1, 1.0);
  
  // 5. 阻尼缓动：让能量在充能和消退的过渡瞬间显得更有科技画面的质感
  hantao_smoothedActivity = lerp(hantao_smoothedActivity, targetActivity, 0.1);
  
  return hantao_smoothedActivity;
}