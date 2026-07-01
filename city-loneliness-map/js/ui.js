import { analyzeEmotion } from './emotionAI.js';
import { CONFIG } from './config.js';
import { getNotes, addNote, seedNotesIfEmpty, getCheckins, addCheckin, getCityByCoords, resetData, EMOTION_TYPES } from './data.js';
import { onSelectCheckin, onAddCheckinRequest, getCurrentPosition, refreshMarkers, selectCheckin, getNearbyCheckins } from './map.js';

let currentCheckin = null;
let checkinDraft = null;

/* 轻提示 */
function showToast(message, duration = 2500) {
  let toast = document.getElementById('clm-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'clm-toast';
    toast.style.cssText = `
      position: fixed;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: rgba(19, 24, 32, 0.9);
      border: 1px solid rgba(122, 156, 198, 0.15);
      color: #d8dde4;
      padding: 0.6rem 1.2rem;
      border-radius: 100px;
      font-size: 0.8rem;
      z-index: 10000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      backdrop-filter: blur(8px);
      max-width: 90vw;
      text-align: center;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
  }, duration);
}

export function initUI() {
  initTabs();
  initProfile();
  initDemo();
  initChat();
  initNotes();
  initCheckinForm();
  initResetData();
  initApiKey();
  initSmoothScroll();
}

/* ========== 临时 DeepSeek API Key 配置 ========== */
function initApiKey() {
  const toggleBtn = document.getElementById('api-key-toggle');
  const wrap = document.getElementById('api-key-wrap');
  const input = document.getElementById('api-key-input');
  const saveBtn = document.getElementById('api-key-save');

  if (!toggleBtn || !wrap || !input || !saveBtn) return;

  toggleBtn.addEventListener('click', () => {
    const isHidden = wrap.style.display === 'none';
    wrap.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) input.focus();
  });

  saveBtn.addEventListener('click', () => {
    const key = input.value.trim();
    if (key) {
      CONFIG.DEEPSEEK_API_KEY = key;
      showToast('API Key 已临时保存（仅本次页面会话有效）');
      wrap.style.display = 'none';
      input.value = '';
    }
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveBtn.click();
  });
}

/* ========== 重置体验数据 ========== */
function initResetData() {
  const resetBtn = document.getElementById('reset-data-btn');
  if (!resetBtn) return;

  resetBtn.addEventListener('click', () => {
    if (confirm('确定要重置所有体验数据吗？这会清空你添加的情绪标记和小纸条，恢复为初始 demo 数据。')) {
      resetData();
      window.location.reload();
    }
  });
}

/* ========== 档案面板渲染 ========== */
function initProfile() {
  onSelectCheckin(renderProfile);
  onAddCheckinRequest(openCheckinForm);

  // 默认显示第一个标记
  const checkins = getCheckins();
  if (checkins.length) {
    renderProfile(checkins[0]);
  }
}

export function renderProfile(checkin) {
  currentCheckin = checkin;

  const profileName = document.getElementById('profile-name');
  const profileCoords = document.getElementById('profile-coords');
  const meterValue = document.getElementById('meter-value');
  const meterFill = document.getElementById('meter-fill');
  const emotionTags = document.getElementById('emotion-tags');
  const messagesList = document.getElementById('messages-list');
  const aiAnalysisText = document.getElementById('ai-analysis-text');

  if (!checkin) return;

  if (profileName) profileName.textContent = checkin.name;
  if (profileCoords) {
    profileCoords.textContent = `${checkin.lat.toFixed(4)}°N, ${checkin.lng.toFixed(4)}°E · ${checkin.city} · 第 ${(checkin.messages?.length || 1)} 次被标记`;
  }
  if (meterValue) meterValue.textContent = (checkin.score || 50) + '/100';
  if (meterFill) meterFill.style.width = (checkin.score || 50) + '%';

  if (emotionTags) {
    emotionTags.innerHTML = (checkin.tags || []).map(tag => `<span class="emotion-tag">${tag}</span>`).join('');
  }

  if (messagesList) {
    const messages = checkin.messages && checkin.messages.length ? checkin.messages : [
      { text: `"${checkin.text}"`, tag: `#${checkin.emotion || checkin.tags?.[0] || '孤独'}`, time: '刚刚' }
    ];
    messagesList.innerHTML = messages.map(msg => `
      <div class="message-item">
        <p class="message-text">${msg.text}</p>
        <div class="message-meta">
          <span>${msg.tag}</span>
          <span>${msg.time}</span>
        </div>
      </div>
    `).join('');
  }

  if (aiAnalysisText) {
    aiAnalysisText.textContent = checkin.analysis || `该地点的高频情绪为「${checkin.emotion || checkin.tags?.[0] || '孤独'}」。用户在此留下过情绪痕迹，建议以低压力的方式回应自己的感受。`;
  }

  renderNearby(checkin);
}

