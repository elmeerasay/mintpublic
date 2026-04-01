const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'contracts.json');

const server = http.createServer((req, res) => {
    // API Khusus untuk Save Data
    if (req.method === 'POST' && req.url === '/save-contracts') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                
                // 1. Baca data yang sudah ada di contracts.json
                let store = {};
                if (fs.existsSync(FILE_PATH)) {
                    try {
                        const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
                        if (fileContent.trim() !== '') store = JSON.parse(fileContent);
                    } catch (e) {
                        console.log('⚠️ Format contracts.json sebelumnya salah. Memperbaiki...');
                    }
                }

                // 2. Perbarui/Tambahkan hanya untuk Chain ID yang dikirim
                const cid = payload.chainId;
                if (!store[cid]) store[cid] = {};
                
                if (payload.data.receiver) store[cid].receiver = payload.data.receiver;
                if (payload.data.factory) store[cid].factory = payload.data.factory;
                store[cid].network_name = payload.data.network_name;
                store[cid].rpc = payload.data.rpc;
                store[cid].last_updated = payload.data.last_updated;

                // 3. Tulis ulang file
                fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 4), 'utf8');
                console.log(`✅ Data kontrak disave ke contracts.json (Chain: ${cid})`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success' }));
            } catch (error) {
                console.error('❌ Gagal memproses data save:', error);
                res.writeHead(500); res.end('Error parsing data');
            }
        });
        return;
    }

    // Melayani file HTML dan JSON
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const extname = String(path.extname(filePath)).toLowerCase();
    
    const mimeTypes = {
        '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    };

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT'){
                if(filePath.includes('contracts.json')) {
                    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}');
                } else {
                    res.writeHead(404); res.end('File not found');
                }
            } else {
                res.writeHead(500); res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeTypes[extname] || 'application/octet-stream' });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Server Berjalan! Buka browser: http://localhost:${PORT}\n`);
});