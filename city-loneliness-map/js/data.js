const NOTES_KEY = 'clm_notes';
const CHECKINS_KEY = 'clm_checkins';
const PROFILE_KEY = 'clm_profile';

// 内存降级：当 localStorage 被禁用时使用内存存储
const memoryStorage = {};
let storageEnabled = null;

function isStorageAvailable() {
  if (storageEnabled !== null) return storageEnabled;
  try {
    const testKey = '__clm_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    storageEnabled = true;
    return true;
  } catch (e) {
    storageEnabled = false;
    console.warn('localStorage 不可用，已降级为内存存储');
    return false;
  }
}

function storageGet(key) {
  if (isStorageAvailable()) {
    return localStorage.getItem(key);
  }
  return memoryStorage[key] || null;
}

function storageSet(key, value) {
  if (isStorageAvailable()) {
    localStorage.setItem(key, value);
  } else {
    memoryStorage[key] = value;
  }
}

function storageRemove(key) {
  if (isStorageAvailable()) {
    localStorage.removeItem(key);
  } else {
    delete memoryStorage[key];
  }
}

export const EMOTION_TYPES = {
  '归属感缺失': { color: '#7a9cc6', label: '归属感缺失' },
  '人群中的孤独': { color: '#9db3c9', label: '人群中的孤独' },
  '时间焦虑': { color: '#c4a77d', label: '时间焦虑' },
  '漂泊感': { color: '#6b8cae', label: '漂泊感' },
  '深夜孤独': { color: '#4a5d7a', label: '深夜孤独' },
  '消费慰藉': { color: '#c97b7b', label: '消费慰藉' },
  '温暖渴望': { color: '#7fb89f', label: '温暖渴望' },
  '高处孤独': { color: '#8a7cc6', label: '高处孤独' },
  '城市疏离': { color: '#5d6b7f', label: '城市疏离' },
  '回忆触发': { color: '#a78b7b', label: '回忆触发' },
  '午后孤独': { color: '#7a9cc6', label: '午后孤独' },
  '时间空白': { color: '#9db3c9', label: '时间空白' },
  '独处需求': { color: '#6b8cae', label: '独处需求' },
  '居住孤独': { color: '#4a5d7a', label: '居住孤独' },
  '空间压抑': { color: '#c97b7b', label: '空间压抑' },
  '社交回避': { color: '#8a7cc6', label: '社交回避' },
  '深夜情绪': { color: '#5d6b7f', label: '深夜情绪' }
};

const seedNotes = [
  { text: '如果你也在这个地铁站感到孤独，请记住：这座城市里至少有 127 个人和你一样。', meta: '2026.06.28 · 匿名' },
  { text: '我在长椅第三根木条的缝隙里藏了一颗糖，找到它的人，今天会甜一点。', meta: '2026.06.27 · 匿名' },
  { text: '不要难过，末班车之后还有出租车，出租车之后还有走路回家的勇气。', meta: '2026.06.26 · 匿名' },
  { text: '如果你看到这个纸条，说明我们曾在同一时间出现在同一空间，这算不算是另一种相遇？', meta: '2026.06.25 · 匿名' }
];

