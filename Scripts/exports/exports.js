const btnF = document.getElementById("filterFieldName");
const btnCN = document.getElementById("filterCropName");
const btnCT = document.getElementById("filterCropType")
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");

let db;

const requestDB = indexedDB.open("myDatabase", 1);

requestDB.onerror = () => {
    console.error("Error opening database");
};

requestDB.onsuccess = () => {
    db = requestDB.result;
    console.log("Opening successful");
    
    btnF.addEventListener('click', displayFields);
    btnCN.addEventListener('click', displayCrops);
    btnCT.addEventListener('click', displayCropTypes)
};

requestDB.onupgradeneeded = (event) => {
    const db = event.target.result;
    console.log("Upgrade fired");
};


async function displayFields() {
    const uniqueFieldNames = await getUniqueFieldNames();

    tableHead.innerHTML = `
    <tr>
        <th>Názov poľa</th>
        <th>Výmera poľa</th>
        <th>Vysiata plodina</th>
        <th>Odroda vysiatej plodiny</th>
        <th>Celkové dovezené množstvo [kg]</th>
        <th>Priemerný výnos [kg/ha]</th>
    </tr>`;
    tableBody.innerHTML = '';

    for (const fieldName of uniqueFieldNames) {
        const totalLoad = await queryLoad(fieldName);
        const totalYield = await calculateYield(totalLoad, fieldName);
        const cropInfo = await getCropInfo(fieldName);

        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
        <td>${fieldName}</td>
        <td>${totalYield.fieldArea}</td>
        <td>${cropInfo.cropName}</td>
        <td>${cropInfo.cropType}</td>
        <td>${totalLoad}</td>
        <td class="td-highlight">${totalYield.yield}</td>`;

        tableBody.appendChild(tableRow);
    }
}


async function getCropInfo(fieldName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("fields", "readonly");
        const objectStore = transaction.objectStore("fields");
        const nameIndex = objectStore.index("fieldName");
        const query = nameIndex.openCursor(IDBKeyRange.only(fieldName));
        let cropName = "";
        let cropType = "";

        query.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cropName = cursor.value.sowedCrop;
                cropType = cursor.value.sowedCType;
                cursor.continue();
            } else {
                resolve({ cropName, cropType });
            }
        };

        query.onerror = () => {
            reject("Error querying crop information");
        };
    });
}


async function getUniqueFieldNames() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("records", "readonly");
        const objectStore = transaction.objectStore("records");
        const fieldNameIndex = objectStore.index("fieldName");
        const uniqueFieldsArr = [];
        const query = fieldNameIndex.openKeyCursor(null, "nextunique");

        query.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                uniqueFieldsArr.push(cursor.key);
                cursor.continue();
            } else {
                resolve(uniqueFieldsArr);
            }
        };

        query.onerror = () => {
            reject("Error getting unique field names");
        };
    });
}

async function queryLoad(fieldName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("records", "readonly");
        const objectStore = transaction.objectStore("records");
        const nameIndex = objectStore.index("fieldName");
        const query = nameIndex.openCursor(IDBKeyRange.only(fieldName));
        let totalLoad = 0;

        query.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const nettoLoad = parseFloat(cursor.value.nettoLoad);
                if (!isNaN(nettoLoad)) {
                    totalLoad += nettoLoad;
                }
                cursor.continue();
            } else {
                resolve(totalLoad);
            }
        };

        query.onerror = () => {
            reject("Error querying data");
        };
    });
}

async function calculateYield(totalLoad, fieldName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("fields", "readonly");
        const objectStore = transaction.objectStore("fields");
        const nameIndex = objectStore.index("fieldName");
        const query = nameIndex.openCursor(IDBKeyRange.only(fieldName));

        let fieldArea = 0;

        query.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const area = parseFloat(cursor.value.fieldArea);
                if (!isNaN(area)) {
                    fieldArea += area;
                }
                cursor.continue();
            } else {
                const yield = (totalLoad / fieldArea).toFixed(3);
                resolve({ fieldArea, yield });
            }
        };

        query.onerror = () => {
            reject("Error querying field areas");
        };
    });
}


//*Filtrovanie podla plodiny
async function displayCrops() {
    const uniqueCropNames = await getUniqueCropNames();

    tableHead.innerHTML = `
    <tr>
        <th>Názov plodiny</th>
        <th>Celková výmera</th>
        <th>Celkové dovezené množstvo [kg]</th>
        <th>Priemerný výnos [kg/ha]</th>
    </tr>`;

    tableBody.innerHTML = '';

    for (const cropName of uniqueCropNames) {
        const cropLoad = await calculateCropLoad(cropName);
        const yield = await calculate(cropLoad, cropName);

        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
        <td>${cropName}</td>
        <td>${yield.fieldArea}</td>
        <td>${cropLoad}</td>
        <td class="td-highlight">${yield.yield}</td>`;;

        tableBody.appendChild(tableRow);
    }
}

