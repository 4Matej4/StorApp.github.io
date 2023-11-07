const recordForm = document.getElementById('record_setter')
const selectFieldN = document.getElementById('field_name')
const selectFieldC = document.getElementById('crop_name')
const selectStorage = document.getElementById('storage_name')
const loadNetto = document.getElementById('imported_amount')
const moisture = document.getElementById('cargo_moisture')
const historyList = document.getElementById('history_list')
const clearBtn = document.getElementById('clearBtn')
const exportBtn = document.getElementById('exportBtn')

let db;

const requestDB = indexedDB.open("myDatabase", 1);

requestDB.onerror = () => {
    console.error("Erorr openning database");
}

requestDB.onsuccess = () => {
    db = requestDB.result;
    console.log("Database openning successfull");
    showRecords()
    fillFieldSelect()
    fillStorageSelect()
    fillCropSelect()
}

requestDB.onupgradeneeded = (init) => {
    db = init.target.result;
    console.log("Upgrade fired")
}

function fillStorageSelect() {
    const transaction = db.transaction("storages", "readonly")
    const objectStore = transaction.objectStore("storages")
    const reqCursor = objectStore.openCursor()

    reqCursor.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
            const option = document.createElement('option')

            option.setAttribute("value", cursor.value.storageName)
            option.textContent = `${cursor.value.storageName}`

            selectStorage.appendChild(option)
            cursor.continue();
        } else {
            if (selectStorage <= 1) {
                const option = document.createElement("option");
                option.textContent = 'Doposial neboli nahraté žiadne záznamy.'
                selectStorage.appendChild(option)
            }
        }
    }
}

function fillFieldSelect() {
    const transaction = db.transaction("fields", "readonly");
    const objectStore = transaction.objectStore("fields")
    const reqCursor = objectStore.openCursor();

    reqCursor.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
            //* Filling fieldSelect
            const optionField = document.createElement('option')

            optionField.setAttribute("value", cursor.value.fieldName)
            optionField.setAttribute("area", cursor.value.fieldArea)
            optionField.textContent = `${cursor.value.fieldName} ${cursor.value.fieldArea} ${cursor.value.sowedCrop} ${cursor.value.sowedCType}`
            selectFieldN.appendChild(optionField)

            cursor.continue()
        } else {
            if (selectFieldN <= 1) {
                const option = document.createElement("option");
                option.textContent = 'Doposial neboli nahraté žiadne záznamy.'
                selectFieldN.appendChild(option)
            }
        }
    }
}

selectFieldN.addEventListener('change', function () {
    const selectedFieldValue = selectFieldN.value;
    fillCropSelect(selectedFieldValue);
});

function fillCropSelect(selectedFieldValue) {
    selectFieldC.innerHTML = '';
    const transaction = db.transaction("fields", "readonly");
    const objectStore = transaction.objectStore("fields");
    const reqCursor = objectStore.openCursor();

    reqCursor.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
            const fieldObject = cursor.value;
    
            if (fieldObject.fieldName === selectedFieldValue) {
                const optionCrop = document.createElement('option');
                optionCrop.setAttribute("value", fieldObject.sowedCType);
                optionCrop.setAttribute("crop", fieldObject.sowedCrop);
                optionCrop.textContent = `${fieldObject.sowedCrop} ${fieldObject.sowedCType}`;
                selectFieldC.appendChild(optionCrop);
            }

            cursor.continue();
        }
    }
}

recordForm.addEventListener('submit', addRecord)

function addRecord(event) {
    event.preventDefault()

    const newRecord ={
        cropType: selectFieldC.options[selectFieldC.selectedIndex].value,
        cropName:  selectFieldC.options[selectFieldC.selectedIndex].getAttribute("crop"),
        fieldName: selectFieldN.options[selectFieldN.selectedIndex].value,
        nettoLoad: loadNetto.value,
        storageName: selectStorage.options[selectStorage.selectedIndex].value,
        loadMoisture: moisture.value,
        fieldArea: selectFieldN.options[selectFieldN.selectedIndex].getAttribute("area")
    }

    const transaction = db.transaction(["records"], "readwrite")
    const objectStore = transaction.objectStore("records")
    const addRequest = objectStore.add(newRecord)

    addRequest.onsuccess = () =>{
        loadNetto.value = '',
        moisture.value = '' 
    }

    transaction.oncomplete = () =>{
        showRecords()
        console.log("Záznam nahratý");
    }

    transaction.onerror = () =>{
        console.log("Chyba pri nahrávaní recordu")
    }
}

function showRecords() {
    while (historyList.firstChild){
        historyList.removeChild(historyList.firstChild);
    }

    const transaction = db.transaction("records", "readonly")
    const objectStore = transaction.objectStore("records")
    const showRequest = objectStore.openCursor();

    showRequest.onsuccess = (event) =>{
        const cursor = event.target.result;

        if(cursor){
            const listItem = document.createElement('li')
            const p = document.createElement('p')
            const trashBtn = document.createElement('button')

            listItem.appendChild(p)
            listItem.appendChild(trashBtn)

            listItem.className = "history_list li"
            trashBtn.className = "record_icon delete"

            historyList.appendChild(listItem)
            p.textContent = `${cursor.value.fieldName} | ${cursor.value.fieldArea} | ${cursor.value.cropName} | ${cursor.value.cropType} | ${cursor.value.storageName} | ${cursor.value.nettoLoad} kg | ${cursor.value.loadMoisture} %`
            listItem.setAttribute("data-id", cursor.value.id)

            trashBtn.addEventListener('click', deleteItem)
            cursor.continue();
        }else{
            if(!historyList.firstChild){
                const listItem = document.createElement('li');
                listItem.textContent = "Doposial neboli nahraté žiadne záznamy."
                historyList.appendChild(listItem)
            }
        }
    }
}

function deleteItem(event) {
    const itemID = Number(event.target.parentNode.getAttribute('data-id'))
    const transaction = db.transaction(['records'], 'readwrite');
    const objectStore = transaction.objectStore('records');

    objectStore.delete(itemID);

    transaction.oncomplete = () => {
        event.target.parentNode.parentNode.removeChild(event.target.parentNode)
        if (!historyList.firstChild) {
            const listItem = document.createElement('li');
            listItem.textContent = 'Doposiaľ neboli nahraté žiadne záznamy.';
            historyList.appendChild(listItem);
        }
    }

    transaction.onerror = () => console.log("Chyba transakcie pri mazaní záznamu");
}

clearBtn.addEventListener('click', clear)

function clear() {
    const transaction = db.transaction(["records"], "readwrite")
    const objectStore = transaction.objectStore("records")
    const deleteRequest = objectStore.clear();

    transaction.oncomplete = () =>{
        console.log("Všetko zmazane");
    }

    transaction.onerror = () =>{
        console.log("Chyba pri celkovom mazaní");
    }

    deleteRequest.onsuccess = () =>{
        console.log("Request mazania úspešný");
    }

    location.reload()
}


exportBtn.addEventListener('click', () =>{
    window.location.href = 'export.html'
})
