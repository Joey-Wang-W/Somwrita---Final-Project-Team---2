// ═══════════════════════════════════════════════════════════════
//  Heartbeat Topography
//  Option 1 – Reinterpret: "Heartbeat_Topography" 系列
//  Mechanic: Time-based（仅使用时间驱动，无其他机制）
//
//  时间驱动说明：
//  - millis() 获取程序运行毫秒数，转换为秒作为唯一时间源
//  - 所有形态变化、颜色漂移、收缩蠕动、自转
//    全部由时间 t 的数学函数（sin/cos）推导，无随机、无交互
//  - 8 种形态按固定时间表循环：
//    每种形态停留 PHASE 秒 → 平滑过渡 TRANS 秒 → 下一种
// ═══════════════════════════════════════════════════════════════

// ── 时间轴常量 ────────────────────────────────────────────────
const PHASE = 8.0;   // 每种形态停留秒数（time-based 核心参数）
const TRANS = 2.5;   // 形态间过渡秒数
const CYCLE = PHASE + TRANS;

// ── 全局旋转角 ────────────────────────────────────────────────
let rotY = 0;        // Y 轴自转角度，每帧递增（time-based）
const ROT_X = 0.18;  // 固定俯仰角（弧度）

// ─────────────────────────────────────────────────────────────
//  数学噪声：sin/cos 多频叠加，替代 Perlin（作业要求不用 Perlin）
//  返回值范围 [0, 1]
// ─────────────────────────────────────────────────────────────
function sinNoise(x, y, z) {
  // 6 组不同频率与相位的正弦波叠加，模拟连续平滑的噪声场
  let s =
    sin(x * 1.0 + y * 0.7  + z * 1.3 ) * 0.22 +
    sin(x * 2.3 + y * 1.9  + z * 0.8 ) * 0.18 +
    sin(x * 0.5 + y * 3.1  + z * 2.1 ) * 0.16 +
    sin(x * 3.7 + y * 0.4  + z * 1.7 ) * 0.14 +
    sin(x * 1.6 + y * 2.8  + z * 3.5 ) * 0.12 +
    sin(x * 4.1 + y * 1.3  + z * 0.6 ) * 0.10;
  return constrain(s * 0.54 + 0.5, 0, 1); // 映射到 [0, 1]
}

// FBM（分形布朗运动）：多倍频叠加，产生自然地形质感
// oct = 倍频层数，越多细节越丰富
function fbm(x, y, z, oct) {
  let val = 0, amp = 0.5, freq = 1, total = 0;
  for (let i = 0; i < oct; i++) {
    val   += sinNoise(x * freq, y * freq, z * freq) * amp;
    total += amp;
    amp   *= 0.5;
    freq  *= 2.07; // 非整数倍，避免频率对齐产生重复纹理
  }
  return val / total; // 归一化到 [0, 1]
}

// Smoothstep：三阶平滑插值（消除过渡跳变）
function smoothstep(t) {
  t = constrain(t, 0, 1);
  return t * t * (3 - 2 * t);
}

// Smootherstep：五阶平滑（用于形态过渡，更丝滑）
function smootherstep(t) {
  t = constrain(t, 0, 1);
  return t * t * t * (t * (6 * t - 15) + 10);
}

