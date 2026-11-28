(() => {
    // Supply a hash for a test password in the format expected by the backend.
    const adminHash = process.env.CINECONECTA_TEST_ADMIN_HASH;
    if (!adminHash || !/^\$(argon2id\$|2[aby]\$)/.test(adminHash)) {
        throw new Error("Define CINECONECTA_TEST_ADMIN_HASH con un hash Argon2id o bcrypt de prueba.");
    }

    // Provisional Oracle IDs. Align these two records with the relational seed.
    const viewers = [
        { account_id: 310, profile_id: 1042, subscription_id: 5581, plan_id: 2 },
        { account_id: 311, profile_id: 1043, subscription_id: 5582, plan_id: 1 }
    ].map(record => Object.fromEntries(
        Object.entries(record).map(([key, value]) => [key, NumberInt(value)])
    ));

    const oid = (suffix) => ObjectId("6741a0f2c3b1e2a4d5f6" + suffix);
    const createdAt = ISODate("2026-11-01T13:00:00Z");
    const common = {
        synopsis: "Contenido ficticio para pruebas", release_year: NumberInt(2026),
        genres: ["Drama"], production_countries: ["CO"],
        audio_languages: ["es"], subtitle_languages: ["en"],
        cover_url: "https://example.org/cover.jpg", status: "published",
        created_at: createdAt, updated_at: createdAt, published_at: createdAt,
        schema_version: NumberInt(1)
    };
    const episode = {
        episode_id: oid("0101"), number: NumberInt(1), title: "Huellas",
        synopsis: "Un testigo cambia su versión", duration_sec: NumberInt(2940)
    };
    const movie = {
        ...common, _id: oid("0001"), type: "movie", title: "La última cosecha",
        age_rating: NumberInt(15), duration_sec: NumberInt(6420),
        directors: ["Marcela Ríos"], cast: [{ name: "Andrés Paz", character: "Julián" }]
    };
    const series = {
        ...common, _id: oid("0002"), type: "series", title: "Ríos de niebla",
        age_rating: NumberInt(12),
        seasons: [{ number: NumberInt(1), description: "La desaparición", episodes: [episode] }]
    };
    const documentary = {
        ...common, _id: oid("0003"), type: "documentary", title: "Voces del Pacífico",
        age_rating: NumberInt(7), duration_sec: NumberInt(5280),
        directors: ["Tomás Alonso"], topics: ["Música tradicional"]
    };

    const fixtures = {
        contents: [movie, series, documentary],
        my_list_items: [],
        playback_sessions: [],
        playback_progress: [],
        admin_users: [{
            _id: oid("0501"), email: "catalogo@cineconecta.example",
            name: "Administración de prueba", password_hash: adminHash,
            role: "admin", is_active: true, created_at: createdAt
        }]
    };
    const playbackCases = [
        { viewer: viewers[0], content: series, episode, position: 1800, watched: 1500 },
        { viewer: viewers[1], content: documentary, episode: null, position: 5280, watched: 5280 }
    ];
    for (const [index, sample] of playbackCases.entries()) {
        const { viewer, content, episode, position, watched } = sample;
        const { account_id, profile_id, subscription_id, plan_id } = viewer;
        const contentReference = { account_id, profile_id, content_id: content._id };
        const duration = (episode ?? content).duration_sec;
        const startedAt = ISODate("2026-11-12T01:00:00Z");
        const endedAt = new Date(startedAt.getTime() + position * 1000);
        const completed = position === Number(duration);
        const activity = {
            ...contentReference, content_type: content.type,
            episode_id: episode?.episode_id ?? null, duration_sec: duration, completed
        };
        const sessionId = oid("030" + index);

        fixtures.my_list_items.push({
            ...contentReference, _id: oid("020" + index), added_at: createdAt
        });
        fixtures.playback_sessions.push({
            ...activity, _id: sessionId, subscription_id, plan_id,
            status: "closed", started_at: startedAt, last_event_at: endedAt,
            ended_at: endedAt, start_position_sec: NumberInt(0),
            last_position_sec: NumberInt(position), watched_sec: NumberInt(watched),
            end_reason: completed ? "finished" : "exit"
        });
        fixtures.playback_progress.push({
            ...activity, _id: oid("040" + index), position_sec: NumberInt(position),
            last_session_id: sessionId, updated_at: endedAt
        });
    }

    // Run after collections.js and indexes.js. Repeating the seed avoids duplicate fixtures.
    for (const [name, documents] of Object.entries(fixtures)) {
        const collection = db.getCollection(name);
        const result = collection.bulkWrite(documents.map(({ _id, ...fields }) => ({
            updateOne: { filter: { _id }, update: { $setOnInsert: fields }, upsert: true }
        })));
        print(name + ": " + result.upsertedCount + " documentos nuevos.");
    }
})();
