//https://bot-event.accunix.net/webchat_client/pacific.html?ffpc=fpc123456&tfpc=fpc987654&objNo=A000123&h_name=%E5%A4%AA%E5%A4%AA%E5%A4%AA&h_tel=0911222333&mFrom=G&trid=4InGNgTgVrXkVc1DAAAC#
/*
ffpc=來源方指紋碼
tfpc=交收方指紋碼
objNo=物件編號
mFrom=聊天室身分：G=訪客、H=業務店長
trid=受話方 register id(業務需指定、websocket 用)
auto_in=判定是否為主動聯繫
*/

// $to = ['U3e19bf0d612c7e539e64e26a8c74c3a6',];   //陳銘慶
// $to = ['Udd411d6cd9ea726ca5564e97d1b5d7a0',];   //林阿超

const socket = io('https://eip.accuhit.net', {path:'/v2/socket.io'});
var icon_image = 'img/p-1.png';     //guest
// var icon_image = 'img/p.png';    //host
// var line_token = 'U3e19bf0d612c7e539e64e26a8c74c3a6';
var line_token = 'Udd411d6cd9ea726ca5564e97d1b5d7a0';

var chatroom_mode = 0;  //0:聊天室縮小、1:聊天室全開
var new_message = 0;    //n:未讀訊息數
var ws_waiting  = 0;    //0:等待連線、1:socket 已連線
var auto_in = 'N';      //Y:n次主動聯繫