// ─────────────────────────────────────────────────────────────
//  8 种形态配置（严格对照参考图 Heartbeat_Topography 系列）
//
//  shape（外形）：
//    rx, ry, rz   三轴半径 → 控制椭球轮廓
//    twistY       绕Y轴螺旋扭曲（图4/5/8）
//    twistFrq     扭曲频率
//    hollowR      中心空洞半径（图1/3/5 的黑洞）
//    hollowSoft   空洞边缘过渡宽度
//    lobeStr      叶瓣分裂强度（图2/6 的花瓣/翅膀）
//    lobeFrq      叶瓣数量
//    foldAmp      表面大起伏褶皱振幅（图8）
//    foldFrq      褶皱频率
//
//  hair（毛发）：
//    len          毛发最大长度
//    scatter      散射角系数（0=垂直，1=蓬松）
//    lw           线宽
//    dLat, dLon   纬/经采样密度
//    nScl         噪声空间频率
//    nAmp         地形起伏幅度
//    nOct         FBM 倍频数
//    thresh       不画毛发的噪声阈值
//    layers       渲染层数（多层叠加产生厚实感）
//    layerStep    层间距
//    layerPhase   层间噪声相位差
//
//  color（颜色）：
//    pal          [暗色, 主色, 次色, 亮色] 调色板
//    cScl         颜色噪声频率
//    cSpd         颜色漂移速度（time-based：随时间漂移）
//
//  运动（time-based 驱动）：
//    rotSpd       Y轴自转速度（弧度/帧，time-based）
//    waveAmp      收缩蠕动幅度（由 sin(t) 驱动，time-based）
//    waveSpds     [3个互质频率]，三频 sin 叠加不规律蠕动
// ─────────────────────────────────────────────────────────────
const MORPHS = [

  // ─── 图1：中心黑洞 + 毛发爆炸 + 横向略宽 ─────────────────
  {
    name: 'IMG 01',
    shape: {
      rx:148, ry:138, rz:145,
      twistY:0, twistFrq:0,
      hollowR:46, hollowSoft:22,
      lobeStr:0, lobeFrq:2,
      foldAmp:0, foldFrq:0,
    },
    hair: { len:70, scatter:0.48, lw:0.82, dLat:68, dLon:136,
            nScl:1.35, nAmp:50, nOct:4, thresh:0.15,
            layers:4, layerStep:10, layerPhase:1.5 },
    color: { pal:[[0,0,0],[12,85,8],[72,210,25],[205,238,185]], cScl:1.2, cSpd:0.05 },
    rotSpd:0.0018, waveAmp:22, waveSpds:[0.031,0.047,0.019],
  },

  // ─── 图2：宽扁花卉，上短下宽，双叶结构 ───────────────────
  {
    name: 'IMG 02',
    shape: {
      rx:195, ry:98, rz:148,
      twistY:0, twistFrq:0,
      hollowR:0, hollowSoft:0,
      lobeStr:0.38, lobeFrq:2,
      foldAmp:0, foldFrq:0,
    },
    hair: { len:50, scatter:0.32, lw:0.92, dLat:50, dLon:100,
            nScl:0.70, nAmp:65, nOct:3, thresh:0.12,
            layers:3, layerStep:16, layerPhase:2.2 },
    color: { pal:[[2,20,5],[10,95,22],[26,158,52],[228,242,212]], cScl:0.85, cSpd:0.038 },
    rotSpd:0.0014, waveAmp:16, waveSpds:[0.028,0.043,0.017],
  },

  // ─── 图3：纵向椭圆 + 大黑洞 + 上青下黄绿 ─────────────────
  {
    name: 'IMG 03',
    shape: {
      rx:128, ry:172, rz:132,
      twistY:0, twistFrq:0,
      hollowR:52, hollowSoft:20,
      lobeStr:0, lobeFrq:2,
      foldAmp:0, foldFrq:0,
    },
    hair: { len:88, scatter:0.44, lw:0.76, dLat:66, dLon:132,
            nScl:1.72, nAmp:48, nOct:4, thresh:0.14,
            layers:3, layerStep:11, layerPhase:1.7 },
    color: { pal:[[4,38,48],[18,180,195],[148,222,12],[212,244,230]], cScl:1.4, cSpd:0.058 },
    rotSpd:0.0022, waveAmp:28, waveSpds:[0.033,0.051,0.021],
  },

  // ─── 图4：近圆 + 螺旋卷曲 + 左密右暗 ─────────────────────
  {
    name: 'IMG 04',
    shape: {
      rx:148, ry:145, rz:148,
      twistY:1.35, twistFrq:2.0,
      hollowR:0, hollowSoft:0,
      lobeStr:0, lobeFrq:2,
      foldAmp:0, foldFrq:0,
    },
    hair: { len:58, scatter:0.56, lw:0.75, dLat:64, dLon:128,
            nScl:1.55, nAmp:42, nOct:4, thresh:0.14,
            layers:5, layerStep:8, layerPhase:1.9 },
    color: { pal:[[0,18,32],[8,100,130],[95,200,22],[188,232,172]], cScl:1.3, cSpd:0.052 },
    rotSpd:0.0025, waveAmp:30, waveSpds:[0.029,0.045,0.018],
  },

  // ─── 图5：甜甜圈，中心完全掏空，左侧断口 ─────────────────
  {
    name: 'IMG 05',
    shape: {
      rx:152, ry:148, rz:152,
      twistY:1.82, twistFrq:1.85,
      hollowR:82, hollowSoft:30,
      lobeStr:0, lobeFrq:2,
      foldAmp:0, foldFrq:0,
    },
    hair: { len:36, scatter:0.30, lw:0.70, dLat:60, dLon:120,
            nScl:2.05, nAmp:28, nOct:3, thresh:0.12,
            layers:4, layerStep:7, layerPhase:1.3 },
    color: { pal:[[0,0,0],[7,82,10],[42,165,38],[202,230,195]], cScl:1.6, cSpd:0.042 },
    rotSpd:0.0020, waveAmp:15, waveSpds:[0.032,0.049,0.020],
  },

  // ─── 图6：蝴蝶形，左右两翼展开，中间收腰 ─────────────────
  {
    name: 'IMG 06',
    shape: {
      rx:188, ry:105, rz:140,
      twistY:0, twistFrq:0,
      hollowR:0, hollowSoft:0,
      lobeStr:0.52, lobeFrq:2,
      foldAmp:0, foldFrq:0,
    },
    hair: { len:62, scatter:0.60, lw:0.68, dLat:58, dLon:116,
            nScl:1.05, nAmp:55, nOct:4, thresh:0.12,
            layers:5, layerStep:12, layerPhase:2.4 },
    color: { pal:[[28,62,32],[142,220,150],[232,170,192],[252,250,248]], cScl:0.95, cSpd:0.048 },
    rotSpd:0.0016, waveAmp:26, waveSpds:[0.030,0.046,0.019],
  },

  // ─── 图7：云团，上方鼓出，边缘稀疏蓬松 ───────────────────
  {
    name: 'IMG 07',
    shape: {
      rx:125, ry:168, rz:128,
      twistY:0, twistFrq:0,
      hollowR:0, hollowSoft:0,
      lobeStr:0.20, lobeFrq:3,
      foldAmp:0, foldFrq:0,
    },
    hair: { len:68, scatter:0.82, lw:0.62, dLat:54, dLon:108,
            nScl:0.80, nAmp:75, nOct:4, thresh:0.10,
            layers:6, layerStep:14, layerPhase:2.9 },
    color: { pal:[[95,165,212],[222,152,178],[172,128,198],[254,246,250]], cScl:0.68, cSpd:0.032 },
    rotSpd:0.0012, waveAmp:36, waveSpds:[0.027,0.042,0.016],
  },

  // ─── 图8：密实球，大尺度波浪面，短密毛发 ─────────────────
  {
    name: 'IMG 08',
    shape: {
      rx:148, ry:148, rz:148,
      twistY:0.82, twistFrq:2.8,
      hollowR:0, hollowSoft:0,
      lobeStr:0, lobeFrq:2,
      foldAmp:55, foldFrq:1.8,
    },
    hair: { len:44, scatter:0.44, lw:0.76, dLat:72, dLon:144,
            nScl:1.95, nAmp:36, nOct:5, thresh:0.12,
            layers:6, layerStep:9, layerPhase:2.7 },
    color: { pal:[[14,7,52],[65,36,152],[30,152,72],[132,222,78]], cScl:1.45, cSpd:0.048 },
    rotSpd:0.0020, waveAmp:20, waveSpds:[0.034,0.052,0.022],
  },
];

