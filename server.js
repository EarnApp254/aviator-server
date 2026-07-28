const express = require("express");
const cors = require("cors");
const db = require("./firebase-admin");

const app = express();

app.use(cors());
app.use(express.json());

// ==================================
// CRASH GENERATOR
// ==================================

function generateCrashPoint() {

    const r = Math.random();

    if (r < 0.65) {
        return +(1 + Math.random() * 2).toFixed(2);
    }

    if (r < 0.90) {
        return +(4 + Math.random() * 6).toFixed(2);
    }

    if (r < 0.98) {
        return +(10 + Math.random() * 40).toFixed(2);
    }

    return +(50 + Math.random() * 100).toFixed(2);
}

// ==================================
// INITIALIZE GAME
// ==================================

async function initializeGame() {

    const gameRef =
        db.collection("game")
          .doc("state");

    const snap =
        await gameRef.get();

    if (snap.exists) {

        console.log(
            "Game already initialized"
        );

        return;
    }

    const currentCrash =
        generateCrashPoint();

    const nextCrash =
        generateCrashPoint();

    await gameRef.set({

        currentRound: {
            roundId: Date.now(),
            crashPoint: currentCrash
        },

        nextRound: {
            roundId: Date.now() + 1,
            crashPoint: nextCrash
        }

    });

    console.log(
        "Game initialized"
    );

}

// ==================================
// SAVE HISTORY
// ==================================

async function saveRound(result) {

    try {

        const ref =
            db.collection("roundHistory")
              .doc("latest");

        const snap =
            await ref.get();

        let history = [];

        if (snap.exists) {

            history =
                snap.data().history || [];

        }

        history.unshift({

            result:
                Number(result).toFixed(2),

            time:
                Date.now()

        });

        history =
            history.slice(0,24);

        await ref.set({
            history
        });

    } catch(err) {

        console.error(err);

    }

}

// ==================================
// PROMOTE NEXT ROUND
// ==================================

async function crashCurrentRound() {

    try {

        const gameRef =
            db.collection("game")
              .doc("state");

        const snap =
            await gameRef.get();

        if (!snap.exists) return;

        const data =
            snap.data();

        const finishedRound =
            data.currentRound;

        await saveRound(
            finishedRound.crashPoint
        );

        const newNext = {

            roundId:
                Date.now() + 999,

            crashPoint:
                generateCrashPoint()

        };

        await gameRef.update({

            currentRound:
                data.nextRound,

            nextRound:
                newNext

        });

        console.log(
            "Promoted round"
        );

    } catch(err) {

        console.error(err);

    }

}

// ==================================
// ROUTES
// ==================================

app.get("/", (req,res)=>{

    res.send(
        "AVIATOR SERVER ONLINE"
    );

});

// Client reads current round

app.get("/current-round",

async (req,res)=>{

    try {

        const snap =
            await db
            .collection("game")
            .doc("state")
            .get();

        if (!snap.exists) {

            return res
            .status(404)
            .json({
                error:"No game"
            });

        }

        res.json(
            snap.data().currentRound
        );

    } catch(err) {

        res.status(500)
        .json({
            error:err.message
        });

    }

});

// Client calls after crash

app.post("/round-crashed",

async (req,res)=>{

    try {

        await crashCurrentRound();

        res.json({
            success:true
        });

    } catch(err) {

        res.status(500)
        .json({
            success:false,
            error:err.message
        });

    }

});

// ==================================
// START
// ==================================

const PORT =
    process.env.PORT || 5000;

initializeGame()
.then(()=>{

    app.listen(PORT,()=>{

        console.log(
            "Server running on",
            PORT
        );

    });

});