function renderNearby(centerCheckin) {
  const nearbyList = document.getElementById('nearby-list');
  if (!nearbyList) return;

  const nearby = getNearbyCheckins(10, 5).filter(c => c.id !== centerCheckin?.id);
  if (!nearby.length) {
    nearbyList.innerHTML = `<div class="nearby-empty" style="color:var(--muted);font-size:0.8rem;padding:1rem 0;text-align:center;">附近暂时没有更多情绪标记</div>`;
    return;
  }

  const avatars = ['&#127769;', '&#127756;', '&#128644;', '&#128161;', '&#127772;', '&#127775;'];
  const names = ['夜行者', '孤岛', '末班乘客', '路灯下', '晚风', '城市边缘人'];

  nearbyList.innerHTML = nearby.map((c, idx) => {
    const name = names[idx % names.length];
    const avatar = avatars[idx % avatars.length];
    const distance = c.distance < 1 ? `${(c.distance * 1000).toFixed(0)}m` : `${c.distance.toFixed(1)}km`;
    return `
      <div class="nearby-user" data-user="${c.id}" data-name="${name}">
        <div class="nearby-avatar">${avatar}</div>
        <div class="nearby-info">
          <div class="nearby-name">${name}</div>
          <div class="nearby-status">${c.name} · ${c.emotion || c.tags?.[0] || '孤独'}</div>
        </div>
        <div class="nearby-distance">${distance}</div>
        <div class="nearby-actions">
          <button class="nearby-action-btn chat-trigger" title="发起对话">&#128172;</button>
          <button class="nearby-action-btn voice-trigger" title="语音通话">&#127908;</button>
        </div>
      </div>
    `;
  }).join('');

  bindChatTriggers();
}

/* ========== 档案面板标签页切换 ========== */
function initTabs() {
  const profileTabs = document.querySelectorAll('.profile-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  profileTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      profileTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById('tab-' + targetTab);
      if (targetContent) targetContent.classList.add('active');
    });
  });
}

