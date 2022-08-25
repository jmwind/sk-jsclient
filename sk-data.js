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
    // returns {TWS -> {TWA -> SOG}}
    static readFromFile(filename, success) {
        let polars = {};
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                throw err;
            }
            let lines = data.split(/\r?\n/);
            lines.forEach(line => {
                let line_polars = {};
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
                    line_polars[parseInt(tokens[i])] = parseFloat(tokens[++i]);
                    i++;
                }
                polars[tws] = line_polars;
            });
            success(polars);
        });
    }

    static closestNumber(target, low, high) {
        let low_diff = Math.abs(target - low);
        let high_diff = Math.abs(high - target);
        if (low_diff <= high_diff) {
            return low;
        }
        return high;
    }

    // Given n, find closest match in an array of numbers
    static findInRange(array_ints, num) {
        let low = 0;
        let high = 0;

        for (var i = 0; i < array_ints.length; i++) {
            high = array_ints[i];
            if (num >= low && num <= high) {
                break;
            }
            low = high;
        }

        // if lower bound is 0, take first  in range instead        
        if (low < array_ints[0]) {
            low = high;
        }

        return SkPolars.closestNumber(num, low, high);
    }

    static getSogFor(polars, tws, twa) {
        let tws_set = Object.keys(polars).map(Number);
        let tws_lookup = SkPolars.findInRange(tws_set, tws);

        let twa_set = Object.keys(polars[tws_lookup]).map(Number);
        let twa_lookup = SkPolars.findInRange(twa_set, twa);

        // approx raw polar value, needs adjusting given actual tws
        let sog_target = polars[tws_lookup][twa_lookup];

        // adjust based on actual TWS and interpolate from the defined polars
        let sog_adjusted_target = (tws / tws_lookup * sog_target);
        return sog_adjusted_target;
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
            return (value * 1.94384);
        }
        if (unit == "rad" && toUnit == "angle") {
            return (value * (180 / 3.14159265359));
        }
        if (unit == "percent") {
            return (value * (100));
        }
        return value;
    }
}