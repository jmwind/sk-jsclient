export class SkData {
    static AWS = 'environment.wind.speedApparent';
    static TWS = 'environment.wind.speedTrue';
    static AWA = 'environment.wind.angleApparent';
    static TWA = 'environment.wind.angleTrueGround';
    static SOG = 'navigation.speedOverGround';
    static POLAR_RATIO = 'navigation.polarSpeedRatio';
    static POLAR_TARGET = 'navigation.polarSpeedTarget';
    static newMetrics() {
        return {
            [this.AWS]: { value: 0, unit: "m/s", displayUnit: "knot", nameUnit: "Kts", nameMetric: "AWS", rounding: 1 },
            [this.TWS]: { value: 0, unit: "m/s", displayUnit: "knot", nameUnit: "Kts", nameMetric: "TWS", rounding: 1 },
            [this.AWA]: { value: 0, unit: "rad", displayUnit: "angle", nameUnit: String.fromCharCode(176), nameMetric: "AWA", rounding: 0 },
            [this.TWA]: { value: 0, unit: "rad", displayUnit: "angle", nameUnit: String.fromCharCode(176), nameMetric: "TWA", rounding: 0 },
            [this.SOG]: { value: 0, unit: "m/s", displayUnit: "knot", nameUnit: "Kts", nameMetric: "SOG", rounding: 1 },
            [this.POLAR_RATIO]: { value: 0, unit: "percent", displayUnit: "percent", nameUnit: "%", nameMetric: "Polar Speed Ratio", rounding: 0 },
            [this.POLAR_TARGET]: { value: 0, unit: "kts", displayUnit: "knot", nameUnit: "Kts", nameMetric: "Polar Speed Target", rounding: 1 }
        }
    }
}

export class SkPolars {
    // returns {TWS -> {TWA -> SOG}}
    static readFromFileContents(data) {
        let polars = {};
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
        return polars;
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
        return value;
    }
}


export const CATALINA_36_POLARS = `
!	Twa0	Bsp0	TwaUp	BspUp	Twa1	Bsp1	Twa2	Bsp2	Twa3	Bsp3	Twa4	Bsp4	Twa5	Bsp5	Twa6	Bsp6	Twa7	Bsp7	Twa8	Bsp8	Twa9	Bsp9	TwaDn	BspDn	Twa10	Bsp10
6	0.0	0.0	47.9	4.322	52	4.634	60	5.061	70	5.375	80	5.61	90	5.852	110	5.626	120	5.231	135	4.495	141.6	4.125	142	4.125	180	2.968
8	0.0	0.0	47	5.278	52	5.729	60	6.195	70	6.466	80	6.665	90	6.799	110	6.677	120	6.415	135	5.686	144.9	5.053	145	5.053	180	3.895
10	0.0	0.0	46	5.936	52	6.43	60	6.767	70	6.976	80	7.115	90	7.255	110	7.204	120	7.04	135	6.588	147.9	5.848	148	5.848	180	4.781
12	0.0	0.0	43.8	6.183	52	6.76	60	7.066	70	7.293	80	7.389	90	7.548	110	7.591	120	7.478	135	7.112	150	6.542	152	6.542	180	5.614
14	0.0	0.0	42.3	6.329	52	6.954	60	7.244	70	7.507	80	7.645	90	7.741	110	7.901	120	7.84	135	7.523	150	7.053	168.7	6.568	180	6.364
16	0.0	0.0	41.4	6.425	52	7.08	60	7.367	70	7.642	80	7.84	90	7.882	110	8.152	120	8.152	135	7.898	150	7.459	173	6.985	180	6.892
20	0.0	0.0	40.9	6.535	52	7.218	60	7.515	70	7.813	80	8.075	90	8.207	110	8.514	120	8.659	135	8.534	150	8.164	175	7.71	180	7.651
`;

export const CATALINA22_POLARS = `
!	Twa0	Bsp0	TwaUp	BspUp	Twa1	Bsp1	Twa2	Bsp2	Twa3	Bsp3	TwaDn	BspDn	Twa4	Bsp4
2	30	0.67	42	0.90	50	1.01	90	1.27	130	1.02	140	0.89	180	0.60
4	30	1.61	44	2.17	50	2.37	90	2.95	130	2.39	140	2.08	180	1.45
6	30	2.54	44	3.39	50	3.71	90	4.56	130	3.77	146	3.10	180	2.46
8	30	3.19	44	4.10	50	4.44	90	5.20	130	4.67	150	3.91	180	2.93
10	30	3.76	38	4.30	50	4.88	90	5.52	130	5.19	158	4.50	180	3.54
12	30	3.82	38	4.50	50	5.09	90	5.69	130	5.59	162	4.74	180	4.24
14	30	4.01	38	4.60	50	5.19	90	5.84	130	5.89	176	4.99	180	4.95
16	30	4.14	36	4.62	50	5.27	90	5.98	130	6.14	176	5.40	180	5.36
20	30	4.21	36	4.71	50	5.36	90	6.16	130	6.55	176	5.90	180	5.84
24	30	4.26	36	4.81	50	5.44	90	6.34	130	6.98	178	6.46	180	6.42
28	30	4.52	36	5.02	50	5.61	90	6.67	130	7.52	179	7.29	180	7.28
`;