/* ========== 新增情绪标记表单 ========== */
function initCheckinForm() {
  let formEl = document.getElementById('checkin-form-modal');
  if (!formEl) {
    formEl = document.createElement('div');
    formEl.id = 'checkin-form-modal';
    formEl.className = 'modal-overlay';
    formEl.innerHTML = `
      <div class="modal" style="max-width: 420px;">
        <button class="modal-close" id="checkin-form-close">&times;</button>
        <h2>标记此刻的情绪</h2>
        <p class="modal-subtitle">在地图上留下一个情绪坐标，不需要透露身份</p>
        <form id="checkin-form" style="display:flex;flex-direction:column;gap:1rem;">
          <div>
            <label style="display:block;font-size:0.75rem;color:var(--muted);margin-bottom:0.4rem;">地点名称</label>
            <input type="text" id="checkin-name" class="demo-input" placeholder="例如：末班地铁站" required />
          </div>
          <div>
            <label style="display:block;font-size:0.75rem;color:var(--muted);margin-bottom:0.4rem;">此刻的感受</label>
            <input type="text" id="checkin-text" class="demo-input" placeholder="用一句话描述..." required />
          </div>
          <div>
            <label style="display:block;font-size:0.75rem;color:var(--muted);margin-bottom:0.4rem;">孤独指数 <span id="checkin-score-value">50</span>/100</label>
            <input type="range" id="checkin-score" min="1" max="100" value="50" style="width:100%;" />
          </div>
          <div>
            <label style="display:block;font-size:0.75rem;color:var(--muted);margin-bottom:0.4rem;">情绪标签</label>
            <div id="checkin-tags" style="display:flex;flex-wrap:wrap;gap:0.5rem;">
              ${Object.keys(EMOTION_TYPES).slice(0, 12).map(tag => `<button type="button" class="emotion-tag" data-tag="${tag}" style="cursor:pointer;">${tag}</button>`).join('')}
            </div>
          </div>
          <button type="submit" class="demo-btn" style="margin-top:0.5rem;">确认标记</button>
        </form>
      </div>
    `;
    document.body.appendChild(formEl);
  }

  const form = document.getElementById('checkin-form');
  const closeBtn = document.getElementById('checkin-form-close');
  const scoreInput = document.getElementById('checkin-score');
  const scoreValue = document.getElementById('checkin-score-value');
  const tagsContainer = document.getElementById('checkin-tags');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      formEl.classList.remove('show');
      document.body.style.overflow = '';
    });
  }

  formEl.addEventListener('click', (e) => {
    if (e.target === formEl) {
      formEl.classList.remove('show');
      document.body.style.overflow = '';
    }
  });

  if (scoreInput && scoreValue) {
    scoreInput.addEventListener('input', () => {
      scoreValue.textContent = scoreInput.value;
    });
  }

  if (tagsContainer) {
    tagsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('emotion-tag')) {
        e.target.classList.toggle('active');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('checkin-name').value.trim();
      const text = document.getElementById('checkin-text').value.trim();
      const score = parseInt(document.getElementById('checkin-score').value, 10);
      const selectedTags = Array.from(document.querySelectorAll('#checkin-tags .emotion-tag.active')).map(el => el.dataset.tag);

      if (!name || !text) return;

      const position = checkinDraft || getCurrentPosition();
      const city = getCityByCoords(position.lat, position.lng);

      // 调用 AI 分析
      let emotion = selectedTags[0] || '归属感缺失';
      let analysis = '';
      try {
        const aiResult = await analyzeEmotion(text);
        emotion = aiResult.type || emotion;
        analysis = aiResult.analysis || '';
        if (aiResult.tags && aiResult.tags.length && !selectedTags.length) {
          selectedTags.push(...aiResult.tags.slice(0, 3));
        }
      } catch (err) {
        console.warn('AI 分析失败，使用默认标签', err);
      }

      const newCheckin = addCheckin({
        lat: position.lat,
        lng: position.lng,
        name,
        city,
        score,
        text,
        emotion,
        tags: selectedTags.length ? selectedTags : [emotion],
        analysis
      });

      formEl.classList.remove('show');
      document.body.style.overflow = '';
      form.reset();
      if (scoreValue) scoreValue.textContent = '50';
      document.querySelectorAll('#checkin-tags .emotion-tag.active').forEach(el => el.classList.remove('active'));

      refreshMarkers();
      selectCheckin(newCheckin);
      renderProfile(newCheckin);
    });
  }
}

export function openCheckinForm(lat, lng) {
  checkinDraft = { lat, lng };
  const formEl = document.getElementById('checkin-form-modal');
  if (formEl) {
    formEl.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

/* ========== AI 演示交互 ========== */
function initDemo() {
  const demoInput = document.getElementById('demo-input');
  const demoBtn = document.getElementById('demo-btn');
  const demoResult = document.getElementById('demo-result');
  const resultType = document.getElementById('result-type');
  const resultAnalysis = document.getElementById('result-analysis');
  const resultSuggestion = document.getElementById('result-suggestion');
  const suggestionChips = document.getElementById('suggestion-chips');

  if (!demoBtn) return;

  function typeWriter(element, text, speed = 40) {
    element.classList.add('typing');
    element.textContent = '';
    let i = 0;
    return new Promise(resolve => {
      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          element.classList.remove('typing');
          resolve();
        }
      }
      type();
    });
  }

  demoBtn.addEventListener('click', async () => {
    const input = demoInput.value.trim();
    if (!input) {
      demoInput.style.borderColor = 'var(--danger)';
      setTimeout(() => demoInput.style.borderColor = '', 1000);
      return;
    }

    demoBtn.disabled = true;
    demoBtn.textContent = '分析中...';
    demoResult.classList.remove('show');

    const response = await analyzeEmotion(input);

    demoResult.classList.add('show');
    demoBtn.disabled = false;
    demoBtn.textContent = '分析情绪';

    await typeWriter(resultType, response.type, 35);
    await typeWriter(resultAnalysis, response.analysis, 28);
    await typeWriter(resultSuggestion, response.suggestion, 28);

    if (response.chips && response.chips.length) {
      suggestionChips.innerHTML = response.chips.map(chip => `<span class="suggestion-chip">${chip}</span>`).join('');
    }
  });

  demoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') demoBtn.click();
  });
}

