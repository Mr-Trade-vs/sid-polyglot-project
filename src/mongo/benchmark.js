(() => {
    if (db.getName() !== "cineconecta_benchmark") {
        throw new Error("Usa la base de prueba cineconecta_benchmark.");
    }
    const sessions = db.playback_sessions;
    const template = sessions.findOne({ status: "closed" });
    if (!template) throw new Error("Ejecuta seed.js en esta base primero.");

    const total = 50000;
    const dayMs = 86400000;
    const start = Date.parse("2026-01-01T00:00:00Z");
    const elapsed = template.ended_at.getTime() - template.started_at.getTime();
    const { _id, ...fields } = template;

    for (let offset = 0; offset < total; offset += 1000) {
        const operations = Array.from({ length: 1000 }, (_, index) => {
            const row = offset + index;
            const id = ObjectId("6749cafe" + row.toString(16).padStart(16, "0"));
            const started_at = new Date(start + (row % 365) * dayMs);
            const ended_at = new Date(started_at.getTime() + elapsed);
            return { updateOne: {
                filter: { _id: id },
                update: { $setOnInsert: { ...fields, started_at, ended_at, last_event_at: ended_at } },
                upsert: true
            } };
        });
        sessions.bulkWrite(operations);
    }

    const pipeline = [
        { $match: { started_at: {
            $gte: ISODate("2026-06-01T00:00:00Z"),
            $lt: ISODate("2026-06-08T00:00:00Z")
        } } },
        { $group: {
            _id: { plan_id: "$plan_id", content_type: "$content_type", profile_id: "$profile_id" },
            seconds: { $sum: "$watched_sec" }
        } },
        { $group: {
            _id: { plan_id: "$_id.plan_id", content_type: "$_id.content_type" },
            seconds: { $sum: "$seconds" }, profiles: { $sum: 1 }
        } },
        { $project: { profiles: 1, minutes: { $divide: ["$seconds", 60] } } }
    ];

    printjson({ totalSessions: sessions.countDocuments(), matchedSessions: sessions.countDocuments(pipeline[0].$match) });
    // Alternate plans on the same data and retain the full explain output.
    for (let repetition = 1; repetition <= 3; repetition++) {
        for (const hint of [{ $natural: 1 }, "sessions_consumption"]) {
            printjson({ repetition, hint, explain: sessions.explain("executionStats").aggregate(pipeline, { hint }) });
        }
    }
})();