const TOTAL = MORPHS.length * CYCLE; // 一次完整循环总时长

// ─────────────────────────────────────────────────────────────
//  形态插值：在两个形态之间对所有参数做平滑过渡
// ─────────────────────────────────────────────────────────────
function lerpShape(a, b, t) {
  return {
    rx:         lerp(a.rx,         b.rx,         t),
    ry:         lerp(a.ry,         b.ry,         t),
    rz:         lerp(a.rz,         b.rz,         t),
    twistY:     lerp(a.twistY,     b.twistY,     t),
    twistFrq:   lerp(a.twistFrq,   b.twistFrq,   t),
    hollowR:    lerp(a.hollowR,    b.hollowR,    t),
    hollowSoft: lerp(a.hollowSoft, b.hollowSoft, t),
    lobeStr:    lerp(a.lobeStr,    b.lobeStr,    t),
    lobeFrq:    lerp(a.lobeFrq,    b.lobeFrq,    t),
    foldAmp:    lerp(a.foldAmp,    b.foldAmp,    t),
    foldFrq:    lerp(a.foldFrq,    b.foldFrq,    t),
  };
}

function lerpHair(a, b, t) {
  return {
    len:        lerp(a.len,        b.len,        t),
    scatter:    lerp(a.scatter,    b.scatter,    t),
    lw:         lerp(a.lw,         b.lw,         t),
    dLat:       round(lerp(a.dLat,       b.dLat,       t)),
    dLon:       round(lerp(a.dLon,       b.dLon,       t)),
    nScl:       lerp(a.nScl,       b.nScl,       t),
    nAmp:       lerp(a.nAmp,       b.nAmp,       t),
    nOct:       round(lerp(a.nOct,       b.nOct,       t)),
    thresh:     lerp(a.thresh,     b.thresh,     t),
    layers:     round(lerp(a.layers,     b.layers,     t)),
    layerStep:  lerp(a.layerStep,  b.layerStep,  t),
    layerPhase: lerp(a.layerPhase, b.layerPhase, t),
  };
}

