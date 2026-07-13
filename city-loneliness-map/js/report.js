import { getUserProfile, getCheckins } from './data.js';

function findInsight(topEmotion, allEmotions) {
  if (insightTemplates[topEmotion]) return insightTemplates[topEmotion];

  const normalized = topEmotion.replace(/型孤独$/, '').trim();
  if (insightTemplates[normalized]) return insightTemplates[normalized];

  for (const emotion of allEmotions) {
    if (insightTemplates[emotion]) return insightTemplates[emotion];
    const n = emotion.replace(/型孤独$/, '').trim();
    if (insightTemplates[n]) return insightTemplates[n];
  }

  return insightTemplates['默认'];
}

const insightTemplates = {
  '归属感缺失': {
    text: '你的表达中反复出现「属于」「回家」「真正」等归属诉求。这种孤独不源于独处，而源于「身在人群却无所依」的落差。建议尝试把「归属感」从「空间占有」转化为「瞬间锚定」——不需要拥有整座城市，只需要建立一个只属于此刻的小仪式。',
    chips: ['在固定地点拍一张天空照片', '给未来的自己写一封定时邮件', '记住一位常去店铺店员的名字', '找一个只有你知道的城市角落']
  },
  '人群中的孤独': {
    text: '你的孤独多发生在「高人群密度」场景。这是一种「社交饱和型孤独」——不是缺少人，而是缺少「被看见」。你渴望的不是更多社交，而是更深层的连接质量。从「被看见」转向「看见他人」，会创造出一种无声但真实的连接。',
    chips: ['每天记录一个陌生人的温暖细节', '在公共场合画一幅速写', '加入一个线下静默活动', '对熟悉的服务员说声谢谢']
  },
  '时间焦虑': {
    text: '你的留言隐含「时间错位」叙事——在不应该孤独的时段感到孤独。这种孤独与「社会时钟」的偏离有关。试着把你的「非标准时间」重新定义为「特权时间」，当别人都在标准化轨迹上时，你拥有的是城市最安静的一面。',
    chips: ['制作一份「深夜城市声音地图」', '给未来的自己写一封定时邮件', '寻找同样作息的线上社群', '记录非标准时段的天空颜色']
  },
  '漂泊感': {
    text: '你的孤独伴随强烈的「流动」意象：地铁、出租车、步行、换乘。你在空间转移中体验到一种「悬浮感」——既不在原点，也未到达归属地。给这些过渡空间赋予一点个人意义，会让漂泊变得有方向。',
    chips: ['在通勤路线固定听一期播客', '在某一站短暂停留观察街景', '为常走的路取一个专属名字', '记录三个让你觉得安全的过渡空间']
  },
  '深夜孤独': {
    text: '你的情绪多在夜晚浮现。深夜的孤独往往被放大，因为白天的社交面具被摘下，内心的声音变得清晰。这并不意味着你更脆弱，而是你在夜晚更诚实。用温和的方式陪伴这份诚实，而不是驱赶它。',
    chips: ['睡前写三行情绪日记', '准备一份「深夜安心歌单」', '在窗边放一杯温水慢慢喝完', '给信任的人发一条不期待回复的消息']
  },
  '居住孤独': {
    text: '你的孤独与「居住空间」紧密相连。房间里的安静、冰箱的嗡嗡声、没有回应的门锁，都在强化一种「物理性孤独」。让空间产生一点被使用过的痕迹——哪怕是一盏常亮的灯、一杯没喝完的茶——都会让孤独变得可栖居。',
    chips: ['给房间添置一盆容易养的绿植', '每天打开窗帘让阳光进来', '在冰箱上贴一张本周小目标', '为房间选一个专属的香氛']
  },
  '默认': {
    text: '你的城市孤独呈现出多源混合的特征：它可能发生在通勤途中、深夜房间、人群边缘，也可能只是某个下午突然涌上的空茫。这些片段共同构成了一幅属于你的城市情绪地图，标记本身就是温柔的自我看见。',
    chips: ['标记一个让你感到安全的城市角落', '写一句只想对自己说的心里话', '拍下今天看到的第一盏灯', '给自己泡一杯温度刚好的水']
  }
};

export function initReport() {
  const ctaBtn = document.getElementById('cta-btn');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modal-close');

  if (!ctaBtn || !modal || !modalClose) return;

  ctaBtn.addEventListener('click', () => {
    renderReport();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      document.querySelectorAll('.report-bar-fill').forEach(bar => {
        const width = bar.dataset.width || bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => bar.style.width = width, 100);
      });
    }, 300);
  });

  modalClose.addEventListener('click', () => {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
}

function renderReport() {
  const container = document.getElementById('report-content');
  if (!container) return;

  const profile = getUserProfile();
  const checkins = getCheckins();
  const userCheckins = checkins.filter(c => c.id && String(c.id).startsWith('user_'));

  if (!userCheckins.length) {
    container.innerHTML = `
      <div class="report-empty" style="text-align:center;padding:2rem 1rem;color:var(--muted);">
        <div style="font-size:2rem;margin-bottom:0.5rem;">&#127769;</div>
        <p>你还没有留下任何情绪坐标。</p>
        <p style="font-size:0.8rem;margin-top:0.5rem;">在地图上标记一个让你感到孤独的地点，报告就会从这里开始生长。</p>
      </div>
    `;
    return;
  }

  const emotionCount = {};
  let totalScore = 0;
  let totalMessages = 0;

  userCheckins.forEach(c => {
    const emotion = c.emotion || (c.tags && c.tags[0]) || '未分类';
    emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
    totalScore += Number(c.score) || 0;
    totalMessages += (c.messages && c.messages.length) || 1;
  });

  const sortedEmotions = Object.entries(emotionCount)
    .sort((a, b) => b[1] - a[1]);
  const topEmotion = sortedEmotions[0][0];
  const avgScore = Math.round(totalScore / userCheckins.length);
  const emotionTypesCount = sortedEmotions.length;

  const maxCount = sortedEmotions[0][1];
  const chartHtml = sortedEmotions.slice(0, 5).map(([emotion, count]) => {
    const percent = Math.round((count / userCheckins.length) * 100);
    return `
      <div class="report-bar-item">
        <span class="report-bar-label">${emotion}</span>
        <div class="report-bar-track">
          <div class="report-bar-fill" data-width="${percent}%" style="width: 0%">${percent}%</div>
        </div>
      </div>
    `;
  }).join('');

  const insight = findInsight(topEmotion, sortedEmotions.map(([e]) => e));
  const chipsHtml = insight.chips.map(chip => `<span class="suggestion-chip">${chip}</span>`).join('');

  container.innerHTML = `
    <div class="report-section">
      <h4>数据概览</h4>
      <div class="report-stats">
        <div class="report-stat">
          <span class="number">${userCheckins.length}</span>
          <span class="label">标记地点</span>
        </div>
        <div class="report-stat">
          <span class="number">${emotionTypesCount}</span>
          <span class="label">孤独类型</span>
        </div>
        <div class="report-stat">
          <span class="number">${avgScore}</span>
          <span class="label">平均自报强度</span>
        </div>
      </div>
    </div>

    <div class="report-section">
      <h4>孤独类型分布</h4>
      <div class="report-chart-bars">
        ${chartHtml}
      </div>
    </div>

    <div class="report-section">
      <h4>AI 洞察 · ${topEmotion}</h4>
      <div class="report-insight">
        ${insight.text}
      </div>
    </div>

    <div class="report-section">
      <h4>低压力行动建议</h4>
      <div class="suggestion-chips">
        ${chipsHtml}
      </div>
    </div>
  `;
}
