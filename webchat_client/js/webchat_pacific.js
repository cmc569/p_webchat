//https://bot-event.accunix.net/webchat_client/pacific.html?ffpc=fpc123456&tfpc=fpc987654&objNo=A000123&h_name=%E5%A4%AA%E5%A4%AA%E5%A4%AA&h_tel=0911222333&mFrom=G&trid=4InGNgTgVrXkVc1DAAAC#
/*
ffpc=來源方指紋碼
tfpc=交收方指紋碼
objNo=物件編號
h_name=物件所屬業務店長姓名
h_tel=物件所屬業務店長電話
mFrom=聊天室身分：G=訪客、H=業務店長
trid=受話方 register id(websocket 用)
*/

const socket = io('https://eip.accuhit.net', {path:'/v1/socket.io'});
var icon_image = 'img/p-1.png';
var line_token = '';

$(function () {
    getUrls();
    
    socket.on('register', function(socket_id){
        $('#frid').val(socket_id);
        console.log(socket_id + '已連線');
        $('#chat-input').prop('disabled', false);
        alert('已連線');
        
        let formData = getBaseMsg();
        if ((formData.trid != '') && (formData.trid != undefined)) {
            var jsonString = JSON.stringify(formData);
            socket.emit('sync', jsonString); 
        }
    });
    
    socket.on('message', function(json_string){
        let json_arr = JSON.parse(json_string);
        $('#trid').val(json_arr.frid);
        
        let html = '<span class="chat_msg_item chat_msg_item_admin">' +
                '<div class="chat_avatar">' +
                    '<img src="' + icon_image + '">' +
                '</div>' + json_arr.message.nl2br() + '</span>';
        $('#chat_converse').append(html);
        
        if (chatroom_mode == 0) {
            new_message += 1;
            $("#dot").show() ;
        }
        else {
            new_message = 0;
            $("#dot").hide() ;
            scrollBottom('chat_converse');
        }
    });
    
    socket.on('sendImage', function(json_string){
        let json_arr = JSON.parse(json_string);
        $('#trid').val(json_arr.frid);
        
        let html = '<span class="chat_msg_item chat_msg_item_admin">' +
                '<div class="chat_avatar">' +
                    '<img src="' + icon_image + '">' +
                '</div>' + json_arr.image + '</span>';
        $('#chat_converse').append(html);
        scrollBottom('chat_converse');
    });
    
    socket.on('sync', function(json_string){
        let json_arr = JSON.parse(json_string);
        $('#trid').val(json_arr.frid);
        $('.online').empty().html('(Online)');
        
        let jsonString = JSON.stringify(getBaseMsg());
        socket.emit('sync_ok', jsonString); 
    });
    
    socket.on('sync_ok', function(json_string){
        $('.online').empty().html('(Online)');
    });
    
    socket.on('offline', function(json_string){
        $('#trid').val('');
        $('.online').empty().html('(Online)');
        console.log('對方下線了...');
        alert('對方下線了...');
    });
});

//取得主要訊息組成
function getBaseMsg() {
    var formData = {
        'frid': $('#frid').val(),
        'trid': $('#trid').val(),
        'ffpc': $('#ffpc').val(),
        'tfpc': $('#tfpc').val(),
        'objNo': $('#objNo').val(),
        'mFrom': $('#mFrom').val(),
        'h_name': $('#h_name').val(),
        'h_tel': $('#h_tel').val()
    };
    
    return formData;
}

//傳送訊息
function sendMsg() {
    if ($('#chat-input').val() == '' || $('#chat-input').val === undefined) {
        $('#chat-input').focus();
        return false;
    }
    
    var formData = getBaseMsg();
    formData.message = $('#chat-input').val();
    
    var jsonString = JSON.stringify(formData);
    socket.emit('message', jsonString);
    
    let html = '<span class="chat_msg_item chat_msg_item_user">' + $('#chat-input').val().nl2br() + '</span>';
    $('#chat_converse').append(html);
    
    scrollBottom('chat_converse');
    $('#chat-input').val('').focus();
    
    return false;
}