function lerpPal(pa, pb, t) {
  // 对调色板里每种颜色的 RGB 分别插值
  return pa.map((c, i) => [
    lerp(c[0], pb[i][0], t),
    lerp(c[1], pb[i][1], t),
    lerp(c[2], pb[i][2], t),
  ]);
}

function lerpMorph(a, b, rawT) {
  const t = smootherstep(rawT); // 五阶平滑，过渡更自然
  return {
    name:     rawT < 0.5 ? a.name : b.name,
    shape:    lerpShape(a.shape,  b.shape,  t),
    hair:     lerpHair(a.hair,   b.hair,   t),
    color: {
      pal:  lerpPal(a.color.pal, b.color.pal, t),
      cScl: lerp(a.color.cScl, b.color.cScl, t),
      cSpd: lerp(a.color.cSpd, b.color.cSpd, t),
    },
    rotSpd:   lerp(a.rotSpd,   b.rotSpd,   t),
    waveAmp:  lerp(a.waveAmp,  b.waveAmp,  t),
    waveSpds: a.waveSpds.map((v, i) => lerp(v, b.waveSpds[i], t)),
  };
}

// 根据当前时间 t（秒）返回当前形态
function getMorph(t) {
  const tm  = t % TOTAL;
  const idx = floor(tm / CYCLE) % MORPHS.length;
  const ph  = tm - idx * CYCLE;
  const ni  = (idx + 1) % MORPHS.length;
  if (ph < PHASE) {
    // 停留阶段：直接使用当前形态
    return { m: MORPHS[idx], prog: ph / PHASE, idx };
  } else {
    // 过渡阶段：在当前形态与下一形态之间插值
    const tx = (ph - PHASE) / TRANS;
    return { m: lerpMorph(MORPHS[idx], MORPHS[ni], tx), prog: 1, idx: tx < 0.5 ? idx : ni };
  }
}

// ─────────────────────────────────────────────────────────────
//  各渲染层的独立时间速率（互质，各层纹理永不同步）
//  time-based：每层的"局部时间" = globalTime × layerSpeed
// ─────────────────────────────────────────────────────────────
const LAYER_SPEEDS = [0.090, 0.061, 0.143, 0.037, 0.107, 0.079];

// ─────────────────────────────────────────────────────────────
//  p5.js 内置函数
// ─────────────────────────────────────────────────────────────
function setup() {
  createCanvas(700, 700);
  colorMode(RGB, 255);
}

