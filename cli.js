import SkClient from './sk-client.js';
import { SkConversions, SkData, SkPolars, CATALINA_36_POLARS } from './sk-data.js'
import WebSocket from 'ws';

// keep global set of metrics that will be updated by client
let state = SkData.newMetrics();

const sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
}

const echoLog = (msg, fn) => {
    let aws = state[SkData.AWS];
    let awa = state[SkData.AWA];
    let sog = state[SkData.SOG];
    let speed_ratio = state[SkData.POLAR_RATIO].value;
    let speed_target = state[SkData.POLAR_TARGET].value;
    let aws_val = SkConversions.fromMetric(aws).toFixed(1);
    let awa_val = SkConversions.fromMetric(awa).toFixed(0);
    let sog_val = SkConversions.fromMetric(sog).toFixed(1);
    console.log(`SOG: ${sog_val} ${sog.nameUnit} target is ${speed_target.toFixed(1)} Kts which is ${speed_ratio.toFixed(0)}% AWS: ${aws_val} ${aws.nameUnit} AWA: ${awa_val}${awa.nameUnit}`);
}

const dumpMetrics = (metricType) => {
    const client = new SkClient((url) => { return new WebSocket(url) });
    client.setState(state);
    let polars = SkPolars.readFromFileContents(CATALINA_36_POLARS);
    client.setPolars(polars);
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

const error = (msg) => {
    console.log("usage: cli.js [--metrics <serial | log> | --polars TWS TWA]");
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

