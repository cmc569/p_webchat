const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mysql = require('mysql');
const querystring = require('querystring');


//設定 listen port
const port = 8992;

//設定 DB 連線資訊
const db_data = {
    host: 'accu-qa.mysql.database.azure.com',
    user: 'aqUser@accu-qa',
    password: 'AccuHit5008!!',
    database: 'webchat_' + port
};


//取得時間
const getDateTime = function() {
    let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    let n = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -5).replace('T', ' ');
    return n;
}

//建立資料庫連線
const db_create = function() {
    let conn = mysql.createConnection({
        host: db_data.host,
        user: db_data.user,
        password: db_data.password,
        database: db_data.database
    });
    
    return conn;
}

//建立使用者註冊資訊
const rid_registry = function(data) {
    let conn = db_create();
    
    // 建立連線後不論是否成功都會呼叫
    conn.connect(function(err){
        // if(err) throw err;
        if(err) console.log(getDateTime() + ' mysql connect failed!');
        console.log(getDateTime() + ' mysql connect success!');
    });
    
    //查詢 rid 是否存在
    // let sql = 'SELECT * FROM user_registry WHERE rid = "' + data.rid + '";';
    let sql = 'SELECT * FROM user_registry WHERE rid = "' + data.frid + '";';
    conn.query(sql, function (err, result, fiels) {
        // if (err) throw err;

        if (result.length > 0) {
            let sql = 'UPDATE user_registry SET fpc = "' + data.ffpc + '"';
            sql = sql + ', online = "Y"';
            sql = sql + ', obj_no = "' + data.objNo + '"';
            sql = sql + ', message_from = "' + data.mFrom + '"';
            sql = sql + ' WHERE rid = "' + data.frid + '";';
            
            conn.query(sql, function (err) {
                // if (err) throw err;
                if (err) console.log('user_registry UPDATE error');
            });
        }
        else {
            let sql = 'INSERT INTO user_registry SET rid = "' + data.frid + '"';
            sql = sql + ', fpc = "' + data.ffpc + '"';
            sql = sql + ', online = "Y"';
            sql = sql + ', obj_no = "' + data.objNo + '"';
            sql = sql + ', message_from = "' + data.mFrom + '";';
            
            conn.query(sql, function (err) {
                // if (err) throw err;
                if (err) console.log('user_registry INSERT error');
            });
        }
        
        // 關閉連線時呼叫
        conn.end(function(err){
            // if(err) throw err;
        })
        
    });
}

//使用者離線資訊處理
const rid_registry_disconnect = function(data) {
    let conn = db_create();
    
    // 建立連線後不論是否成功都會呼叫
    conn.connect(function(err){
        // if(err) throw err;
    });
    
    //查詢 rid 是否存在
    let sql = 'UPDATE user_registry SET online = "' + data.online + '" WHERE rid = "' + data.rid + '";';
    conn.query(sql, function (err, result, fiels) {
        // if (err) throw err;
        if (err) console.log('user_registry UPDATE error');
        
        // 關閉連線時呼叫
        conn.end(function(err){
            // if(err) throw err;
        })
        
    });
}

//記錄使用者訊息內容
const message_registry = function(data) {
    let conn = db_create();
    
    //message register
    let data_arr = JSON.parse(data);
    
    let sql = 'INSERT INTO messages SET fromRid = "' + data_arr.frid + '"';
    sql = sql + ', toRid = "' + data_arr.trid + '"';
    sql = sql + ', messageFrom = "' + data_arr.mFrom + '"';
    sql = sql + ', caseObjectNo = "' + data_arr.objNo + '"';
    sql = sql + ', message = "' + data_arr.message + '"';
    
    if ((data_arr.actionType != '') && (data_arr.actionType != undefined)) {
        sql = sql + ', actionType = "' + data_arr.actionType + '"';
    }
    
    conn.query(sql, function (err, result, fiels) {
        // if (err) throw err;
        if (err) console.log('messages INSERT error');
        
        // 關閉連線時呼叫
        conn.end(function(err){
            // if(err) throw err;
        })
    });
}

//紀錄圖檔路徑
const image_registry = function(msg_arr, _url) {
    let conn = db_create();
    
    //message register
    let sql = 'INSERT INTO images SET url = "' + _url + '"';
    
    conn.query(sql, function (err, result, fiels) {
        // if (err) throw err;
        if (err) console.log('images INSERT error');
        
        // 關閉連線時呼叫
        conn.end(function(err){
            // if(err) throw err;
            
            if((_url == '') || (_url == undefined)) msg_arr.image = msg_arr.image;
            else msg_arr.image = '<a href="' + _url + '" target="_blank">' + msg_arr.image + '</a>';
            let msg = JSON.stringify(msg_arr);
            
            msg_arr.actionType = 'image';
            msg_arr.message = result.insertId;
            message_registry(JSON.stringify(msg_arr));
            
            io.to(msg_arr.trid).emit('sendImage', msg);
        })
    });
}

