// =========================================================================
// AI acknowledgement: This file was generated with the help of Claude, 
// Audio-driven Mechanism
// Creator: Ying Hu
// Function: Emotion selection → Play heartbeat audio → Analyze volume and frequency bands → Output activity level
// =========================================================================


let ying_mic;
let ying_fft;
let ying_audioActivity = 0.02;
let ying_sounds = {};
let ying_currentColor = [80, 180, 255];

// 滑轨值 0.0(悲伤) ~ 0.5(平静) ~ 1.0(兴奋)
let ying_sliderValue = 0.5;

// 是否正在拖动滑轨
let ying_dragging = false;

// 滑轨UI参数
let ying_sliderX = 30;
let ying_sliderY = 80;
let ying_sliderW = 200;
let ying_sliderH = 12;

// 三种情绪配置
let ying_emotionConfig = {
  sad:     { file: 'sounds/heartbeat_sad.mp3',     color: [100, 100, 220], boost: 1.0 },
  calm:    { file: 'sounds/heartbeat_calm.mp3',    color: [80, 180, 255],  boost: 1.5 },
  excited: { file: 'sounds/heartbeat_excited.mp3', color: [255, 200, 50],  boost: 5.0 }
};

// -------------------------------------------------------
function preloadAudio() {
  for (let emotion in ying_emotionConfig) {
    ying_sounds[emotion] = loadSound(ying_emotionConfig[emotion].file);
  }
}

// -------------------------------------------------------
function setupAudio() {
  ying_mic = new p5.AudioIn();
  ying_mic.start();
  ying_fft = new p5.FFT(0.8, 64);
  ying_fft.setInput(ying_mic);

  // 默认播放全部，用音量控制混合
  for (let emotion in ying_sounds) {
    ying_sounds[emotion].loop();
    ying_sounds[emotion].setVolume(0);
  }
  // 默认平静音量为1
  ying_sounds['calm'].setVolume(1);
}

// -------------------------------------------------------
// 根据滑轨位置混合三种音频的音量
function updateAudioMix() {
  let v = ying_sliderValue; // 0~1

  let sadVol, calmVol, excitedVol;

  if (v < 0.5) {
    // 左半段：悲伤 → 平静
    let t = v / 0.5; // 0~1
    sadVol     = 1.0 - t;
    calmVol    = t;
    excitedVol = 0;
  } else {
    // 右半段：平静 → 兴奋
    let t = (v - 0.5) / 0.5; // 0~1
    sadVol     = 0;
    calmVol    = 1.0 - t;
    excitedVol = t;
  }

  ying_sounds['sad'].setVolume(sadVol);
  ying_sounds['calm'].setVolume(calmVol);
  ying_sounds['excited'].setVolume(excitedVol);

  // 根据滑轨位置插值当前颜色
  let sad = ying_emotionConfig['sad'].color;
  let calm = ying_emotionConfig['calm'].color;
  let exc = ying_emotionConfig['excited'].color;

  if (v < 0.5) {
    let t = v / 0.5;
    ying_currentColor = [
      lerp(sad[0], calm[0], t),
      lerp(sad[1], calm[1], t),
      lerp(sad[2], calm[2], t)
    ];
  } else {
    let t = (v - 0.5) / 0.5;
    ying_currentColor = [
      lerp(calm[0], exc[0], t),
      lerp(calm[1], exc[1], t),
      lerp(calm[2], exc[2], t)
    ];
  }
}

// -------------------------------------------------------
function getYingAudio() {
  updateAudioMix();

  let vol = ying_mic.getLevel();
  let spectrum = ying_fft.analyze();
  let bass = 0;
  for (let i = 0; i < 8; i++) bass += spectrum[i];
  bass = bass / 8 / 255;

  let rawEnergy = vol * 0.4 + bass * 0.6;

  // boost 也根据滑轨位置插值
  let boostSad  = ying_emotionConfig['sad'].boost;
  let boostCalm = ying_emotionConfig['calm'].boost;
  let boostExc  = ying_emotionConfig['excited'].boost;
  let boost;
  if (ying_sliderValue < 0.5) {
    boost = lerp(boostSad, boostCalm, ying_sliderValue / 0.5);
  } else {
    boost = lerp(boostCalm, boostExc, (ying_sliderValue - 0.5) / 0.5);
  }

  let amplified = rawEnergy * boost;
  let targetActivity = map(amplified, 0, 1, 0.02, 3.0);
  targetActivity = constrain(targetActivity, 0.02, 3.0);
  ying_audioActivity = lerp(ying_audioActivity, targetActivity, 0.12);

  return ying_audioActivity;
}

// -------------------------------------------------------
function triggerHeartbeatPulse() {
  let cx = width / 2;
  let cy = height / 2;
  if (dist(mouseX, mouseY, cx, cy) < 200) {
    ying_audioActivity = min(ying_audioActivity + 0.8, 3.0);
  }
}

// -------------------------------------------------------
// 滑轨交互（在 sketch.js 的 mousePressed/mouseDragged/mouseReleased 里调用）
function sliderMousePressed() {
  // 补偿WEBGL坐标偏移
  let mx = mouseX;
  let my = mouseY;
  let thumbX = ying_sliderX + ying_sliderValue * ying_sliderW;
  let thumbY = ying_sliderY + ying_sliderH / 2;
  if (dist(mx, my, thumbX, thumbY) < 20) {
    ying_dragging = true;
  }
}

function sliderMouseDragged() {
  if (ying_dragging) {
    ying_sliderValue = constrain(
      (mouseX - ying_sliderX) / ying_sliderW,
      0, 1
    );
  }
}

function sliderMouseReleased() {
  ying_dragging = false;
}

// -------------------------------------------------------
// 绘制滑轨UI（在 sketch.js draw() 最后的 push/camera/ortho 块里调用）
function drawEmotionUI() {
  let sx = ying_sliderX;
  let sy = ying_sliderY;
  let sw = ying_sliderW;
  let sh = ying_sliderH;
  let thumbX = sx + ying_sliderValue * sw;
  let thumbY = sy + sh / 2;

  // 标题
  fill(200);
  noStroke();
  textSize(13);
  textAlign(LEFT, BASELINE);
  text('愉快度', sx, sy - 10);

  // 轨道背景
  fill(60, 60, 70);
  noStroke();
  rectMode(CORNER);
  rect(sx, sy, sw, sh, sh / 2);

  // 已选部分高亮
  fill(ying_currentColor[0], ying_currentColor[1], ying_currentColor[2]);
  rect(sx, sy, ying_sliderValue * sw, sh, sh / 2);

  // 滑块
  fill(255);
  noStroke();
  circle(thumbX, thumbY, 22);

  // 两端标签
  fill(180);
  textSize(11);
  textAlign(LEFT, TOP);
  text('非常不愉快', sx, sy + sh + 6);
  textAlign(RIGHT, TOP);
  text('非常愉快', sx + sw, sy + sh + 6);

  textAlign(LEFT, BASELINE);
}