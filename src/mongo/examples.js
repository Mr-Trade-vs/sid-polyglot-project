(() => {
    // Run only against a test database initialized with seed.js.
    const contentId = ObjectId("6741a0f2c3b1e2a4d5f60002");
    const episodeId = ObjectId("6741a0f2c3b1e2a4d5f60101");
    const viewer = { account_id: NumberInt(310), profile_id: NumberInt(1042) };
    const piece = { ...viewer, content_id: contentId, episode_id: episodeId };
    const listItem = { ...viewer, content_id: contentId };
    const sessionId = ObjectId();
    const now = new Date();

    printjson(db.contents.find(
        { status: "published", age_rating: { $lte: 12 } }, { seasons: 0 }
    ).sort({ release_year: -1, _id: 1 }).limit(10).toArray());

    // Use an isolated fixture to demonstrate administrative updates and list changes.
    const draftId = ObjectId();
    const template = db.contents.findOne({ _id: contentId });
    if (!template) throw new Error("Ejecuta seed.js primero.");
    try {
        db.contents.insertOne({ ...template, _id: draftId, status: "draft", title: "Ejemplo de catálogo" });
        db.contents.updateOne({ _id: draftId }, { $set: { status: "published", updated_at: now } });
        db.my_list_items.insertOne({ ...listItem, content_id: draftId, added_at: now });
        printjson(db.my_list_items.find(viewer).sort({ added_at: -1 }).toArray());
        db.my_list_items.deleteOne({ ...viewer, content_id: draftId });
        db.contents.updateOne({ _id: draftId }, { $set: { status: "retired", retired_at: now, updated_at: now } });
    } finally {
        db.my_list_items.deleteOne({ ...viewer, content_id: draftId });
        db.contents.deleteOne({ _id: draftId });
    }

    // Oracle authorization and episode validation must precede this write in the app.
    const previous = db.playback_progress.findOne(piece);
    if (!previous || previous.completed) throw new Error("Falta el progreso inicial del ejemplo.");
    const position = Number(previous.position_sec);
    const end = new Date(now.getTime() + 10000);
    const session = {
        ...piece, _id: sessionId, content_type: "series",
        subscription_id: NumberInt(5581), plan_id: NumberInt(2),
        duration_sec: previous.duration_sec, completed: false,
        status: "open", started_at: now, last_event_at: now,
        start_position_sec: previous.position_sec, last_position_sec: previous.position_sec,
        watched_sec: NumberInt(0)
    };
    try {
        db.playback_sessions.insertOne(session);
        const recordEvent = () => db.playback_sessions.updateOne(
            { _id: sessionId, ...viewer, status: "open", last_event_at: { $lt: end } },
            {
                $set: { last_event_at: end, last_position_sec: NumberInt(position + 10) },
                $inc: { watched_sec: NumberInt(10) }
            }
        ).modifiedCount;
        if (recordEvent() !== 1 || recordEvent() !== 0) {
            throw new Error("El evento repetido modificó la sesión.");
        }
        db.playback_sessions.updateOne(
            { _id: sessionId, ...viewer, status: "open" },
            { $set: { status: "closed", ended_at: end, end_reason: "exit" } }
        );
        db.playback_progress.updateOne(
            { _id: previous._id, ...piece },
            { $set: { position_sec: NumberInt(position + 10), updated_at: end, last_session_id: sessionId } }
        );
        printjson(db.playback_progress.find({ ...viewer, completed: false }).sort({ updated_at: -1 }).toArray());
        printjson(db.playback_sessions.find(viewer).sort({ started_at: -1 }).toArray());

        const from = ISODate("2026-11-01T00:00:00Z");
        const to = new Date(Math.max(end.getTime() + 1, Date.parse("2026-12-01T00:00:00Z")));
        // The application resolves plan_id against Oracle for the final report.
        printjson(db.playback_sessions.aggregate([
            { $match: { started_at: { $gte: from, $lt: to } } },
            { $group: {
                _id: { plan_id: "$plan_id", content_type: "$content_type", profile_id: "$profile_id" },
                seconds: { $sum: "$watched_sec" }
            } },
            { $group: {
                _id: { plan_id: "$_id.plan_id", content_type: "$_id.content_type" },
                seconds: { $sum: "$seconds" }, profiles: { $sum: 1 }
            } },
            { $project: { profiles: 1, minutes: { $divide: ["$seconds", 60] } } }
        ]).toArray());
    } finally {
        db.playback_progress.replaceOne({ _id: previous._id, last_session_id: sessionId }, previous);
        db.playback_sessions.deleteOne({ _id: sessionId });
    }
})();
