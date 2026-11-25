(function (global) {
  function normFieldKey(s) {
    return String(s || '').toLowerCase().replace(/^max\.?\s*/, '').replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
  }

  var FILE_ITEMS = [];
  var EXTRA = { added: [], extraAliases: {}, droppedKeys: [] };
  var ALIAS_TO_CANON = {};

  var CAT_ORDER = ['成像', '镜头', '云台', '夜视能力', '智能能力', '音频', '网络', '存储', '电源', '结构', '环境', '认证', '商务'];
  var ROLLUP = {
    'ai检测': 1, 'aidection': 1, '智能检测': 1, 'aidetection': 1, 'aidetect': 1,
    'smartdetection': 1, 'intelligencedetection': 1, 'intelligentdetection': 1,
    'nightvision': 1, '夜视': 1, 'night': 1,
    'illuminationdistance': 1, 'illuminationrange': 1, '补光距离': 1, '照射距离': 1,
    'generalfunction': 1, 'generalfunctions': 1, '基本功能': 1, '通用功能': 1
  };

  var STATIC_NOISE_KEYS = [
    'Key Points', 'Highlights', 'Selling Points', 'Announcement', 'Sales Enquiry',
    'Datasheet', 'Download', 'Download as PDF', 'FAQs', 'FAQ', 'Home', 'Homepage',
    'Products', 'Trust Center', 'Favourite', 'Favorite', 'Reject', 'Accept',
    'Reset', 'Compare', 'Reviews', 'Review', 'Blog', 'Gallery', 'Quick Tips',
    'Back To Previous Site', 'Previous Version', 'Support Center', 'Wireless Products',
    'Dahua Partner APP', 'Dahua Partner App', 'Training', 'Partners', 'About Dahua',
    'News Blogs Events', 'Sustainability', 'Newsletter Subscription', 'Terms of Use',
    'Privacy Compliance', 'Trademark Compliance', 'Payment Methods', 'Track Your Order',
    'Report An Issue', 'COMPANY', 'Press & Media', 'Affiliate Program', 'Referral Program',
    '#ReolinkinAction', 'Be Prepared, Be Ahead', 'View All', 'City Solutions',
    'SMB Solutions', 'Enterprise Solutions', 'Video Intercoms', 'Alarms',
    'Developer Community', 'Distribution Partner Portal', 'Brand Introduction',
    'Success Case', 'Career', 'Current Selection', 'Accessories', 'Comparison',
    'System Requirements', 'Management Software', 'Mobile Client',
    'Tapo Home Mode and Away Mode', 'Up to 4 products', 'Indoor Cameras',
    'About Us', 'Contact Us', 'Partner Program', 'ECO Partner Community',
    'Service & Support', 'Solutions', 'Access Control & Time Attendance',
    'Interactive Whiteboards', 'Warranty & Return', 'Purchase FAQs', 'CCTV',
    'Tools', 'Connect with EZVIZ', 'EZVIZ Green', 'Video Doorbells',
    'Shop Refurbished', '16MP Security Cameras', 'Dual-Lens Security Cameras',
    'WiFi Security Cameras', 'Battery Cameras', 'PoE IP Cameras',
    'Security Camera Systems', 'Yes', 'No'
  ];
  var STATIC_NOISE_NORM = {};
  STATIC_NOISE_KEYS.forEach(function (k) {
    STATIC_NOISE_NORM[normFieldKey(k)] = 1;
  });

  var NOISE_PHRASE = /what they are|how to set them up|new look|new appearance|complete vigilance|no strings attached|picture-perfect|hands-free control|set-and-forget|stay powered|stays focused|install it easily|unlock full control|capture every moment|never miss|hot deals|terms of use|privacy policy|all rights reserved|we do our best|we respect your home|ensures complete|as bright as day|coordinated fixed lens|keeps activity front|how to link your|全新外观|全新设计|全方位守护/i;
  var SPEC_TOKEN = /\d+\s*(?:mm|m|cm|ft|°|deg|fps|w|gb|tb|mah|ghz|mhz|lux|kbps|mbps|vdc|vac|poe|db|px)|\b(?:h:|v:|d:|pan|tilt|stream|bitrate|resolution|ip\d{2}|ieee|onvif|rtsp|cmos|micro-?sd|rj-?45|f\/?\d)/i;

  var FALLBACK = [
    { id: 'pixels', name: '像素', aliases: ['分辨率', 'resolution', 'max. resolution'], unit: '', dataType: 'text', category: '成像' },
    { id: 'human_det', name: '人形检测', aliases: ['human detection', 'person detection', '人形'], unit: '', dataType: 'flag', category: '智能能力' },
    { id: 'pet_det', name: '宠物检测', aliases: ['pet detection', '宠物'], unit: '', dataType: 'flag', category: '智能能力' },
    { id: 'tamper_det', name: '遮挡检测', aliases: ['tamper', 'occlusion', '遮挡'], unit: '', dataType: 'flag', category: '智能能力' },
    { id: 'crying_det', name: '哭声检测', aliases: ['crying', '哭声'], unit: '', dataType: 'flag', category: '智能能力' },
    { id: 'motion_det', name: '移动侦测', aliases: ['motion detection', '移动', '移动侦测'], unit: '', dataType: 'flag', category: '智能能力' },
    { id: 'anti_flicker', name: '抗闪烁', aliases: ['anti-flicker', 'anti flicker', 'antiflicker', '防闪烁'], unit: '', dataType: 'flag', category: '成像' },
    { id: 'region', name: '区域检测', aliases: ['侦测区域', 'activity zones', 'roi', 'detection zone'], unit: '', dataType: 'flag', category: '智能能力' },
    { id: 'other_func', name: '其他功能', aliases: ['other features'], unit: '', dataType: 'text', category: '成像' },
    { id: 'ir_dist', name: '红外距离', aliases: ['ir distance', 'ir range'], unit: 'm', dataType: 'text', category: '夜视能力' },
    { id: 'color_night', name: '彩色夜视', aliases: ['color night vision', '彩色夜视'], unit: '', dataType: 'text', category: '夜视能力' },
    { id: 'price', name: '价格', aliases: ['price', '售价'], unit: '', dataType: 'text', category: '商务' },
    { id: 'wifi', name: 'Wi-Fi', aliases: ['wifi', 'wi-fi', '无线'], unit: '', dataType: 'text', category: '网络' },
    { id: 'ptz', name: '云台角度', aliases: ['云台', 'ptz', 'angle adjustment'], unit: '°', dataType: 'text', category: '云台' },
    { id: 'power', name: '供电', aliases: ['power', '电源', 'power supply'], unit: '', dataType: 'text', category: '电源' },
    { id: 'storage', name: '存储', aliases: ['storage', '储存'], unit: '', dataType: 'text', category: '存储' }
  ];

  function allItems() {
    return FILE_ITEMS.concat(EXTRA.added || []);
  }

  function rebuildAliasIndex() {
    ALIAS_TO_CANON = {};
    allItems().forEach(function (item) {
      if (!item || !item.name) return;
      if (ROLLUP[normFieldKey(item.name)] || item.name === 'AI检测' || item.name === '夜视') return;
      ALIAS_TO_CANON[normFieldKey(item.name)] = item.name;
      (item.aliases || []).forEach(function (a) {
        const k = normFieldKey(a);
        if (k) ALIAS_TO_CANON[k] = item.name;
      });
    });
    Object.keys(EXTRA.extraAliases || {}).forEach(function (name) {
      if (ROLLUP[normFieldKey(name)] || name === 'AI检测' || name === '夜视') return;
      (EXTRA.extraAliases[name] || []).forEach(function (a) {
        const k = normFieldKey(a);
        if (k && !ROLLUP[k]) ALIAS_TO_CANON[k] = name;
      });
    });
  }

  function applyFile(data) {
    FILE_ITEMS = (data && data.parameters && data.parameters.length) ? data.parameters : FALLBACK.slice();
    if (data && data.categoryOrder && data.categoryOrder.length) CAT_ORDER = data.categoryOrder.slice();
    rebuildAliasIndex();
  }

  function fieldCategory(name) {
    const item = findItemByName(name);
    return (item && item.category) || '其他';
  }

  function isRollupKey(name) {
    return !!ROLLUP[normFieldKey(name)];
  }

  function categoryOrder() {
    return CAT_ORDER.slice();
  }

  function applyExtras(extra) {
    EXTRA = extra && typeof extra === 'object' ? extra : { added: [], extraAliases: {}, droppedKeys: [] };
    if (!Array.isArray(EXTRA.added)) EXTRA.added = [];
    if (!EXTRA.extraAliases || typeof EXTRA.extraAliases !== 'object') EXTRA.extraAliases = {};
    if (!Array.isArray(EXTRA.droppedKeys)) EXTRA.droppedKeys = [];
    rebuildAliasIndex();
  }

  function canonicalFieldName(name) {
    const n = normFieldKey(name);
    return ALIAS_TO_CANON[n] || String(name || '').trim();
  }

  function isMappedKey(name) {
    const n = normFieldKey(name);
    if (ROLLUP[n] || isRollupKey(name)) return true;
    return !!ALIAS_TO_CANON[n];
  }

  function isFlagField(name) {
    const item = findItemByName(name);
    return !!(item && item.dataType === 'flag');
  }

  function alignItems() {
    return allItems().filter(function (it) { return it && it.name && !isRollupKey(it.name) && it.role !== 'rollup'; });
  }

  function isStaticNoiseKey(name) {
    return !!STATIC_NOISE_NORM[normFieldKey(name)];
  }

  function isDroppedKey(name) {
    const n = normFieldKey(name);
    if (STATIC_NOISE_NORM[n]) return true;
    return (EXTRA.droppedKeys || []).some(function (k) { return normFieldKey(k) === n; });
  }

  function isNoiseKey(name) {
    const k = String(name || '').trim();
    if (!k) return true;
    if (isDroppedKey(k)) return true;
    if (/©|copyright|all rights reserved|terms of use|privacy policy/i.test(k)) return true;
    if (/^https?:\/\//i.test(k)) return true;
    if (/[?？]$/.test(k) || /^(what|how|why|when|where|can|is|are|does|do)\b.+\?$/i.test(k)) return true;
    if (/\b(security cameras?|video doorbells?|shop refurbished|download as pdf|quick tips)\b/i.test(k)) return true;
    if (NOISE_PHRASE.test(k)) return true;
    if (SPEC_TOKEN.test(k)) return false;
    const words = k.match(/[A-Za-z\u4e00-\u9fff]+/g) || [];
    if (words.length >= 8) return true;
    if (words.length >= 5 && /[,.，、!]/.test(k) && !/\d/.test(k)) return true;
    if (/^(stay|stays|install|unlock|capture|experience|introduce|finding|connect with|keeps|hear)\b/i.test(k) && words.length >= 4) return true;
    return false;
  }

  function isNoiseValue(val) {
    const v = String(val == null ? '' : val).trim();
    if (!v || v === '/' || v === '|' || v === '｜' || v === '-') return true;
    if (NOISE_PHRASE.test(v)) return true;
    if (/©|terms of use|privacy policy|all rights reserved/i.test(v)) return true;
    if (/^https?:\/\//i.test(v) && !SPEC_TOKEN.test(v)) return true;
    const words = v.match(/[A-Za-z\u4e00-\u9fff]+/g) || [];
    if (words.length >= 14 && /[.!?]/.test(v) && !SPEC_TOKEN.test(v)) return true;
    return false;
  }

  function isNoisePair(key, val) {
    return isNoiseKey(key) || isNoiseValue(val);
  }

  function dropKey(name) {
    name = String(name || '').trim();
    if (!name) return false;
    if (!Array.isArray(EXTRA.droppedKeys)) EXTRA.droppedKeys = [];
    if (!isDroppedKey(name)) EXTRA.droppedKeys.push(name);
    return true;
  }

  function undropKey(name) {
    const n = normFieldKey(name);
    EXTRA.droppedKeys = (EXTRA.droppedKeys || []).filter(function (k) { return normFieldKey(k) !== n; });
  }

  function findItemByName(name) {
    const canon = canonicalFieldName(name);
    return allItems().find(function (it) { return it.name === canon; }) || null;
  }

  function addAlias(canonName, alias) {
    alias = String(alias || '').trim();
    canonName = String(canonName || '').trim();
    if (!alias || !canonName) return false;
    if (!EXTRA.extraAliases[canonName]) EXTRA.extraAliases[canonName] = [];
    if (EXTRA.extraAliases[canonName].indexOf(alias) !== -1) return false;
    EXTRA.extraAliases[canonName].push(alias);
    rebuildAliasIndex();
    return true;
  }

  function addEntry(item) {
    if (!item || !item.name) return false;
    const exist = allItems().find(function (it) { return normFieldKey(it.name) === normFieldKey(item.name); });
    if (exist) {
      (item.aliases || []).forEach(function (a) { addAlias(exist.name, a); });
      return exist;
    }
    const row = {
      id: item.id || ('custom_' + Date.now()),
      name: String(item.name).trim(),
      aliases: (item.aliases || []).slice(),
      unit: item.unit || '',
      dataType: item.dataType || (/检测|侦测|跟踪|^PIR$/i.test(item.name) ? 'flag' : 'text'),
      category: item.category || '未分类'
    };
    EXTRA.added.push(row);
    rebuildAliasIndex();
    return row;
  }

  function suggestCanon(name, minScore) {
    const n = normFieldKey(name);
    if (!n || n.length < 2) return '';
    const stripped = n.replace(/(detection|detect|侦测|检测)$/i, '');
    let best = '';
    let bestScore = 0;
    alignItems().forEach(function (it) {
      const names = [it.name].concat(it.aliases || []);
      names.forEach(function (label) {
        const f = normFieldKey(label);
        if (!f) return;
        const fs = f.replace(/(detection|detect|侦测|检测)$/i, '');
        let score = 0;
        if (f === n) score = 100;
        else if (fs && fs === stripped && fs.length >= 2) score = 90;
        else if (n.length >= 5 && f.length >= 5 && (n.indexOf(f) >= 0 || f.indexOf(n) >= 0)) score = Math.min(n.length, f.length);
        else if (stripped.length >= 4 && fs.length >= 4 && (stripped.indexOf(fs) >= 0 || fs.indexOf(stripped) >= 0)) score = Math.min(stripped.length, fs.length);
        if (score > bestScore) { bestScore = score; best = it.name; }
      });
    });
    return bestScore >= (minScore == null ? 3 : minScore) ? best : '';
  }

  applyFile({ parameters: FALLBACK });

  global.Ontology = {
    normFieldKey: normFieldKey,
    canonicalFieldName: canonicalFieldName,
    isMappedKey: isMappedKey,
    applyFile: applyFile,
    applyExtras: applyExtras,
    addAlias: addAlias,
    addEntry: addEntry,
    rebuildAliasIndex: rebuildAliasIndex,
    allItems: allItems,
    findItemByName: findItemByName,
    suggestCanon: suggestCanon,
    isDroppedKey: isDroppedKey,
    isStaticNoiseKey: isStaticNoiseKey,
    isNoiseKey: isNoiseKey,
    isNoiseValue: isNoiseValue,
    isNoisePair: isNoisePair,
    dropKey: dropKey,
    undropKey: undropKey,
    getExtras: function () { return EXTRA; },
    fieldCategory: fieldCategory,
    isRollupKey: isRollupKey,
    isFlagField: isFlagField,
    alignItems: alignItems,
    categoryOrder: categoryOrder,
    FALLBACK: FALLBACK
  };
})(typeof window !== 'undefined' ? window : globalThis);
