import SkClient from './sk-client.js';
import { SkConversions, SkData, SkPolars } from './sk-data.js'
import WebSocket from 'ws';
import { SerialPort } from 'serialport'

let state = SkData.newMetrics();
let g1_val = 0;
let polars = {};

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function encode(str) {
    var arr = [];
    for (var i = 0, l = str.length; i < l; i++) {
        var ascii = str.charCodeAt(i);
        arr.push(ascii);
    }
    arr.push(255);
    arr.push(255);
    arr.push(255);
    return Buffer.from(arr);
}

function echoSerial(msg, fn) {
    const port = new SerialPort({
        path: '/dev/serial0',
        baudRate: 9600,
    }, (err) => {
        if (err) console.log("error opening serial port")
    });
    let aws = state['environment.wind.speedApparent'];
    let awa = state['environment.wind.angleApparent'];
    let sog = state['navigation.speedOverGround'];
    let aws_val = SkConversions.fromMetric(aws).toFixed(1);
    let awa_val = SkConversions.fromMetric(awa).toFixed(0);
    let sog_val = SkConversions.fromMetric(sog).toFixed(1);
    g1_val++;
    if (g1_val > 360) {
        g1_val = 0;
    }
    // this normalizes into a range. The * is the height of the waveform from 
    // Nextrion and the 35kn the max wind range
    let aws_norm = ((aws_val / 35) * 77).toFixed(0);
    let lmiddle = encode(`lmiddle.txt="${aws_val}"`);
    let rtop = encode(`rtop.txt="${awa_val}"`);
    let rbottom = encode(`rbottom.txt="${sog_val}"`);
    let g1 = encode(`g1.val=${g1_val.toFixed(0)}`);
    let g1t = encode(`g1t.txt="${g1_val.toFixed(0)}%"`);
    let wave = encode(`add 15,0,${aws_norm}`);
    let wave2 = encode(`add 15,1,${aws_norm}+1`);
    let wave3 = encode(`add 15,2,${aws_norm}-1`);
    let wave4 = encode(`add 15,3,${aws_norm}-1`);

    port.write(lmiddle);
    port.write(rtop);
    port.write(rbottom);
    port.write(g1);
    port.write(g1t);
    port.write(wave);
    port.write(wave2);
    port.write(wave3);
    port.write(wave4);
}

function calcPolarSog(tws, twa) {
    if (polars.length > 0) {
        return SkPolars.getSogFor(polars, tws, twa);
    }
    return 0.0;
}

function echoLog(msg, fn) {
    let aws = state['environment.wind.speedApparent'];
    let awa = state['environment.wind.angleApparent'];
    let sog = state['navigation.speedOverGround'];
    let speed_ratio = this.state['navigation.polarSpeedRatio'].value;
    let aws_val = SkConversions.fromMetric(aws).toFixed(1);
    let awa_val = SkConversions.fromMetric(awa).toFixed(0);
    let sog_val = SkConversions.fromMetric(sog).toFixed(1);
    console.log(`SOG: ${sog_val}${sog.nameUnit} target is ${speed_ratio} which is ${(sog_val / speed_ratio * 100).toFixed(2)}% AWS: ${aws_val}${aws.nameUnit} AWA: ${awa_val}${awa.nameUnit}`);
}

function dumpMetrics(metricType) {
    const client = new SkClient((url) => { return new WebSocket(url) });
    client.setState(state);
    console.log(`Reading polars from data/catalina36_polar.txt...`);
    SkPolars.readFromFile("data/catalina36_polar.txt", (polars) => {
        client.setPolars(polars);
    });

    client.on('delta', echoLog);
    if (metricType == "serial") {
        client.on('delta', echoSerial);
    }
    client.connect();

    sleep(180000).then(() => {
        client.off('delta');
        client.disconnect();
    });
}

function loadPolarFiles(filename, tws, twa) {
    console.log(`Reading polars from ${filename}...`);
    SkPolars.readFromFile(filename, (polars) => {
        if (tws && twa) {
            let sog = SkPolars.getSogFor(polars, parseFloat(tws), parseInt(twa));
            console.log(`For TWS of ${tws} and TWA of ${twa} the SOG target is ${sog.toFixed(1)} knots`);
        }
    });
}

function error(msg) {
    console.log("usage: cli.js [--metrics <serial> | --polars <filename> TWS TWA]");
    console.log(msg);
    process.exit(1);
}

// ################################################
// MAIN 
// ################################################

const args = process.argv.slice(2);
if (args[0] == "--metrics") {
    dumpMetrics(args[1]);
} else if (args[0] == "--polars") {
    if (args[1] == undefined) {
        error("--polars requires a filename parameter");
    }
    loadPolarFiles(args[1], args[2], args[3]);
} else {
    error("missing command line parameters");
}

