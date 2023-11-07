const fieldForm = document.getElementById('field_setter')
const fieldN = document.getElementById('field_name')
const fieldA = document.getElementById('field_area')
const selectElement = document.getElementById('sowed_crop')
const historyList = document.getElementById('history_list')
const clearBtn = document.getElementById('clearBtn')


let db;
const requestDb = indexedDB.open("myDatabase", 1)

requestDb.onerror = () => {
    console.error("Error opening database");
}

requestDb.onsuccess = () => {
    db = requestDb.result;
    fillSelect()
    showFields()
    console.log("Successfuly opened");
}

requestDb.onupgradeneeded = (init) => {
    const db = init.target.result;

    console.log("Upgrade fired")
}

fieldForm.addEventListener('submit', addField)

function addField(event) {
    event.preventDefault()

    const newField = {
        fieldName: fieldN.value,
        fieldArea: fieldA.value,
        sowedCrop: selectElement.options[selectElement.selectedIndex].getAttribute("crop"),
        sowedCType: selectElement.options[selectElement.selectedIndex].value
    }

    const transaction = db.transaction(["fields"], "readwrite")
    const objectStore = transaction.objectStore("fields")
    const addRequest = objectStore.add(newField)

    addRequest.onsuccess = () =>{
        fieldN.value = ''
        fieldA.value = ''
    }

    transaction.oncomplete = () =>{
        console.log("Pole pridané");
        showFields()
    }

    transaction.onerror = () =>{
        console.error("Error pri transakcii pola");
        const div = document.getElementById("field_form")
        const errorMsg = document.createElement("h2")

        errorMsg.className = 'error_msg'
        errorMsg.textContent = "Pravdepodobne sa pokúšate nahrať pole s už existujúcim názvom!"
        div.appendChild(errorMsg);
    }
}


function fillSelect() {
    const transaction = db.transaction("crops", "readonly")
    const objectStore = transaction.objectStore("crops")
    const reqCursor = objectStore.openCursor()

    reqCursor.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
            const option = document.createElement("option")
            option.setAttribute("value", cursor.value.cropType)
            option.setAttribute("crop", cursor.value.cropName)
            option.textContent = `${cursor.value.cropName} ${cursor.value.cropType}`

            selectElement.appendChild(option)
            cursor.continue();
        } else {
            if (selectElement.length <= 1){
                const option = document.createElement("option");
                option.textContent = 'Doposial neboli nahraté žiadne záznamy.'
                selectElement.appendChild(option)
            }
        }
    }
}

function showFields() {
    while (historyList.firstChild){
        historyList.removeChild(historyList.firstChild);
    }

    const transaction = db.transaction("fields", "readonly")
    const objectStore = transaction.objectStore("fields")
    const showRequest = objectStore.openCursor();

    showRequest.onsuccess = (event) => {
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

            p.textContent = `${cursor.value.fieldName} | ${cursor.value.fieldArea} ha | ${cursor.value.sowedCrop} ${cursor.value.sowedCType}`
            listItem.setAttribute('data-id', cursor.value.id)

            trashBtn.addEventListener('click', deleteItem)
            cursor.continue();
        } else{
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
    const transaction = db.transaction(['fields'], 'readwrite');
    const objectStore = transaction.objectStore('fields');

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
    const transaction = db.transaction(["fields"], "readwrite")
    const objectStore = transaction.objectStore("fields")
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