// 种子数据：覆盖多个城市的情绪标记
const seedCheckins = [
  // 上海
  {
    id: 'subway-sh',
    lat: 31.2304,
    lng: 121.4737,
    name: '末班地铁站',
    city: '上海市',
    score: 87,
    tags: ['归属感缺失', '人群中的孤独', '时间焦虑', '漂泊感'],
    text: '我在末班地铁上，突然觉得这座城市很大，但没有一个地方真正属于我。',
    messages: [
      { text: '"我在末班地铁上，突然觉得这座城市很大，但没有一个地方真正属于我。"', tag: '#归属感缺失', time: '2小时前' },
      { text: '"车厢里只剩下我和一个打瞌睡的保安，我们像两个被城市遗忘的标点符号。"', tag: '#人群中的孤独', time: '5小时前' },
      { text: '"每次坐末班车都会想，这个点还在路上的人，是不是都和我一样无处可去。"', tag: '#漂泊感', time: '昨天' }
    ],
    analysis: '该地点的高频情绪为「归属感缺失」与「漂泊感」。用户多在工作日晚间 22:00-24:00 标记，伴随强烈的「边缘人」叙事。'
  },
  {
    id: 'store-sh',
    lat: 31.2356,
    lng: 121.4689,
    name: '深夜便利店',
    city: '上海市',
    score: 72,
    tags: ['深夜孤独', '消费慰藉', '短暂停留', '温暖渴望'],
    text: '凌晨两点的便利店，关东煮的热气是我今天感受到的唯一温度。',
    messages: [
      { text: '"凌晨两点的便利店，关东煮的热气是我今天感受到的唯一温度。"', tag: '#温暖渴望', time: '1小时前' },
      { text: '"我买了一份便当，却不想回那个没有人的房间吃。"', tag: '#深夜孤独', time: '3小时前' },
      { text: "'店员说欢迎光临的时候，我突然有点想哭。'", tag: '#消费慰藉', time: '昨天' }
    ],
    analysis: '深夜便利店的孤独带有强烈的「温度隐喻」——用户通过食物、灯光、店员问候寻求替代性温暖。'
  },
  {
    id: 'rooftop-sh',
    lat: 31.2250,
    lng: 121.4800,
    name: '老城区天台',
    city: '上海市',
    score: 65,
    tags: ['高处孤独', '回忆触发', '城市疏离', '静默观察'],
    text: '站在天台上看这座城市，灯火通明，却没有一盏是为我留的。',
    messages: [
      { text: '"站在天台上看这座城市，灯火通明，却没有一盏是为我留的。"', tag: '#城市疏离', time: '4小时前' },
      { text: '"风很大，但我不想下去。这里至少没人问我怎么了。"', tag: '#高处孤独', time: '昨天' },
      { text: '"小时候觉得天台是离天空最近的地方，现在觉得它是离人群最远的地方。"', tag: '#回忆触发', time: '2天前' }
    ],
    analysis: '天台场景呈现典型的「高度孤独」——物理高度与心理疏离感形成互文。用户倾向于选择「可控的孤独」。'
  },
  {
    id: 'park-sh',
    lat: 31.2280,
    lng: 121.4620,
    name: '公园长椅',
    city: '上海市',
    score: 78,
    tags: ['午后孤独', '时间空白', '自然缺失', '独处需求'],
    text: '下午三点的公园，周围都是老人和小孩，我是唯一一个没有去处的中年人。',
    messages: [
      { text: '"下午三点的公园，周围都是老人和小孩，我是唯一一个没有去处的中年人。"', tag: '#时间空白', time: '2小时前' },
      { text: '"我在长椅上坐了一下午，看鸽子比看人有意思多了。"', tag: '#独处需求', time: '6小时前' },
      { text: '"阳光很好，但我只想找个没人的地方待着。"', tag: '#午后孤独', time: '昨天' }
    ],
    analysis: '公园长椅的孤独多发生在「非工作时段」，用户呈现明显的「时间冗余焦虑」。'
  },
  {
    id: 'rental-sh',
    lat: 31.2400,
    lng: 121.4550,
    name: '出租小屋',
    city: '上海市',
    score: 92,
    tags: ['居住孤独', '空间压抑', '社交回避', '深夜情绪'],
    text: '房间里只有冰箱的嗡嗡声在回应我。',
    messages: [
      { text: '"房间里只有冰箱的嗡嗡声在回应我。"', tag: '#居住孤独', time: '30分钟前' },
      { text: '"我换了密码锁，不是因为安全，是因为根本不会有人来。"', tag: '#社交回避', time: '2小时前' },
      { text: '"凌晨醒来，分不清是房子太小了，还是世界太大了。"', tag: '#空间压抑', time: '昨天' }
    ],
    analysis: '出租小屋是孤独指数最高的场景（92/100），呈现「空间性孤独」的典型特征。'
  },
  // 北京
  {
    id: 'subway-bj',
    lat: 39.9042,
    lng: 116.4074,
    name: '国贸地铁站',
    city: '北京市',
    score: 81,
    tags: ['人群中的孤独', '时间焦虑', '漂泊感'],
    text: '早高峰的国贸，我和几百万人一起挤地铁，却没人认识我。',
    messages: [
      { text: '"早高峰的国贸，我和几百万人一起挤地铁，却没人认识我。"', tag: '#人群中的孤独', time: '1小时前' },
      { text: '"西装革履的人群像一条沉默的河流，我也是其中一滴。"', tag: '#漂泊感', time: '3小时前' }
    ],
    analysis: '国贸地铁站的孤独属于「人群中的孤独」——高密度人流反而强化了「匿名感」。'
  },
  {
    id: 'park-bj',
    lat: 39.9289,
    lng: 116.3883,
    name: '北海公园长椅',
    city: '北京市',
    score: 70,
    tags: ['午后孤独', '回忆触发', '独处需求'],
    text: '湖面很平静，但我的心里一直刮风。',
    messages: [
      { text: '"湖面很平静，但我的心里一直刮风。"', tag: '#独处需求', time: '2小时前' },
      { text: '"小时候来过这里，现在只有影子陪我。"', tag: '#回忆触发', time: '昨天' }
    ],
    analysis: '北海公园的孤独常与「时间流逝」相关，用户在熟悉场景中感受到自我变化。'
  },
  // 广州
  {
    id: 'store-gz',
    lat: 23.1291,
    lng: 113.2644,
    name: '珠江新城便利店',
    city: '广州市',
    score: 76,
    tags: ['深夜孤独', '温暖渴望', '消费慰藉'],
    text: '凌晨一点的广州，便利店是我唯一不敢回的家。',
    messages: [
      { text: '"凌晨一点的广州，便利店是我唯一不敢回的家。"', tag: '#深夜孤独', time: '30分钟前' },
      { text: '"店员递给我一杯热豆浆，我突然觉得很贵。"', tag: '#温暖渴望', time: '2小时前' }
    ],
    analysis: '广州深夜便利店用户多因「加班后空窗期」产生孤独，对微小温暖高度敏感。'
  },
  {
    id: 'river-gz',
    lat: 23.1086,
    lng: 113.3245,
    name: '珠江边步道',
    city: '广州市',
    score: 68,
    tags: ['城市疏离', '独处需求', '深夜情绪'],
    text: '江风把城市的噪音吹远了，也把我的心事吹远了。',
    messages: [
      { text: '"江风把城市的噪音吹远了，也把我的心事吹远了。"', tag: '#城市疏离', time: '1小时前' }
    ],
    analysis: '珠江边步道的孤独带有「治愈性独处」倾向，用户在自然与城市的边界寻找平静。'
  },
  // 深圳
  {
    id: 'rental-sz',
    lat: 22.5431,
    lng: 114.0579,
    name: '科技园出租房',
    city: '深圳市',
    score: 88,
    tags: ['居住孤独', '深夜情绪', '社交回避'],
    text: '加班回到出租屋，连回音都没有。',
    messages: [
      { text: '"加班回到出租屋，连回音都没有。"', tag: '#居住孤独', time: '20分钟前' },
      { text: '"窗外是南山的灯火，窗内是我的沉默。"', tag: '#深夜情绪', time: '1小时前' }
    ],
    analysis: '深圳科技园区域呈现「工作-居住」边界模糊的孤独，用户将工作疲惫与居住空间混为一体。'
  },
  {
    id: 'coast-sz',
    lat: 22.5284,
    lng: 114.0579,
    name: '深圳湾公园',
    city: '深圳市',
    score: 62,
    tags: ['午后孤独', '独处需求', '时间空白'],
    text: '海边人很多，但我只看海鸥。',
    messages: [
      { text: '"海边人很多，但我只看海鸥。"', tag: '#独处需求', time: '3小时前' }
    ],
    analysis: '深圳湾公园的孤独多为轻度「选择性独处」，用户在人群中主动保持距离。'
  },
  // 成都
  {
    id: 'teahouse-cd',
    lat: 30.6586,
    lng: 104.0648,
    name: '人民公园茶座',
    city: '成都市',
    score: 58,
    tags: ['午后孤独', '时间空白', '独处需求'],
    text: '周围都在摆龙门阵，我一个人喝完了一杯盖碗茶。',
    messages: [
      { text: '"周围都在摆龙门阵，我一个人喝完了一杯盖碗茶。"', tag: '#时间空白', time: '4小时前' }
    ],
    analysis: '成都茶座的孤独表现为「热闹中的旁观」，用户在集体休闲氛围中感到轻微疏离。'
  },
  {
    id: 'bridge-cd',
    lat: 30.6669,
    lng: 104.0633,
    name: '九眼桥边',
    city: '成都市',
    score: 74,
    tags: ['深夜孤独', '城市疏离', '漂泊感'],
    text: '酒吧街很吵，我站在桥上看水。',
    messages: [
      { text: '"酒吧街很吵，我站在桥上看水。"', tag: '#城市疏离', time: '1小时前' }
    ],
    analysis: '九眼桥区域的孤独带有「喧嚣对比」特征，用户在热闹场景中反而更清晰地感知孤独。'
  }
];

