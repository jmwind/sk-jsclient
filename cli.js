import SkClient from './sk-client.js';
import { SkConversions, SkData } from './sk-data.js'
import WebSocket from 'ws';
import { SerialPort } from 'serialport'

let state = SkData.newMetrics();

const port = new SerialPort({
    path: '/dev/serial0',
    baudRate: 9600,
  }, (err) => {if(err) console.log("error opening port")})

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function encode(str) {
    var arr = [];
    for (var i = 0, l = str.length; i < l; i ++) {
            var ascii = str.charCodeAt(i);
            arr.push(ascii);
    }
    arr.push(255);
    arr.push(255);
    arr.push(255);
    return Buffer.from(arr);
}

function echoSerial(msg, fn) {
    let aws = state['environment.wind.speedApparent'];
    let awa = state['environment.wind.angleApparent'];
    let sog = state['navigation.speedOverGround'];
    let aws_val = SkConversions.fromMetric(aws);
    let awa_val = SkConversions.fromMetric(awa);
    let sog_val = SkConversions.fromMetric(sog);
    let lmiddle = encode(`lmiddle.txt="${sog_val}"`);
    let rtop = encode(`rtop.txt="${awa_val}"`);
    let rbottom = encode(`rbottom.txt="${aws_val}"`);
    port.write(lmiddle);
    port.write(rtop);
    port.write(rbottom);
}

function echoLog(msg, fn) {
    let aws = state['environment.wind.speedApparent'];
    let awa = state['environment.wind.angleApparent'];
    let sog = state['navigation.speedOverGround'];
    let aws_val = SkConversions.fromMetric(aws);
    let awa_val = SkConversions.fromMetric(awa);
    let sog_val = SkConversions.fromMetric(sog);
    console.log(`SOG: ${sog_val}${sog.nameUnit} AWS: ${aws_val}${aws.nameUnit} AWA: ${awa_val}${awa.nameUnit}`);
}

const client = new SkClient((url) => { return new WebSocket(url) });
client.setState(state);
client.on('delta', echoLog);
client.on('delta', echoSerial);
client.connect();

sleep(60000).then(() => {
    client.off('delta');
    client.disconnect();
});