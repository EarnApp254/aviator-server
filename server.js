const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

let currentRound = {
    roundId: Date.now(),
    crashPoint: 2.00,
    startTime: Date.now()
};

function generateCrashPoint() {

    const r = Math.random();

    if (r < 0.65) {
    return +(1.00 + Math.random() * 2.00).toFixed(2);
}
else if (r < 0.90) {
    return +(4 + Math.random() * 5.99).toFixed(2);
}
else if (r < 0.98) {
    return +(10 + Math.random() * 40).toFixed(2);
}
else {
    return +(51 + Math.random() * 49).toFixed(2);
}
}

app.get("/", (req, res) => {
    res.send("MY AVIATOR SERVER WORKS");
});

app.get("/current-round", (req, res) => {
    res.json(currentRound);
});

// Generate a new round every 15 seconds
setInterval(() => {

    currentRound = {
        roundId: Date.now(),
        crashPoint: generateCrashPoint(),
        startTime: Date.now()
    };

    console.log("New Round:", currentRound);

}, 15000);

app.listen(5000, () => {
    console.log("Aviator server running on http://localhost:5000");
});