export const seedData = seedCheckins;

export function getCheckins() {
  try {
    const stored = storageGet(CHECKINS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('读取本地标记失败', e);
  }
  return [...seedCheckins];
}

export function saveCheckins(checkins) {
  try {
    storageSet(CHECKINS_KEY, JSON.stringify(checkins));
  } catch (e) {
    console.warn('保存标记失败', e);
  }
}

export function addCheckin(checkin) {
  const checkins = getCheckins();
  const newCheckin = {
    id: checkin.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    lat: checkin.lat,
    lng: checkin.lng,
    name: checkin.name || '未命名地点',
    city: checkin.city || '未知城市',
    score: checkin.score || 50,
    tags: checkin.tags || [],
    text: checkin.text || '',
    emotion: checkin.emotion || (checkin.tags && checkin.tags[0]) || '归属感缺失',
    messages: checkin.messages || [],
    analysis: checkin.analysis || '',
    createdAt: checkin.createdAt || new Date().toISOString()
  };
  checkins.unshift(newCheckin);
  saveCheckins(checkins);
  updateUserProfile();
  return newCheckin;
}

export function resetData() {
  try {
    storageRemove(CHECKINS_KEY);
    storageRemove(NOTES_KEY);
    storageRemove(PROFILE_KEY);
  } catch (e) {
    console.warn('重置数据失败', e);
  }
}

export function updateUserProfile() {
  try {
    const checkins = getCheckins();
    const userCheckins = checkins.filter(c => c.id && c.id.startsWith('user_'));
    const emotionCount = {};
    let totalScore = 0;
    userCheckins.forEach(c => {
      const emotion = c.emotion || (c.tags && c.tags[0]) || '未分类';
      emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
      totalScore += Number(c.score) || 0;
    });
    const frequentEmotions = Object.entries(emotionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion]) => emotion);

    const profile = {
      totalCheckins: userCheckins.length,
      averageScore: userCheckins.length ? Math.round(totalScore / userCheckins.length) : 0,
      frequentEmotions,
      joinedAt: storageGet(PROFILE_KEY) ? JSON.parse(storageGet(PROFILE_KEY)).joinedAt : new Date().toISOString()
    };
    storageSet(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  } catch (e) {
    console.warn('更新用户档案失败', e);
    return { totalCheckins: 0, averageScore: 0, frequentEmotions: [] };
  }
}

