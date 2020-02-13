
$(function () {
    let urlParams = new URLSearchParams(window.location.search);
    let arr = String(urlParams).split('=');
    if (arr[0] == 'trid') {
        $('#trid').val(arr[1]);
    }
    delete arr;

    const socket = io('https://eip.accuhit.net', {path:'/v1/socket.io'});

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        if ($('#m').val() == '' || $('#m').val === undefined) {
            $('#m').focus();
            return false;
        }
        
        var formData = {
            'frid': $('#frid').val(),
            'trid': $('#trid').val(),
            'ffpc': $('#ffpc').val(),
            'tfpc': $('#tfpc').val(),
            'message': $('#m').val()
        };
        
        var jsonString = JSON.stringify(formData);
        socket.emit('message', jsonString);

        $('#m').val('').focus();
        return false;
    });
        
    socket.on('login', function(socket_id){
        $('#frid').val(socket_id);
        alert('已連線');
    });
    
    socket.on('message', function(json_string){
        console.log(json_string);
        let json_arr = JSON.parse(json_string);
        $('#trid').val(json_arr.frid);
        
        let msg = json_arr.ffpc + ' 說：';
        msg = msg + json_arr.message + '<h5>(' + getShortDT() + ')</h5>';
        $('#messages').append($('<li>').text(msg));
        window.scrollTo(0, document.body.scrollHeight);
    });
});

function getDateTime() {
    let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    let n = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -5).replace('T', ' ');
    return n;
}

function getShortDT() {
    let dt = getDateTime() ;
    return dt.slice(5);
}