$(function () {
    getUrls();
    
    $("#informasi").click(function() {
        chatroom_mode = 1;
        new_message = 0;
        $('#flash_notify').hide();
        
        scrollBottom('chat_converse');
        menu_show('chat');
    });
    
    $(".close-chat1").click(function() {
        chatroom_mode = 0;
        menu_show('chat1');
    });  
    
    socket.on('registered', function(socket_id){
        $('#frid').val(socket_id);
        console.log(socket_id + ' 已連線');
        
        if ($('#mFrom').val() == 'G') line_notify(socket_id);
        
        $('#chat-input').prop('disabled', false);
        
        let formData = getBaseMsg();
        if ((formData.trid != '') && (formData.trid != undefined)) {
            var jsonString = JSON.stringify(formData);
            socket.emit('sync', jsonString); 
        }
    });
    
    socket.on('message', function(json_string){
        if (chatroom_mode == 0) $('#flash_notify').show();
        
        let json_arr = JSON.parse(json_string);
        $('#trid').val(json_arr.frid);
        
        let html = '<span class="chat_msg_item chat_msg_item_admin">' +
                '<div class="chat_avatar">' +
                    '<img src="' + icon_image + '">' +
                '</div>' + json_arr.message.nl2br() + '</span>';
        $('#chat_converse').append(html);
        scrollBottom('chat_converse');
    });
    
    socket.on('sendImage', function(json_string){
        if (chatroom_mode == 0) $('#flash_notify').show();
        
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
        ws_waiting = 1;
        if ($('#bot-form:visible').length != 1) menu_show('chat1');
        $('#flash_notify').hide();
        
        let json_arr = JSON.parse(json_string);
        $('#trid').val(json_arr.frid);
        $('.online').empty().html('(Online)');
        
        let jsonString = JSON.stringify(getBaseMsg());
        socket.emit('sync_ok', jsonString); 
    });
    
    socket.on('sync_ok', function(json_string){
        ws_waiting = 1;
        menu_show('chat');
        $('#flash_notify').hide();
        
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
    // $('#chat-input').val('').focus();
    $('#chat-input').val('');
    
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
        
        $('#input-image-hidden').val('');
        
        let dd = document.getElementById('chat_converse');
        dd.scrollTo(0,dd.scrollHeight);
    };
    
    reader.readAsDataURL(file); // 讀取為64位
}

//取得 Url 參數
function getUrls() {
    let urlParams = new URLSearchParams(window.location.search);
    let arr = String(urlParams).split('&');
    
    $.each(arr, function(k, v) {
        let arr2 = v.split('=');
        
        if (arr2[0] == 'fpc') {
            $('#ffpc').val(arr2[1]);
        }
        else if (arr2[0] == 'auto_in') {
            auto_in = arr2[1].toUpperCase();
        }
        else if (arr2[0] == 'objNo') {
            $('#objNo').val(arr2[1]);
        }
        else if (arr2[0] == 'trid') {
            $('#trid').val(arr2[1]);
        }
                
        delete arr2;
    });
    
    getCaseData($('#objNo').val());
    
    delete arr;
}

//取得案件基本資料
function getCaseData(objNo) {
    let host_image = '';
    let host_name = '';
    let host_tel = '';
    
    let url = 'api/obj_detail.php?obj=' + objNo;
    /*
    $.get(url, function(detail) {
        if (detail.status == 200) {
            host_image = detail.data.image;
            host_name = detail.data.name;
            host_tel = detail.data.tel;
            // line_token = detail.data.line;
        }
        else {
            host_image = 'img/p-1.png';
            host_name = '服務專員';
            host_tel = '0800';
        }
        
        icon_image = host_image;
        
        $(".image-icon").attr('src', host_image);
        $(".info-avatar > img").attr('src', host_image);
        
        $('#h_name').val(host_name);
        $('#chat_head').html(host_name);
        
        if (host_name =='服務專員') $('#host_welcome').html('您好!我是服務專員，有任何想詢問的可以隨時跟我聯絡喔~');
        else $('#host_welcome').html('您好!我是服務專員'+host_name+'，有任何想詢問的可以隨時跟我聯絡喔~');
        
        $('#h_tel').val(host_tel);
        $('#host_tel').html(host_tel);

        if ($('#mFrom').val() == 'G') {
            if (auto_in != 'Y') menu_show('waiting');
            else menu_show('form');
        }
    }, 'json');
    */
    host_image = 'img/man.png';
    host_name = '林玄彬';
    host_tel = '0922-100-601';
    
    $(".image-icon").attr('src', host_image);
    $(".info-avatar > img").attr('src', host_image);
    
    $('#h_name').val(host_name);
    $('#chat_head').html(host_name);
    $('#host_welcome').html('您好!我是服務專員'+host_name+'，有任何想詢問的可以隨時跟我聯絡喔~');

    $('#h_tel').val(host_tel);
    $('#host_tel').html(host_tel);
    
    if ($('#mFrom').val() == 'G') {
        icon_image = host_image;
        
        if (auto_in != 'Y') menu_show('waiting');
        else menu_show('form');
    }
}

//進入聊天室
function enter_chat() {
    let fName = $('#form_name').val();
    let fTel = $('#form_tel').val();
    
    if ((fName == '') || (fName == undefined)) {
        alert('請輸入姓名');
        $('#form_name').focus();
        return false;
    }
    
    // let p1 = /^(([0/+]/d{2,3}-)?(0/d{2,3})-)?(/d{7,8})(-(/d{3,}))?$/;
    // if (!p1.test(fTel)) {
    if ((fTel == '') || (fTel == undefined)) {
        alert('請輸入正確手機號碼');
        $('#form_tel').select().focus();
        return false;
    }
    
    //紀錄表單
    
    //決定顯示方式
    if (ws_waiting == 1) menu_show('chat'); //已連線
    else menu_show('waiting');              //尚未連線
}

//顯示主要視窗
function menu_show(stat) {
    if (stat == 'form') $('#bot-form').show();      //表單
    else $('#bot-form').hide();
    
    if (stat == 'chat') $('#bot-chat').show();      //聊天室
    else $('#bot-chat').hide();
    
    if (stat == 'chat1') $('#bot-chat1').show();     //收合
    else $('#bot-chat1').hide();
    
    if (stat == 'waiting') $('#bot-waiting').show();   //等待連線
    else $('#bot-waiting').hide();
}

//通知host上線
function line_notify(rid) {
    let url = 'line_notify.php?rid='+rid+'&objNo='+$('#objNo').val()+'&tk='+line_token;
    $.get(url, function(txt){
        console.log('notify: '+txt);
    });
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
    if (chatroom_mode == 0) {
        new_message += 1;
        $("#dot").show() ;
    }
    else {
        new_message = 0;
        $("#dot").hide() ;
    }
    
    let dd = document.getElementById(tag);
    dd.scrollTo(0,dd.scrollHeight);
}

//\n 轉 <br>
String.prototype.nl2br = function() {
    return this.replace(/\n/g, "<br />");
}
