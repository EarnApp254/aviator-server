const express = require("express");
const cors = require("cors");
const db = require("./firebase-admin");

const app = express();

app.use(cors());

// ==========================
// FIREBASE TEST
// ==========================

(async () => {
    try {

        await db
            .collection("test")
            .doc("connection")
            .set({
                time: Date.now()
            });

        console.log("Firebase Connected");

    } catch (err) {

        console.error("Firebase Error:", err);

    }
})();

// ==========================
// GAME STATE
// ==========================

let currentRound = {
    roundId: Date.now(),
    startTime: Date.now()
};

let currentCrashPoint = generateCrashPoint();

// ==========================
// CRASH GENERATOR
// ==========================

function generateCrashPoint() {

    const r = Math.random();

    if (r < 0.65) {
        return +(1 + Math.random() * 2).toFixed(2);
    }

    if (r < 0.90) {
        return +(4 + Math.random() * 5.99).toFixed(2);
    }

    if (r < 0.98) {
        return +(10 + Math.random() * 40).toFixed(2);
    }

    return +(51 + Math.random() * 49).toFixed(2);
}

// ==========================
// SAVE RESULT TO FIREBASE
// ==========================

async function saveRoundToFirebase(result) {

    try {

        const historyRef =
            db.collection("roundHistory")
              .doc("latest");

        const snap = await historyRef.get();

        let history = [];

        if (snap.exists) {
            history = snap.data().history || [];
        }

        history.unshift({
            result: result.toFixed(2),
            time: Date.now()
        });

        history = history.slice(0, 24);

        await historyRef.set({
            history
        });

        console.log("Saved Result:", result);

    } catch (err) {

        console.error("Save Error:", err);

    }
}

// ==========================
// ROUND LOOP
// ==========================

function startNewRound() {

    currentRound = {
        roundId: Date.now(),
        startTime: Date.now()
    };

    currentCrashPoint = generateCrashPoint();

    console.log(
        "New Round:",
        currentRound.roundId
    );

    console.log(
        "Secret Crash:",
        currentCrashPoint
    );

    // Save AFTER round ends
    const roundCrashPoint = currentCrashPoint;

setTimeout(async () => {

    await saveRoundToFirebase(roundCrashPoint);

    console.log(
        "Round Ended:",
        roundCrashPoint
    );

}, 15000);
}

startNewRound();

// New round every 15 sec
setInterval(() => {

    startNewRound();

}, 15000);

// ==========================
// ROUTES
// ==========================

app.get("/", (req, res) => {

    res.send("AVIATOR SERVER ONLINE");

});

// Frontend only gets round ID and start time
app.get("/current-round", (req, res) => {

    res.json({
        roundId: currentRound.roundId,
        startTime: currentRound.startTime
    });

});

// ==========================
// START SERVER
// ==========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});