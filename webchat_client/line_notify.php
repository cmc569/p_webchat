<?php
$rid = $_REQUEST['rid'];
if (empty($rid)) exit(400);

$tk = $_REQUEST['tk'];
if (!preg_match("/^U\w{32}$/iu", $tk)) exit(400);

$objNo = $_REQUEST['objNo'];
if (!preg_match("/^\w+$/iu", $tk)) exit(400);

$to = [$tk];

$port = 8992;

$token = '1AfQGJSLosGMjKR8a0ncwrvcHZmAotARhMe+IQgVe09tmMB0OPlJD4F599ClxC1gi84L0ZP/VIZIWfCrlZ+HHkxVa10eqv2xOfDcVA6yYGjbTRcOfyIpHtkRYwVgzsETzxXUsEE7InjHTvnb+O7AtwdB04t89/1O/w1cDnyilFU=';
$url = 'https://bot-event.accunix.net/webchat_client/'.$port.'/chat_host.html?fpc='.$tk.'&objNo='.$objNo.'&trid='.$rid;
$line_url = 'https://api.line.me/v2/bot/message/push';

// $to = ['U3e19bf0d612c7e539e64e26a8c74c3a6',];   //陳銘慶
// $to = ['Udd411d6cd9ea726ca5564e97d1b5d7a0',];   //林阿超
foreach ($to as $k => $v) {
    $msg = "來電通知！\n請點擊下方連結進入聊天室：\n\n".$url;
    $data = ['to' => $v, 'messages' => [['type' => 'text', 'text' => $msg]]];
    $json_data = json_encode($data);
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-type: application/json\r\n".
                        "Content-length: ".strlen($json_data)."\r\n".
                        "Authorization: Bearer ".$token."\r\n",
            'content' => $json_data
        ]
    ]);

    if (file_get_contents($line_url, false, $context)) exit(200);
    else exit(400);
}
?>