/* ========== 聊天功能 ========== */
function initChat() {
  bindChatTriggers();
}

function bindChatTriggers() {
  const chatModal = document.getElementById('chat-modal');
  const chatClose = document.getElementById('chat-close');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatMessages = document.getElementById('chat-messages');
  const chatUsername = document.getElementById('chat-username');
  const chatAvatar = document.getElementById('chat-avatar');
  const voiceBtn = document.getElementById('voice-btn');
  const voiceIndicator = document.getElementById('voice-indicator');

  if (!chatModal) return;

  let voiceCallActive = false;

  function openChat(userName, userAvatar) {
    chatUsername.textContent = userName;
    chatAvatar.textContent = userAvatar;
    chatModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    chatMessages.innerHTML = `<div class="chat-msg received">你好，我也在这个位置附近。今晚的风有点凉。</div>`;
  }

  function closeChat() {
    chatModal.classList.remove('show');
    document.body.style.overflow = '';
    voiceIndicator.classList.remove('show');
    voiceCallActive = false;
    if (voiceBtn) {
      voiceBtn.style.color = '';
      voiceBtn.style.borderColor = '';
    }
  }

  if (chatClose) chatClose.addEventListener('click', closeChat);
  chatModal.addEventListener('click', (e) => {
    if (e.target === chatModal) closeChat();
  });

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg sent';
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.value = '';

    setTimeout(() => {
      const replies = [
        '嗯，我懂这种感觉。有时候陌生人的理解反而更让人安心。',
        '我也在这个城市待了三年了，有时候还是会觉得陌生。',
        '谢谢你愿意说这些。在这个点还能遇到说话的人，挺难得的。',
        '是啊，城市的夜晚总是让人想很多。你平时怎么排解这种感觉？'
      ];
      const replyDiv = document.createElement('div');
      replyDiv.className = 'chat-msg received';
      replyDiv.textContent = replies[Math.floor(Math.random() * replies.length)];
      chatMessages.appendChild(replyDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1800 + Math.random() * 2200);
  }

  if (chatSend) chatSend.addEventListener('click', sendMessage);
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      if (!voiceCallActive) {
        voiceCallActive = true;
        voiceIndicator.classList.add('show');
        voiceBtn.style.color = 'var(--danger)';
        voiceBtn.style.borderColor = 'var(--danger)';

        setTimeout(() => {
          if (voiceCallActive) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-msg received';
            msgDiv.textContent = '[语音消息] "能听到吗？其实我不太擅长打字，但听到你的声音感觉没那么孤单了。"';
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        }, 3500);
      } else {
        voiceCallActive = false;
        voiceIndicator.classList.remove('show');
        voiceBtn.style.color = '';
        voiceBtn.style.borderColor = '';
      }
    });
  }

  document.querySelectorAll('.chat-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const userEl = btn.closest('.nearby-user');
      if (!userEl) return;
      const name = userEl.dataset.name;
      const avatar = userEl.querySelector('.nearby-avatar').textContent;
      openChat(name, avatar);
    });
  });

  document.querySelectorAll('.voice-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const userEl = btn.closest('.nearby-user');
      if (!userEl) return;
      const name = userEl.dataset.name;
      const avatar = userEl.querySelector('.nearby-avatar').textContent;
      openChat(name, avatar);
      setTimeout(() => voiceBtn && voiceBtn.click(), 600);
    });
  });
}

/* ========== 小纸条功能 ========== */
function initNotes() {
  const noteInput = document.getElementById('note-input');
  const noteSubmit = document.getElementById('note-submit');
  const notesWall = document.getElementById('notes-wall');

  if (!notesWall) return;

  seedNotesIfEmpty();

  function renderNotes() {
    const notes = getNotes();
    notesWall.innerHTML = notes.map(note => `
      <div class="note-card">
        <div class="note-text">"${note.text}"</div>
        <div class="note-meta">${note.meta}</div>
      </div>
    `).join('');
  }

  renderNotes();

  if (noteSubmit) {
    noteSubmit.addEventListener('click', () => {
      const text = noteInput.value.trim();
      if (!text) {
        noteInput.style.borderColor = 'var(--danger)';
        setTimeout(() => noteInput.style.borderColor = '', 1000);
        return;
      }

      addNote(text);
      renderNotes();
      noteInput.value = '';
    });
  }

  if (noteInput) {
    noteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') noteSubmit.click();
    });
  }
}

/* ========== 平滑滚动 ========== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
