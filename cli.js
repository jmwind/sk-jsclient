import SkClient from './sk-client.js';
import { SkConversions, SkData } from './sk-data.js'
import WebSocket from 'ws';

let state = SkData.newMetrics();

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function accept(msg, fn) {
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
client.on('delta', accept);
client.connect();

sleep(5000).then(() => {
    client.off('delta');
    client.disconnect();
});