//顯示選取圖片
function get_image(fh) {
    // 上傳單張圖片
    var file = fh.files[0];
    var reader = new FileReader();
    
    //檔案讀取出錯的時候觸發
    reader.onerror = function(){
        console.log('讀取檔案失敗，請重試！'); 
    };
    
    // 讀取成功後
    reader.onload = function() {
        var src = reader.result; // 讀取結果
        
        var img = '<img class="sendImg" src="' + src + '" style="max-width: 160px">';
        var formData = getBaseMsg();
        formData.image = img;
        
        var jsonString = JSON.stringify(formData);
        socket.emit('sendImage', jsonString); 
        
        let html = '<span class="chat_msg_item chat_msg_item_user">' + img + '</span>';
        $('#chat_converse').append(html);
        
        scrollBottom('chat_converse');
    };
    
    reader.readAsDataURL(file); // 讀取為64位
}

//取得 Url 參數
function getUrls() {
    let urlParams = new URLSearchParams(window.location.search);
    let arr = String(urlParams).split('&');
    
    $.each(arr, function(k, v) {
        let arr2 = v.split('=');
        
        /*
        if (arr2[0] == 'fpc') {
            $('#ffpc').val(arr2[1]);
        }
        else if (arr2[0] == 'objNo') {
            $('#objNo').val(arr2[1]);
        }
        else if (arr2[0] == 'mFrom') {
            arr2[1] = arr2[1].toUpperCase();
            $('#mFrom').val(arr2[1]);
        }
        */
        
        if (arr2[0] == 'trid') {
            $('#trid').val(arr2[1]);
        }
        else if (arr2[0] == 'ffpc') {
            $('#ffpc').val(arr2[1]);
        }
        else if (arr2[0] == 'tfpc') {
            $('#tfpc').val(arr2[1]);
        }
        else if (arr2[0] == 'objNo') {
            arr2[1] = arr2[1].toUpperCase();
            $('#objNo').val(arr2[1]);
        }
        else if (arr2[0] == 'mFrom') {
            arr2[1] = arr2[1].toUpperCase();
            $('#mFrom').val(arr2[1]);
            
            if (arr2[1] == 'G') {
                icon_image = 'img/p.png';
                // console.log('icon_image=' + icon_image);
            }
        }
        else if (arr2[0] == 'h_name') {
            arr2[1] = decodeURIComponent(arr2[1]);
            $('#h_name').val(arr2[1]);
            $('#chat_head').html(arr2[1]);
            $('#host_welcome').html('您好!我是服務專員'+arr2[1]+'，有任何想詢問的可以隨時跟我聯絡喔~');
        }
        else if (arr2[0] == 'h_tel') {
            arr2[1] = decodeURIComponent(arr2[1]);
            $('#h_tel').val(arr2[1]);
            $('#host_tel').html(arr2[1]);
        }
        
        delete arr2;
    });
    
    // getHostData($('#objNo').val());
    
    delete arr;
}

//取得聊天室主持人基本資料
function getHostData(objNo) {
    let url = 'api/obj_detail.php?obj=' + objNo;
    console.log('url='+url);
    // $.get(url, function(detal) {
        // if (detail.status == 200) {
            // $('#h_name').val(detail.data.name);
            // $('#chat_head').html(detail.data.name);
            // $('#host_welcome').html('您好!我是服務專員'+detail.data.name+'，有任何想詢問的可以隨時跟我聯絡喔~');
            
            // $('#h_tel').val(detail.data.tel);
            // $('#host_tel').html(detail.data.tel);
            
            // if ($('#mFrom').val() == 'G') {
                // icon_image = 'img/p.png';
            // }
        // }
    // }, 'json');
    
    $(".image-icon").attr('src', 'img/p.png');
}

//取得完整日期時間
function getDateTime() {
    let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    let n = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -5).replace('T', ' ');
    return n;
}

//取得短日期時間
function getShortDT() {
    let dt = getDateTime() ;
    return dt.slice(11, -3);
}

//scroll to bottom
function scrollBottom(tag) {
    let dd = document.getElementById(tag);
    dd.scrollTo(0,dd.scrollHeight);
}

//\n 轉 <br>
String.prototype.nl2br = function() {
    return this.replace(/\n/g, "<br />");
}
