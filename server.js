const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'db.json');
const ADMIN_PASSWORD = "admin"; 
const FORCE_UPDATE = true; 

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// === 完整接口列表 ===
const DEFAULT_SITES = [
    { key: "ffzy", name: "非凡资源", api: "https://cj.ffzyapi.com/api.php/provide/vod/", active: true },
    { key: "bfzy", name: "暴风资源", api: "https://bfzyapi.com/api.php/provide/vod/", active: true },
    { key: "lzi", name: "量子资源", api: "https://cj.lziapi.com/api.php/provide/vod/", active: true },
    { key: "dbzy", name: "登博资源", api: "https://dbzyzapi.com/api.php/provide/vod/", active: true },
    { key: "kuaiche", name: "快车资源", api: "https://cj.kczyapi.com/api.php/provide/vod/", active: true },
    { key: "fszy", name: "飞速资源", api: "https://www.feisuzyapi.com/api.php/provide/vod/", active: true },
    { key: "wlzy", name: "卧龙资源", api: "https://wolongzyw.com/api.php/provide/vod/", active: true },
    { key: "ikun", name: "iKun资源", api: "https://ikunzyapi.com/api.php/provide/vod/", active: true },
    { key: "guandie", name: "光碟资源", api: "https://api.guandie.pro/api.php/provide/vod/", active: true },
    { key: "suoni", name: "索尼资源", api: "https://suoniapi.com/api.php/provide/vod/", active: true },
    { key: "haiwaizh", name: "海外资源", api: "https://haiwaikan.com/api.php/provide/vod/", active: true },
    { key: "tianyi", name: "天翼资源", api: "https://www.tianyiapi.com/api.php/provide/vod/", active: true },
    { key: "leihu", name: "雷虎资源", api: "https://www.leihuzyapi.com/api.php/provide/vod/", active: true },
    { key: "mogu", name: "蘑菇资源", api: "https://moguzuida.com/api.php/provide/vod/", active: true },
    { key: "jinying", name: "金鹰资源", api: "https://jyzyapi.com/api.php/provide/vod/", active: true },
    { key: "hengyang", name: "衡阳资源", api: "https://hyzyapi.com/api.php/provide/vod/", active: true },
    { key: "subo", name: "速播资源", api: "https://subocaiji.com/api.php/provide/vod/", active: true },
    { key: "kyzy", name: "快云资源", api: "https://kuaiyun-api.com/api.php/provide/vod/", active: true },
    { key: "18k", name: "18k资源", api: "https://www.18kzyapi.com/api.php/provide/vod/", active: true },
    { key: "gszy", name: "光速资源", api: "https://api.guangsuapi.com/api.php/provide/vod/", active: true },
    { key: "6uzy", name: "6U资源", api: "http://api.6uzy.com/api.php/provide/vod/", active: true },
    { key: "uzy", name: "U资源", api: "https://api.uzyapi.com/api.php/provide/vod/", active: true },
    { key: "m3u8zy", name: "M3U8资源", api: "https://m3u8.api.m3u8zy.com/api.php/provide/vod/", active: true },
    { key: "hnzy", name: "红牛资源", api: "https://www.hongniuzy2.com/api.php/provide/vod/", active: true },
    { key: "kuku", name: "酷酷资源", api: "https://www.kukuzy.me/api.php/provide/vod/", active: true },
    { key: "zxzj", name: "在线之家", api: "https://api.zxzj.me/api.php/provide/vod/", active: true },
    { key: "yhzy", name: "樱花资源", api: "https://m3u8.yhzyapi.com/api.php/provide/vod/", active: true },
    { key: "modu", name: "魔都资源", api: "https://www.moduapi.cc/api.php/provide/vod/", active: true },
    { key: "juzi", name: "橘子资源", api: "https://juziapi.com/api.php/provide/vod/", active: true },
    { key: "bjzy", name: "八戒资源", api: "https://api.bjzyapi.com/api.php/provide/vod/", active: true }
];

function saveDB(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getDB() { 
    try {
        if (!fs.existsSync(DATA_FILE)) {
            saveDB({ sites: DEFAULT_SITES });
            return { sites: DEFAULT_SITES };
        }
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if(FORCE_UPDATE) {
            let dbSites = data.sites || [];
            let changed = false;
            DEFAULT_SITES.forEach(defSite => {
                if(!dbSites.find(s => s.key === defSite.key)) {
                    dbSites.push(defSite);
                    changed = true;
                }
            });
            if(changed) saveDB({ sites: dbSites });
            return { sites: dbSites };
        }
        return data;
    } catch(e) {
        return { sites: DEFAULT_SITES };
    }
}

app.get('/api/check', async (req, res) => {
    const { key } = req.query;
    const sites = getDB().sites;
    const site = sites.find(s => s.key === key);
    if (!site) return res.json({ latency: 9999 });
    const start = Date.now();
    try {
        await axios.get(`${site.api}?ac=list&pg=1`, { timeout: 3000 });
        res.json({ latency: Date.now() - start });
    } catch (e) {
        res.json({ latency: 9999 });
    }
});

app.get('/api/hot', async (req, res) => {
    const priority = ['ffzy', 'bfzy', 'lzi', 'dbzy'];
    const sites = getDB().sites.filter(s => priority.includes(s.key));
    for (const site of sites) {
        try {
            const response = await axios.get(`${site.api}?ac=list&pg=1&h=24&out=json`, { timeout: 3000 });
            const list = response.data.list || response.data.data;
            if(list && list.length > 0) return res.json({ list: list.slice(0, 12) });
        } catch (e) { continue; }
    }
    res.json({ list: [] });
});

app.get('/api/search', async (req, res) => {
    const { wd } = req.query;
    if (!wd) return res.json({ list: [] });
    const sites = getDB().sites.filter(s => s.active);
    const promises = sites.map(async (site) => {
        try {
            const response = await axios.get(`${site.api}?ac=list&wd=${encodeURIComponent(wd)}&out=json`, { timeout: 8000 });
            const data = response.data;
            const list = data.list || data.data;
            if (Array.isArray(list)) {
                return list.map(item => ({ ...item, site_key: site.key, site_name: site.name, latency: 0 }));
            }
        } catch (e) {}
        return [];
    });
    const results = await Promise.all(promises);
    res.json({ list: results.flat() });
});

app.get('/api/detail', async (req, res) => {
    const { site_key, id } = req.query;
    const targetSite = getDB().sites.find(s => s.key === site_key);
    if (!targetSite) return res.status(404).json({ error: "Site not found" });
    try {
        const response = await axios.get(`${targetSite.api}?ac=detail&ids=${id}&out=json`, { timeout: 6000 });
        res.json(response.data);
    } catch (e) { res.status(500).json({ error: "Source Error" }); }
});

app.post('/api/admin/login', (req, res) => {
    req.body.password === ADMIN_PASSWORD ? res.json({ success: true }) : res.status(403).json({ success: false });
});

app.get('/api/admin/sites', (req, res) => res.json(getDB().sites));

app.post('/api/admin/sites', (req, res) => { 
    saveDB({ sites: req.body.sites }); 
    res.json({ success: true }); 
});

app.listen(PORT, () => { 
    console.log(`服务已启动: http://localhost:${PORT}`); 
});
