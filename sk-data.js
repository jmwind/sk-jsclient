import fs from 'fs';


export class SkData {
    static newMetrics() {
        return {
            'environment.wind.speedApparent': { value: 0, unit: "m/s", displayUnit: "knot", nameUnit: "Kts", nameMetric: "AWS", positionUnit: "down" },
            'environment.wind.speedTrue': { value: 0, unit: "m/s", displayUnit: "knot", nameUnit: "Kts", nameMetric: "TWS", positionUnit: "down" },
            'environment.wind.angleApparent': { value: 0, unit: "rad", displayUnit: "angle", nameUnit: String.fromCharCode(176), nameMetric: "AWA", positionUnit: "up" },
            'environment.wind.angleTrueGround': { value: 0, unit: "rad", displayUnit: "angle", nameUnit: String.fromCharCode(176), nameMetric: "TWA", positionUnit: "up" },
            'navigation.speedOverGround': { value: 0, unit: "m/s", displayUnit: "knot", nameUnit: "Kts", nameMetric: "SOG", positionUnit: "down" },
            'navigation.polarSpeedRatio': { value: 0, unit: "percent", displayUnit: "percent", nameUnit: "%", nameMetric: "Polar Ratio", positionUnit: "down" }
        }
    }
}

export class SkPolars {
    // returns {TWS -> [{TWA, SOG}]}
    static readFromFile(filename, success) {
        let polars = {};
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                throw err;
            }
            let lines = data.split(/\r?\n/);
            lines.forEach(line => {
                let line_polars = [];
                let tokens = line.split(/\s{1,}|\\t{1,}/);
                if (tokens[0] == "!") {
                    return;
                }
                let tws = parseInt(tokens[0]);
                let i = 1;
                while (i < tokens.length) {
                    if (i + 1 > tokens.length) {
                        console.log("error in polars file, skipping line");
                        return;
                    }
                    line_polars.push({ twa: parseInt(tokens[i]), sog: parseFloat(tokens[++i]) });
                    i++;
                }
                polars[tws] = line_polars;
            });
            success(polars);
        });
    }
}

export class SkConversions {
    static from(value, unit, toUnit) {
        if (unit == 'm/s' && toUnit == "knot") {
            return (value * 1.94384).toFixed(1);
        }
        if (unit == "rad" && toUnit == "angle") {
            return (value * (180 / 3.14159265359)).toFixed(1);
        }
    }

    static fromMetric(item) {
        let unit = item.unit;
        let value = item.value;
        let toUnit = item.displayUnit;
        if (unit == 'm/s' && toUnit == "knot") {
            return (value * 1.94384).toFixed(1);
        }
        if (unit == "rad" && toUnit == "angle") {
            return (value * (180 / 3.14159265359)).toFixed(1);
        }
        if (unit == "percent") {
            return (value * (100)).toFixed(0);
        }
        return value;
    }
}