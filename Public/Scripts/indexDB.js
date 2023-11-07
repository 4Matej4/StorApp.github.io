let db;
const requestDB = indexedDB.open("myDatabase", 1);

requestDB.onerror = () =>{
    console.error("Error opening database");
}

requestDB.onsuccess = () =>{
    console.log("Success");
    db = requestDB.result;
}

requestDB.onupgradeneeded = init => {
    console.log("Upgrade fired")
    const db = init.target.result

    db.onerror = () => {
        console.error("Error loading database");
    }

    //! Vytvorenie tabuliek 
    const crops = db.createObjectStore("crops", {keyPath: "id", autoIncrement: true})
    const fields = db.createObjectStore("fields", {keyPath: "id", autoIncrement: true})
    const storages = db.createObjectStore("storages", {keyPath: "id", autoIncrement: true})
    const records = db.createObjectStore("records", {keyPath: "id", autoIncrement: true})

    //! Stplce v crops + cropID (automaticky)
    crops.createIndex("cropName", "cropName", {unique: false})
    crops.createIndex("cropType", "cropType", {unique: false})
    crops.createIndex("cropKod", "cropKod", {unique: false})

    //! Stplce v fields + fieldID (automaticky)
    fields.createIndex("fieldName", "fieldName", {unique: true})
    fields.createIndex("fieldArea", "fieldArea", {unique: false})
    fields.createIndex("sowedCrop", "sowedCrop", {unique: false})
    fields.createIndex("sowedCType", "sowedCType", {unique: false})


    //! Stlpce v storages + storageID (automaticky)
    storages.createIndex("storageName", "storageName", {unique: false})

    //! Stplce v records + recordID (automaticky)
    records.createIndex("cropName", "cropName", {unique: false})
    records.createIndex("cropType", "cropType", {unique: false})
    records.createIndex("fieldName", "fieldName", {unique: false})
    records.createIndex("nettoLoad", "nettoLoad", {unique: false})
    records.createIndex("storageName", "storageName", {unique: false})
    records.createIndex("loadMoisture", "loadMoisture", {unique: false})
    records.createIndex("fieldArea", "fieldArea", {unique:false})
}

