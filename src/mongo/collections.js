const integer = { bsonType: ["int", "long"] };
const seconds = { ...integer, minimum: 0 };
const duration = { ...integer, minimum: 1 };
const id = { bsonType: "objectId" };
const date = { bsonType: "date" };
const string = { bsonType: "string", minLength: 1 };
const bool = { bsonType: "bool" };
const strings = { bsonType: "array", items: string };
const object = (properties, required = Object.keys(properties)) => ({
    bsonType: "object", required, properties
});
const array = (items) => ({ bsonType: "array", items });
const choice = (...values) => ({ enum: values });
const profile = { account_id: integer, profile_id: integer, content_id: id };
const playback = {
    ...profile,
    content_type: choice("movie", "series", "documentary"),
    episode_id: { bsonType: ["objectId", "null"] },
    duration_sec: duration,
    completed: bool
};
const episodeRule = {
    oneOf: [
        { properties: { content_type: choice("series"), episode_id: id } },
        { properties: {
            content_type: choice("movie", "documentary"),
            episode_id: { bsonType: "null" }
        } }
    ]
};

const episode = object({
    episode_id: id, number: duration, title: string, synopsis: string,
    duration_sec: duration
});
const season = object({
    number: duration, description: string, episodes: array(episode)
});
const contents = object({
    type: choice("movie", "series", "documentary"),
    title: string, synopsis: string, release_year: integer,
    genres: { ...strings, uniqueItems: true },
    production_countries: strings, audio_languages: strings,
    subtitle_languages: strings, age_rating: choice(0, 7, 12, 15, 18),
    cover_url: string, status: choice("draft", "published", "retired"),
    created_at: date, updated_at: date, schema_version: duration
});
Object.assign(contents.properties, {
    published_at: date, retired_at: date, duration_sec: duration,
    directors: strings, topics: strings, seasons: array(season),
    cast: array(object({ name: string, character: string }, ["name"])),
    interviewees: array(object({ name: string, role: string }, ["name"])),
    sources: array(object({ name: string, kind: string }, ["name"]))
});
contents.oneOf = [
    { properties: { type: choice("movie") }, required: ["duration_sec", "directors", "cast"] },
    { properties: { type: choice("series") }, required: ["seasons"] },
    { properties: { type: choice("documentary") }, required: ["duration_sec", "directors", "topics"] }
];

const sessions = object({
    ...playback, subscription_id: integer, plan_id: integer,
    status: choice("open", "closed"), started_at: date, last_event_at: date,
    start_position_sec: seconds, last_position_sec: seconds, watched_sec: seconds
});
Object.assign(sessions.properties, {
    ended_at: { bsonType: ["date", "null"] },
    end_reason: { bsonType: ["string", "null"] }
});
Object.assign(sessions, episodeRule);

const progress = {
    ...object({
        ...playback, position_sec: seconds, last_session_id: id, updated_at: date
    }),
    ...episodeRule
};
const admins = object({
    email: string, name: string, password_hash: string,
    role: choice("admin"), is_active: bool, created_at: date
});
admins.properties.last_login_at = { bsonType: ["date", "null"] };

const schemas = {
    contents,
    my_list_items: object({ ...profile, added_at: date }),
    playback_sessions: sessions,
    playback_progress: progress,
    admin_users: admins
};

const existing = new Set(db.getCollectionNames());
for (const [name, schema] of Object.entries(schemas)) {
    const options = {
        validator: { $jsonSchema: schema },
        validationLevel: "strict",
        validationAction: "error"
    };
    const result = existing.has(name)
        ? db.runCommand({ collMod: name, ...options })
        : db.createCollection(name, options);
    if (result.ok !== 1) {
        throw new Error(name + ": " + JSON.stringify(result));
    }
}