function getUniqueCropNames() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("crops", "readonly");
        const store = tx.objectStore("crops");
        const idx = store.index("cropName");
        const query = idx.openKeyCursor(null, "nextunique");

        let uniqueCNArr = [];

        query.onsuccess = (event) => {
            const cursor = event.target.result;

            if (cursor) {
                uniqueCNArr.push(cursor.key)
                cursor.continue();
            } else {
                resolve(uniqueCNArr);
            }
        }

        query.onerror = () => {
            reject("Error getting unique crop names");
        };
    });
}

async function calculateCropLoad(cropName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("records", "readonly");
        const objectStore = transaction.objectStore("records");
        const idx = objectStore.index("cropName");
        const query = idx.openCursor(IDBKeyRange.only(cropName));
        let cropLoad = 0;

        query.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const load = parseFloat(cursor.value.nettoLoad);
                if (!isNaN(load)) {
                    cropLoad += load;
                }
                cursor.continue();
            } else {
                resolve(cropLoad);
            }
        };
    });
}

async function calculate(cropLoad, cropName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("fields", "readonly");
        const objectStore = transaction.objectStore("fields");
        const idx = objectStore.index("sowedCrop");
        const query = idx.openCursor(IDBKeyRange.only(cropName));

        let fieldArea = 0;

        query.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const area = parseFloat(cursor.value.fieldArea);
                if (!isNaN(area)) {
                    fieldArea += area;
                }
                cursor.continue();
            } else {
                const yield = (cropLoad / fieldArea).toFixed(3);
                resolve({fieldArea, yield});
            }
        };

        query.onerror = () => {
            reject("Error querying field areas");
        };
    });
}


//* Filtrovanie podla odrody
async function displayCropTypes() {
    const uniqueCropTypes = await getUniqueCropTypes();

    tableHead.innerHTML = `
    <tr>
        <th>Názov odrody</th>
        <th>Názov plodiny</th>
        <th>Celková výmera</th>
        <th>Celkové dovezené množstvo [kg]</th>
        <th>Priemerný výnos [kg/ha]</th>
    </tr>
    `;
    tableBody.innerHTML = '';

    for (const cropType of uniqueCropTypes) {
        const cropLoad = await calculateTypeLoad(cropType);
        const yield = await calculateType(cropLoad, cropType);

        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
        <td>${cropType}</td>
        <td>${yield.cName}</td>
        <td>${yield.fieldArea}</td>
        <td>${cropLoad}</td>
        <td class="td-highlight">${yield.yield}</td>
        `;

        tableBody.appendChild(tableRow);
    }
}

function getUniqueCropTypes() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("crops", "readonly");
        const store = tx.objectStore("crops");
        const idx = store.index("cropType");
        const query = idx.openKeyCursor(null, "nextunique");

        let uniqueCTArr = [];

        query.onsuccess = (event) => {
            const cursor = event.target.result;

            if (cursor) {
                uniqueCTArr.push(cursor.key)
                cursor.continue();
            } else {
                resolve(uniqueCTArr)
            }
        }

        query.onerror = () => {
            reject("Error getting unique crop names");
        };
    });
}

async function calculateTypeLoad(cropType) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("records", "readonly");
        const objectStore = transaction.objectStore("records");
        const idx = objectStore.index("cropType");
        const query = idx.openCursor(IDBKeyRange.only(cropType));
        let cropLoad = 0;

        query.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const load = parseFloat(cursor.value.nettoLoad);
                if (!isNaN(load)) {
                    cropLoad += load;
                }
                cursor.continue();
            } else {
                resolve(cropLoad);
            }
        };
    });
}

async function calculateType(cropLoad, cropType) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("fields", "readonly");
        const objectStore = transaction.objectStore("fields");
        const idx = objectStore.index("sowedCType");
        const query = idx.openCursor(IDBKeyRange.only(cropType));

        let fieldArea = 0;
        let cName = ""
        query.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const area = parseFloat(cursor.value.fieldArea);
                if (!isNaN(area)) {
                    fieldArea += area;
                    cName = cursor.value.sowedCrop
                }
                cursor.continue();
            } else {
                const yield = (cropLoad / fieldArea).toFixed(3);
                resolve({fieldArea, yield, cName});
            }
        };

        query.onerror = () => {
            reject("Error querying field areas");
        };
    });
}


