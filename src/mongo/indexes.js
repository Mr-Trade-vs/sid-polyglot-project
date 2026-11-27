const indexes = {
    contents: [
        { key: { status: 1, release_year: -1, _id: 1 }, name: "catalog_by_year" },
        { key: { status: 1, type: 1, release_year: -1, _id: 1 }, name: "catalog_by_type" },
        { key: { status: 1, genres: 1, release_year: -1, _id: 1 }, name: "catalog_by_genre" },
        { key: { status: 1, audio_languages: 1, release_year: -1, _id: 1 }, name: "catalog_by_audio" },
        { key: { status: 1, subtitle_languages: 1, release_year: -1, _id: 1 }, name: "catalog_by_subtitles" },
        { key: { title: "text" }, name: "catalog_title_text", default_language: "spanish" }
    ],
    my_list_items: [
        { key: { profile_id: 1, content_id: 1 }, name: "list_unique_content", unique: true },
        { key: { profile_id: 1, added_at: -1 }, name: "list_recent" }
    ],
    playback_sessions: [
        { key: { started_at: 1, plan_id: 1, content_type: 1, profile_id: 1, watched_sec: 1 }, name: "sessions_consumption" },
        { key: { profile_id: 1, started_at: -1 }, name: "sessions_history" },
        { key: { last_event_at: 1 }, name: "sessions_open_inactivity", partialFilterExpression: { status: "open" } }
    ],
    playback_progress: [
        { key: { profile_id: 1, content_id: 1, episode_id: 1 }, name: "progress_unique_piece", unique: true },
        { key: { profile_id: 1, completed: 1, updated_at: -1 }, name: "progress_continue_watching" }
    ],
    admin_users: [
        { key: { email: 1 }, name: "admin_unique_email", unique: true }
    ]
};

for (const [collection, specifications] of Object.entries(indexes)) {
    const result = db.runCommand({ createIndexes: collection, indexes: specifications });
    if (result.ok !== 1) {
        throw new Error(collection + ": " + JSON.stringify(result));
    }
}