export function getUserProfile() {
  try {
    const stored = storageGet(PROFILE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('读取用户档案失败', e);
  }
  return updateUserProfile();
}

export function getNotes() {
  try {
    const stored = storageGet(NOTES_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('读取本地纸条失败', e);
  }
  return [...seedNotes];
}

export function saveNotes(notes) {
  try {
    storageSet(NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn('保存纸条失败', e);
  }
}

export function addNote(text) {
  const notes = getNotes();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  notes.unshift({ text, meta: `${today} · 匿名` });
  saveNotes(notes);
  return notes;
}

export function seedNotesIfEmpty() {
  try {
    if (!storageGet(NOTES_KEY)) {
      saveNotes(seedNotes);
    }
  } catch (e) {
    console.warn('初始化纸条失败', e);
  }
}

export function seedCheckinsIfEmpty() {
  try {
    if (!storageGet(CHECKINS_KEY)) {
      saveCheckins(seedCheckins);
    }
  } catch (e) {
    console.warn('初始化标记失败', e);
  }
}

// 通过经纬度估算城市（简单版本，Demo 使用）
export function getCityByCoords(lat, lng) {
  const cities = [
    { name: '北京市', lat: 39.9042, lng: 116.4074, radius: 80 },
    { name: '上海市', lat: 31.2304, lng: 121.4737, radius: 80 },
    { name: '广州市', lat: 23.1291, lng: 113.2644, radius: 70 },
    { name: '深圳市', lat: 22.5431, lng: 114.0579, radius: 60 },
    { name: '成都市', lat: 30.6586, lng: 104.0648, radius: 60 }
  ];
  for (const city of cities) {
    const d = getDistance(lat, lng, city.lat, city.lng);
    if (d < city.radius) return city.name;
  }
  return '未知城市';
}

export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