function draw() {
  // ── time-based 核心：用 millis() 获取运行时间（秒）────────
  const t = millis() / 1000.0;

  const { m, prog, idx } = getMorph(t);

  // Y 轴自转（time-based：rotSpd × 帧数 = 随时间均匀旋转）
  rotY += m.rotSpd;

  const S  = m.shape;
  const hr = m.hair;
  const C  = m.color;

  // 清屏
  background(0);

  // ── 全局收缩蠕动（time-based：3个互质频率的 sin 叠加）────
  // 不同频率的 sin 波叠加后，蠕动节奏不规律但完全由时间决定
  const ws = m.waveSpds;
  const w1 = sin(t * ws[0] * TWO_PI + 1.5);
  const w2 = sin(t * ws[1] * TWO_PI + 2.8);
  const w3 = sin(t * ws[2] * TWO_PI + 0.7);
  const gWarp = (w1 * 0.55 + w2 * 0.30 + w3 * 0.15) * m.waveAmp;

  // 颜色时间（time-based：独立速率漂移，与形态变化解耦）
  const TC = t * C.cSpd * 60;

  const segs = []; // 收集所有毛发线段，之后按深度排序绘制

  for (let layer = 0; layer < hr.layers; layer++) {
    // time-based：每层局部时间 = t × 该层速率（互质，各层不同步）
    const LT     = t * LAYER_SPEEDS[layer % LAYER_SPEEDS.length] * 10;
    const phOff  = layer * hr.layerPhase; // 层间噪声相位偏移
    const aScale = 1.0 - layer * 0.10;   // 外层透明度递减

    for (let i = 0; i <= hr.dLat; i++) {
      const lat    = PI * 0.025 + (i / hr.dLat) * PI * 0.95;
      const sinLat = sin(lat), cosLat = cos(lat);

      for (let j = 0; j < hr.dLon; j++) {
        const lon    = (j / hr.dLon) * TWO_PI;
        const sinLon = sin(lon), cosLon = cos(lon);

        // 球面法线方向（单位向量）
        let nx = sinLat * cosLon;
        let ny = cosLat;
        let nz = sinLat * sinLon;

        // ── 螺旋扭曲（time-based：LT 随时间增长，扭曲缓慢旋转）
        if (S.twistY > 0) {
          const ta  = ny * S.twistFrq * S.twistY + LT * 0.05;
          const nx2 = nx * cos(ta) - nz * sin(ta);
          const nz2 = nx * sin(ta) + nz * cos(ta);
          nx = nx2; nz = nz2;
        }

        // ── 三轴椭球变形 ──────────────────────────────────
        const ls  = 1.0 + layer * hr.layerStep / 150.0;
        let px0 = nx * (S.rx + gWarp) * ls;
        let py0 = ny * (S.ry + gWarp) * ls;
        let pz0 = nz * (S.rz + gWarp) * ls;

        // ── 叶瓣/蝴蝶分裂 ────────────────────────────────
        if (S.lobeStr > 0) {
          const extra = cos(S.lobeFrq * lon) * S.lobeStr * sin(lat) * 80;
          px0 += nx * extra;
          pz0 += nz * extra;
        }

        // ── 大尺度表面褶皱（time-based：LT 驱动褶皱缓慢流动）
        if (S.foldAmp > 0) {
          const fold =
            sin(nx * S.foldFrq + ny * S.foldFrq * 0.7 + LT * 0.02) * 0.5 +
            sin(nz * S.foldFrq * 1.3 + ny * S.foldFrq * 0.5 + LT * 0.015) * 0.5;
          px0 += nx * fold * S.foldAmp;
          py0 += ny * fold * S.foldAmp;
          pz0 += nz * fold * S.foldAmp;
        }

        // ── FBM 地形噪声（time-based：LT 推进，表面纹理流动）
        const nv = fbm(
          nx * hr.nScl + LT       + phOff,
          ny * hr.nScl,
          nz * hr.nScl + LT * 0.7 + phOff * 0.6,
          hr.nOct
        );
        if (nv < hr.thresh) continue;

        // ── 中心空洞遮罩 ──────────────────────────────────
        let hMask = 1.0;
        if (S.hollowR > 0) {
          const dY = sqrt(px0 * px0 + pz0 * pz0);
          hMask = smoothstep(max(0, (dY - S.hollowR) / max(1, S.hollowSoft)));
        }
        if (hMask < 0.02) continue;

        // ── 最终球面点位置 ────────────────────────────────
        const disp = hr.nAmp * (nv - 0.5) * 2.0;
        const rx = px0 + nx * disp;
        const ry = py0 + ny * disp;
        const rz = pz0 + nz * disp;

        // ── 毛发长度 ──────────────────────────────────────
        const lenF = sin(smoothstep(nv) * HALF_PI);
        const hLen = hr.len * lenF * (1.0 - layer * 0.055);

        // ── 毛发散射方向（time-based：LT 驱动方向缓慢变化）
        const t1x = -sinLon, t1y = 0, t1z = cosLon;
        const t2x = cosLat * cosLon, t2y = -sinLat, t2z = cosLat * sinLon;
        const ang  = sin(nx * 5.1 + LT * 1.65 + phOff) * hr.scatter * PI;
        const cosA = cos(ang), sinA = sin(ang);
        const bl   = 0.28;
        let hnx = nx * (1 - bl) + (t1x * cosA + t2x * sinA) * bl;
        let hny = ny * (1 - bl) + (t1y * cosA + t2y * sinA) * bl;
        let hnz = nz * (1 - bl) + (t1z * cosA + t2z * sinA) * bl;
        const hm = sqrt(hnx*hnx + hny*hny + hnz*hnz) || 1;
        hnx /= hm; hny /= hm; hnz /= hm;

        const ex = rx + hnx * hLen;
        const ey = ry + hny * hLen;
        const ez = rz + hnz * hLen;

        // ── 多色混染（time-based：TC 随时间推进，颜色缓慢漂移）
        const cn1 = (sin(nx * C.cScl + TC) + 1) * 0.5;
        const cn2 = (sin(nz * C.cScl * 2.3 + TC + 4.3 + ny * C.cScl) + 1) * 0.5;
        const pal = C.pal;
        // 在调色板 4 色中插值
        const col1 = [
          lerp(pal[0][0], pal[1][0], cn1),
          lerp(pal[0][1], pal[1][1], cn1),
          lerp(pal[0][2], pal[1][2], cn1),
        ];
        const col2 = [
          lerp(pal[2][0], pal[3][0], cn2),
          lerp(pal[2][1], pal[3][1], cn2),
          lerp(pal[2][2], pal[3][2], cn2),
        ];
        const mxF = smoothstep(nv * 1.6 - 0.3);
        const lsh = layer * 0.06;
        const col = [
          lerp(lerp(col1[0], col2[0], mxF), pal[3][0], lsh),
          lerp(lerp(col1[1], col2[1], mxF), pal[3][1], lsh),
          lerp(lerp(col1[2], col2[2], mxF), pal[3][2], lsh),
        ];

        // ── 透视投影 ──────────────────────────────────────
        const [ppx, ppy, , ppz] = project3D(rx, ry, rz);
        const [qpx, qpy]        = project3D(ex, ey, ez);

        // ── 透明度 ────────────────────────────────────────
        const avgR   = (S.rx + S.ry + S.rz) / 3;
        const facing = max(0, 0.52 - ppz / (avgR * 2.8));
        const alpha  = (0.18 + facing * 0.64) * lenF * aScale * hMask;

        segs.push({ px:ppx, py:ppy, qx:qpx, qy:qpy, col, alpha, lw:hr.lw, depth:ppz });
      }
    }
  }

  // 深度排序（远→近），保证近处正确遮挡远处
  segs.sort((a, b) => a.depth - b.depth);

  // 绘制（加法混色：密集处叠加变亮，模拟发光效果）
  drawingContext.globalCompositeOperation = 'lighter';
  for (const s of segs) {
    // 线性渐变：根部不透明 → 尖端透明
    const g = drawingContext.createLinearGradient(s.px, s.py, s.qx, s.qy);
    g.addColorStop(0, `rgba(${s.col[0]|0},${s.col[1]|0},${s.col[2]|0},${(s.alpha*0.92).toFixed(3)})`);
    g.addColorStop(1, `rgba(${s.col[0]|0},${s.col[1]|0},${s.col[2]|0},${(s.alpha*0.02).toFixed(3)})`);
    drawingContext.beginPath();
    drawingContext.moveTo(s.px, s.py);
    drawingContext.lineTo(s.qx, s.qy);
    drawingContext.strokeStyle = g;
    drawingContext.lineWidth   = s.lw;
    drawingContext.stroke();
  }
  drawingContext.globalCompositeOperation = 'source-over';

  // ── HUD（time-based 进度条，显示当前形态停留进度）─────────
  noStroke();
  fill(100, 220, 130, 90);
  textFont('monospace');
  textSize(11);
  textAlign(CENTER);
  text(MORPHS[idx] ? MORPHS[idx].name : m.name, width / 2, height - 28);

  // 进度条（显示当前形态剩余时间）
  const barW = 130, barX = width / 2 - barW / 2, barY = height - 18;
  fill(100, 220, 130, 25);
  rect(barX, barY, barW, 1);
  fill(100, 220, 130, 90);
  rect(barX, barY, barW * prog, 1);

  // 形态序号
  fill(100, 220, 130, 50);
  textSize(9);
  text(`${String(idx+1).padStart(2,'0')} / ${String(MORPHS.length).padStart(2,'0')}`, width/2, height - 6);
}

// ─────────────────────────────────────────────────────────────
//  3D 透视投影（time-based：rotY 随时间均匀递增）
// ─────────────────────────────────────────────────────────────
function project3D(x, y, z) {
  // 绕 Y 轴旋转（自转）
  const cy = cos(rotY), sy = sin(rotY);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  // 绕 X 轴倾斜（固定俯仰角）
  const cx = cos(ROT_X), sx = sin(ROT_X);
  const y2 = y * cx - z1 * sx;
  const z2 = y * sx + z1 * cx;
  // 透视投影（焦距 700，居中）
  const fov = 700;
  const sc  = fov / (fov + z2);
  return [width/2 + x1 * sc, height/2 + y2 * sc, sc, z2];
}