//記錄使用者下線通知
const message_disconnect = function(socket_id, rid) {
    let conn = db_create();
    
    let sql = 'INSERT INTO messages SET fromRid = "' + socket_id + '"';
    sql = sql + ', toRid = "' + rid + '"';
    sql = sql + ', actionType = "disconnected"';
    
    conn.query(sql, function (err, result, fiels) {
        // if (err) throw err;
        if (err) console.log('messages INSERT error');
        
        // 關閉連線時呼叫
        conn.end(function(err){
            // if(err) throw err;
        })
    });
}

//通知相關人員使用者下線
const broadcast_disconnect = function(socket_id) {
    let conn = db_create();
    
    //message register
    let sql = 'SELECT DISTINCT a.rid FROM user_registry AS a JOIN messages AS b ON a.rid = b.fromRid WHERE b.toRid = "' + socket_id + '" AND a.online= "Y";';
    
    conn.query(sql, function (err, result, fiels) {
        // if (err) throw err;
        
        // console.log(result);
        // console.log(result[0].rid);
        
        result.forEach(obj => {
            message_disconnect(socket_id, obj.rid);
            // console.log(obj);
            io.to(obj.rid).emit('offline', socket_id);
        });
        
        // 關閉連線時呼叫
        conn.end(function(err){
            // if(err) throw err;
        })
    });
}

//發送上線通知
const send_sync = function(msg) {
    let msg_arr = JSON.parse(msg);
    
    //更新連線紀錄
    rid_registry(msg_arr);
    
    //message register
    let conn = db_create();
    let sql = 'INSERT INTO messages SET fromRid = "' + msg_arr.frid + '"';
    sql = sql + ', toRid = "' + msg_arr.trid + '"';
    sql = sql + ', messageFrom = "' + msg_arr.mFrom + '"';
    sql = sql + ', caseObjectNo = "' + msg_arr.objNo + '"';
    sql = sql + ', message = ""';
    sql = sql + ', actionType = "' + msg_arr.actionType + '"';
    
    conn.query(sql, function (err, result, fiels) {
        // if (err) throw err;
        if (err) console.log('messages INSERT error');
        
        io.to(msg_arr.trid).emit(msg_arr.actionType, msg);
        
        // 關閉連線時呼叫
        conn.end(function(err){
            // if(err) throw err;
        })
    });
}

//寫入圖檔至blob
const sendImageBlob = function(_port, msg_arr) {
    let post_data = querystring.stringify({
        port: _port,
        image: msg_arr.image
    });
    
    let post_options = {
        host: 'ub001.accuhit.net',
        port: '80',
        path: '/data/pacific/chat_image/webchat_image.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };
    
    // Set up the request
    var str = '';
    var post_req = require('http').request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            str = str + chunk;
        });
        
        res.on('end', async() => {
            image_registry(msg_arr, str);
        });
    });
    
    post_req.write(post_data);
    post_req.end();
}


//web server
// app.get('/', function(req, res){
    // res.send('<h1>Hello world</h1>');
// });

// app.get('/socket', function(req, res){
    // res.sendFile(__dirname + '/main.html');
// });


//socket io server
io.on('connection', function(socket){
    let socket_id = socket.id;
    console.log(getDateTime() + ' a user connected(' + socket_id);
    
    //建立連線資訊
    socket.emit('registered', socket_id);
    
    //紀錄建立連線
    let json = {frid: socket_id, ffpc: '', objNo: '', mFrom: ''};
    rid_registry(json);
    
    //發送訊息
    socket.on('message', function(msg){
        console.log('message: ' + msg);
        let msg_arr = JSON.parse(msg);

        //紀錄訊息內容
        message_registry(msg);
                
        io.to(msg_arr.trid).emit('message', msg);
    });
    
    //發送圖片
    socket.on('sendImage', function(msg){
        // console.log('message: ' + msg);
        let msg_arr = JSON.parse(msg);
        
        //紀錄圖片訊息
        sendImageBlob(port, msg_arr);
    });
    
    //建立連線
    socket.on('sync', function(msg){
        let msg_arr = JSON.parse(msg);
        msg_arr.actionType = 'sync';
                
        send_sync(JSON.stringify(msg_arr));
    });
    
    //連線完成
    socket.on('sync_ok', function(msg){
        let msg_arr = JSON.parse(msg);
        msg_arr.actionType = 'sync_ok';
        
        send_sync(JSON.stringify(msg_arr));
    });
    
    //結束連線
    socket.on('disconnect', function(){
        //更新連線紀錄
        let json = {rid: socket_id, online: 'N'};
        rid_registry_disconnect(json);
        console.log(getDateTime() + ' user disconnected(' + socket_id + ')');
        
        //通知相關人員使用者下線
        broadcast_disconnect(socket_id);
    });
});

//listen...
http.listen(port, function(){
// http.listen(port, '0.0.0.0', function(){
    console.log(getDateTime() + ' listening on *:'+port);
});