// Calculate fielding points
function calculateFieldingPoints(c, stumped, lbw, bowled, runout) {
    let fpoints = c * 10 + stumped * 12 + lbw * 5 + bowled * 5 + runout * 10;
    if (c >= 3) fpoints += 5;
    if (stumped >= 3) fpoints += 5;
    return fpoints
}

// Calculate bowling points
function calculateBowlingPoints(w, m, nb, wd, zeros, econ) {
    let bpoints = w * 30 + m * 10;
    if (nb + wd >= 5) bpoints -= 5;
    if (zeros >= 10) bpoints += 6;

    if (w === 3) bpoints += 5;
    else if (w === 4) bpoints += 10;
    else if (w >= 5) bpoints += 20;
    else bpoints += 0;

    if (econ < 5) bpoints += 6;
    else if (econ >= 5 && econ <= 5.99) bpoints += 4;
    else if (econ >= 6 && econ <= 7) bpoints += 2;
    else if (econ >= 10 && econ <= 11) bpoints -= 2;
    else if (econ >= 11.01 && econ <= 12) bpoints -= 4;
    else if (econ >= 12) bpoints -= 6;
    else bpoints += 0;

    return bpoints;
}

// Calculate batting points
function calculateBatingPoints(runs, fours, sixes, dismissal, sr, balls) {
    let bpoints = 1 * runs + 1 * fours + 2 * sixes;
    if (runs === 0 && dismissal !== "not out") bpoints -= 2;

    if (runs >= 30 && runs <= 49) bpoints += 5;
    else if (runs >= 50 && runs <= 99) bpoints += 10;
    else if (runs >= 100) bpoints += 20;
    else bpoints += 0;

    if (sr >= 200 && balls >= 8) bpoints += 8;
    else if (sr >= 170.01 && sr <= 199.99 && balls >= 8) bpoints += 6;
    else if (sr >= 145.01 && sr <= 170 && balls >= 12) bpoints += 4;
    else if (sr >= 120 && sr <= 145 && balls >= 12) bpoints += 2;
    else if (sr >= 65.01 && sr <= 80 && balls >= 12) bpoints -= 2;
    else if (sr >= 50.01 && sr <= 65 && balls >= 12) bpoints -= 4;
    else if (sr >= 30 && sr <= 50 && balls >= 12) bpoints -= 6;
    else if (sr <= 30 && balls >= 12) bpoints -= 8;
    else bpoints += 0;

    return bpoints;
}

module.exports = { calculateFieldingPoints, calculateBowlingPoints, calculateBatingPoints }
