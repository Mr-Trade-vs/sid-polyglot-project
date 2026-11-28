(() => {
    function expectRejection(collection, document, expectedCode) {
        try {
            collection.insertOne(document);
        } catch (error) {
            if (error.code !== expectedCode) throw error;
            return;
        }
        collection.deleteOne({ _id: document._id });
        throw new Error(collection.getName() + ": se esperaba el error " + expectedCode);
    }

    const movie = db.contents.findOne({ _id: ObjectId("6741a0f2c3b1e2a4d5f60001") });
    const list = db.my_list_items.findOne({ _id: ObjectId("6741a0f2c3b1e2a4d5f60200") });
    const progress = db.playback_progress.findOne({ _id: ObjectId("6741a0f2c3b1e2a4d5f60400") });
    if (!movie || !list || !progress) throw new Error("Ejecuta seed.js primero.");

    const validMovie = { ...movie, _id: ObjectId() };
    db.contents.insertOne(validMovie);
    db.contents.deleteOne({ _id: validMovie._id });

    expectRejection(db.contents, { ...movie, _id: ObjectId(), age_rating: NumberInt(13) }, 121);
    expectRejection(db.contents, { ...movie, _id: ObjectId(), duration_sec: NumberInt(-1) }, 121);
    expectRejection(db.my_list_items, { ...list, _id: ObjectId() }, 11000);
    expectRejection(db.playback_progress, { ...progress, _id: ObjectId() }, 11000);
    print("Validación y unicidad verificadas.");
})();
