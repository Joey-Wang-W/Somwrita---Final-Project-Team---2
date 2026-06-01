// noprotect
// 核心球体

class OscilloscopeSphere {
  constructor() {
    // 基础半径：调整此值可以直接改变球体的初始大小
    this.radius = 150;       
    
    // 纵向线条密度（纬线圈数）：数值越大横向线越密，层叠感越重，但会消耗更多性能
    this.latitudes = 75;     
    
    // 单条线网格采样点数（经度密度）：数值越大线条越顺滑，越接近完美圆环
    this.longitudes = 160;   
    
    this.timeOffset = 0;
  }

  update() {
    // 演变流淌速度：增加会让波动变快，降低则会平缓
    this.timeOffset += 0.007;
  }

  display() {
    push();
    noFill(); // 关掉面填充，只保留纯粹的线条结构
    strokeWeight(1); // 1 像素的锐利电子光束质感

    // 提取并缓存所有噪声高度
    let noiseCache = [];
    
    for (let i = 0; i <= this.latitudes; i++) {
      let lat = map(i, 0, this.latitudes, 0.01 * PI, 0.99 * PI);
      noiseCache[i] = [];
      
      for (let j = 0; j <= this.longitudes; j++) {
        let lon = map(j, 0, this.longitudes, 0, TWO_PI);

        // 计算纯球面的基础朝向向量
        let xDir = sin(lat) * cos(lon);
        let yDir = cos(lat); 
        let zDir = sin(lat) * sin(lon);

        // 空间噪波缩放（密集度）：调整可以改变山峰波浪的紧凑程度
        // 数值越大，山峰起伏越密集细碎；数值越小，地表越平缓连绵
        let macroNoise = noise(
          xDir * 1.3 + this.timeOffset, 
          yDir * 1.3, 
          zDir * 1.3 + this.timeOffset
        );
        
        // 起伏范围与最大振幅：调整 -100 和 200 来决定地形的绝对凹凸程度
        noiseCache[i][j] = map(macroNoise, 0, 1, -100, 200);
      }
    }

    // 多层发光外壳渲染
    // 发光外壳叠层数量：修改循环上限（例如 3 改为 4）可以增加或减少外壳层数
    for (let layer = 0; layer < 3; layer++) {
      
      // 层间距：调整 15 可以改变层与层之间的向外偏移距离
      let currentOffset = layer * 15; 

      for (let i = 1; i < this.latitudes; i++) {
        let lat = map(i, 0, this.latitudes, 0.01 * PI, 0.99 * PI);
        
        // 建立赤道区域亮、南北两极区域暗的全息渐隐透明度
        let baseAlpha = map(sin(lat), 0, 1, 15, 190); 
        
        // 透明度衰减率：调整 0.3 可以控制最外层能量壳的淡出速度
        // 0.3 代表每向外一层，透明度减少 30%
        let layerAlpha = baseAlpha * (1.0 - layer * 0.3); 
        
        // 荧光线条色彩：调整 RGB 核心数值（当前为经典荧光绿 50, 255, 130）
        stroke(50, 255, 130, layerAlpha);

        // 开始绘制当前层、当前纬度的圆环线
        beginShape();
        for (let j = 0; j <= this.longitudes; j++) {
          let lon = map(j, 0, this.longitudes, 0, TWO_PI);

          let xDir = sin(lat) * cos(lon);
          let yDir = cos(lat); 
          let zDir = sin(lat) * sin(lon);

          // 提取缓存中计算好的起伏地形数据
          let bigWaves = noiseCache[i][j];
          // 叠加当前层的专属 Offset，实现完美的法线向外发光膨胀
          let currentRadius = this.radius + bigWaves + currentOffset;

          // 计算最终渲染的 3D 空间坐标
          let x = currentRadius * xDir;
          let y = currentRadius * yDir;
          let z = currentRadius * zDir;

          vertex(x, y, z);
        }
        endShape(CLOSE); // 确保每个切片圆环首尾完美相连
      }
    }
    pop();
  }
}